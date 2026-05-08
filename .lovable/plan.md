
## Цель
Добавить кнопку «Подключить Google Calendar» в приложение, чтобы каждый пользователь мог авторизовать свой аккаунт Google и импортировать события (включая билеты, встречи и пр.) в таблицу `calendar_events`.

## Важное уточнение про подход
Встроенный коннектор Lovable Cloud Google Calendar даёт доступ только к **аккаунту разработчика** — это не подходит, нужно чтобы каждый пользователь подключал **свой** календарь.

Поэтому используем **per-user OAuth через Supabase Auth с Google-провайдером**, расширенный скоупом `https://www.googleapis.com/auth/calendar.readonly`. Supabase вернёт `provider_token` (access token Google), которым и будем дёргать Google Calendar API.

## Что нужно от пользователя
1. В Google Cloud Console:
   - Создать OAuth 2.0 Client ID (Web application)
   - Включить **Google Calendar API**
   - В OAuth consent screen добавить scope `.../auth/calendar.readonly`
   - В Authorized redirect URIs указать callback URL из настроек Lovable Cloud → Auth → Google
2. Передать Client ID и Client Secret в Lovable Cloud → Auth Settings → Google (заменив managed credentials, т.к. для запроса дополнительного скоупа нужны свои).

Без этого шага импорт работать не будет — managed-креды Lovable не запрашивают calendar-скоуп.

## Архитектура решения

### 1. Хранение токенов Google
Новая таблица `google_integrations`:
- `user_id` (uuid, PK, FK на auth.users)
- `provider_token` (text) — access token
- `provider_refresh_token` (text) — refresh token
- `expires_at` (timestamptz)
- `last_sync_at` (timestamptz, nullable)

RLS: только владелец читает/пишет свою запись.

В `calendar_events` добавить колонки:
- `google_event_id` (text, nullable) — для дедупликации
- `source` (text, default 'manual') — 'manual' | 'google'

Уникальный индекс `(user_id, google_event_id) where google_event_id is not null`.

### 2. Frontend: страница Profile / Calendar
Кнопка «Подключить Google Calendar»:
- Вызывает `supabase.auth.signInWithOAuth({ provider: 'google', options: { scopes: 'https://www.googleapis.com/auth/calendar.readonly', queryParams: { access_type: 'offline', prompt: 'consent' }, redirectTo: ... } })`.
- После redirect обратно — в `onAuthStateChange` ловим `session.provider_token` / `provider_refresh_token` и сохраняем в `google_integrations` через edge function (чтобы refresh_token не лежал в браузере без шифрования).

Кнопка «Импортировать события» — вызывает edge function `google-calendar-sync`.

Статус подключения и время последней синхронизации показываются на странице Profile.

### 3. Edge function `google-calendar-sync`
- Проверяет JWT, получает `user_id`.
- Читает токены из `google_integrations` (через service role).
- Если `expires_at` прошёл — обновляет access token через Google `oauth2/token` endpoint и Client ID/Secret (хранятся как секреты `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`).
- Делает GET `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=...&singleEvents=true&maxResults=250` (с пагинацией через `pageToken`).
- Маппит каждое событие в `calendar_events`:
  - `title` ← `summary`
  - `description` ← `description` + `location`
  - `date` ← `start.date` или дата из `start.dateTime`
  - `time` ← время из `start.dateTime`
  - `type` ← 'google'
  - `google_event_id` ← `id`
  - `source` ← 'google'
- UPSERT по `(user_id, google_event_id)` — повторный импорт обновляет существующие записи и не создаёт дубли.
- Обновляет `last_sync_at`.

### 4. Секреты
Добавить в Lovable Cloud:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

(те же значения, что в Auth Settings — нужны для refresh token в edge function).

## План работ

1. Миграция БД: таблица `google_integrations`, колонки `google_event_id`/`source` в `calendar_events`, RLS, индексы.
2. Запросить у пользователя `GOOGLE_OAUTH_CLIENT_ID` и `GOOGLE_OAUTH_CLIENT_SECRET` через secrets tool (после того, как он создаст OAuth client в Google Cloud).
3. Edge function `google-calendar-sync` (импорт + refresh токена).
4. Edge function `save-google-tokens` (принимает provider_token/refresh_token из клиента после OAuth и сохраняет).
5. UI на странице Profile:
   - Карточка «Google Calendar» с кнопками «Подключить» / «Синхронизировать сейчас» / «Отключить».
   - Индикатор статуса и времени последней синхронизации.
6. Хук `useGoogleCalendar` для инкапсуляции логики.
7. После импорта — `queryClient.invalidateQueries(['calendarEvents'])`, чтобы события появились в `/calendar`.

## Что вне scope (можно добавить позже)
- Двусторонняя синхронизация (по требованию проекта интеграции **только односторонние** — импорт В систему, это соответствует).
- Webhook-подписка на изменения календаря Google (push notifications) — пока ручной/периодический pull.
- Автоматический импорт по расписанию (cron) — можно добавить через pg_cron позже.

## Ограничение
«Билеты, ж/д и т.п.» попадают в Google Calendar через Gmail-парсинг Google. В Calendar API они выглядят как обычные события, поэтому отдельной обработки не требуют — импортируются вместе со всеми событиями `primary` календаря.
