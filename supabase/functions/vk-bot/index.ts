import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─── VK API ───────────────────────────────────────────────────────────────────

function getRandomId(): number {
    return Math.floor(Math.random() * 2_147_483_647);
}

async function sendVkMessage(peerId: number, text: string, keyboard?: object) {
    const params: Record<string, string> = {
        access_token: Deno.env.get("VK_ACCESS_TOKEN")!,
        v: "5.199",
        random_id: String(getRandomId()),
        peer_id: String(peerId),
        message: text,
    };
    if (keyboard) params.keyboard = JSON.stringify(keyboard);

    const res = await fetch(
        "https://api.vk.com/method/messages.send?" + new URLSearchParams(params)
    );
    const result = await res.json();
    if (result.error) console.error("VK API error:", result.error);
}

// ─── КЛАВИАТУРЫ ───────────────────────────────────────────────────────────────

/** Постоянная нижняя панель — всегда видна */
const mainKeyboard = {
    one_time: false,
    buttons: [
        [
            btn("➕ Добавить", "show_add_menu", "positive"),
            btn("📋 Задачи", "list_tasks", "primary"),
        ],
        [
            btn("📖 Заметки", "list_notes", "primary"),
            btn("🔥 Привычки", "list_habits", "primary"),
        ],
    ],
};

/** Меню создания — one_time (исчезает после нажатия) */
const addMenuKeyboard = {
    one_time: true,
    buttons: [
        [btn("📌 Задача", "create_task", "primary"), btn("📝 Заметка", "create_note", "primary")],
        [btn("📅 Событие", "create_event", "primary"), btn("🔥 Привычка", "create_habit", "primary")],
        [btn("📁 Проект", "create_project", "primary"), btn("❌ Отмена", "cancel", "negative")],
    ],
};

/** Клавиатура с кнопкой Отмена — для диалогов */
const cancelKeyboard = {
    one_time: true,
    buttons: [[btn("❌ Отмена", "cancel", "negative")]],
};

/** Выбор приоритета задачи */
const priorityKeyboard = {
    one_time: true,
    buttons: [
        [
            btn("🔴 Высокий", "priority_high", "negative"),
            btn("🟡 Средний", "priority_medium", "secondary"),
            btn("🟢 Низкий", "priority_low", "positive"),
        ],
        [btn("⏭ Пропустить", "priority_skip", "secondary"), btn("❌ Отмена", "cancel", "negative")],
    ],
};

/** Выбор частоты привычки */
const frequencyKeyboard = {
    one_time: true,
    buttons: [
        [
            btn("📅 Ежедневно", "freq_daily", "primary"),
            btn("📅 Через день", "freq_every_2_days", "secondary"),
            btn("📅 Каждые 3 дня", "freq_every_3_days", "secondary"),
        ],
        [btn("❌ Отмена", "cancel", "negative")],
    ],
};

/** Статус проекта */
const projectStatusKeyboard = {
    one_time: true,
    buttons: [
        [
            btn("▶️ Активный", "status_active", "positive"),
            btn("📋 Запланирован", "status_planned", "secondary"),
            btn("✅ Завершён", "status_completed", "primary"),
        ],
        [btn("❌ Отмена", "cancel", "negative")],
    ],
};

function btn(label: string, action: string, color: string) {
    return {
        action: { type: "text", label, payload: JSON.stringify({ action }) },
        color,
    };
}

// ─── СЕССИИ ───────────────────────────────────────────────────────────────────

async function getSession(userId: string) {
    const { data } = await supabase
        .from("bot_sessions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
    return data;
}

async function setSession(userId: string, peerId: number, state: string, data: any) {
    await supabase.from("bot_sessions").upsert(
        { user_id: userId, vk_peer_id: peerId, state, data, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
    );
}

async function clearSession(userId: string) {
    await supabase.from("bot_sessions").delete().eq("user_id", userId);
}

// ─── ТЕГИ ─────────────────────────────────────────────────────────────────────

const TAG_TABLE: Record<string, { link: string; field: string }> = {
    task: { link: "task_tags", field: "task_id" },
    note: { link: "note_tags", field: "note_id" },
    habit: { link: "habit_tags", field: "habit_id" },
    calendar_event: { link: "calendar_event_tags", field: "event_id" },
    project: { link: "project_tags", field: "project_id" },
};

async function attachTags(
    entityType: keyof typeof TAG_TABLE,
    entityId: string,
    tagsString: string,
    userId: string
) {
    const names = tagsString.split(",").map(t => t.trim()).filter(Boolean);
    if (!names.length) return;

    const tagIds: string[] = [];
    for (const name of names) {
        let { data: tag } = await supabase
            .from("tags").select("id").eq("user_id", userId).eq("name", name).maybeSingle();
        if (!tag) {
            const { data: newTag } = await supabase
                .from("tags").insert({ name, user_id: userId }).select("id").single();
            tag = newTag;
        }
        if (tag) tagIds.push(tag.id);
    }

    const { link, field } = TAG_TABLE[entityType];
    await supabase.from(link).insert(tagIds.map(tid => ({ [field]: entityId, tag_id: tid })));
}

// ─── ПРОСМОТР ДАННЫХ ──────────────────────────────────────────────────────────

async function listTasks(userId: string, peerId: number) {
    const { data } = await supabase
        .from("tasks")
        .select("title, priority, due_date, completed")
        .eq("user_id", userId)
        .eq("completed", false)
        .order("created_at", { ascending: false })
        .limit(7);

    if (!data?.length) {
        await sendVkMessage(peerId, "📋 Активных задач нет.", mainKeyboard);
        return;
    }

    const lines = data.map((t, i) => {
        const prio = t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢";
        const date = t.due_date ? ` · ${t.due_date}` : "";
        return `${i + 1}. ${prio} ${t.title}${date}`;
    });

    await sendVkMessage(peerId, `📋 Активные задачи:\n\n${lines.join("\n")}`, mainKeyboard);
}

async function listNotes(userId: string, peerId: number) {
    const { data } = await supabase
        .from("notes")
        .select("title, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(7);

    if (!data?.length) {
        await sendVkMessage(peerId, "📖 Заметок пока нет.", mainKeyboard);
        return;
    }

    const lines = data.map((n, i) => `${i + 1}. 📝 ${n.title}`);
    await sendVkMessage(peerId, `📖 Последние заметки:\n\n${lines.join("\n")}`, mainKeyboard);
}

async function listHabits(userId: string, peerId: number) {
    const { data: habits } = await supabase
        .from("habits")
        .select("id, name, frequency")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

    if (!habits?.length) {
        await sendVkMessage(peerId, "🔥 Привычек пока нет.", mainKeyboard);
        return;
    }

    // Отмеченные сегодня
    const today = new Date().toISOString().split("T")[0];
    const { data: logs } = await supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("user_id", userId)
        .gte("completed_at", today);

    const doneTodayIds = new Set((logs || []).map(l => l.habit_id));

    const lines = habits.map((h, i) => {
        const done = doneTodayIds.has(h.id) ? "✅" : "⬜";
        const freq = h.frequency === "daily" ? "ежедн." : h.frequency === "every_2_days" ? "через день" : "раз в 3д";
        return `${i + 1}. ${done} ${h.name} (${freq})`;
    });

    await sendVkMessage(
        peerId,
        `🔥 Привычки сегодня:\n\n${lines.join("\n")}\n\n✅ — выполнено сегодня`,
        mainKeyboard
    );
}

// ─── ДИАЛОГИ ──────────────────────────────────────────────────────────────────

async function handleDialog(
    userId: string,
    peerId: number,
    text: string,
    payload: any,
    session: any
): Promise<boolean> {
    const state: string = session.state;
    const data: any = session.data;

    // ── ОТМЕНА из любого состояния ────────────────────────────────
    if (payload?.action === "cancel" || text.toLowerCase() === "отмена") {
        await clearSession(userId);
        await sendVkMessage(peerId, "❌ Отменено.", mainKeyboard);
        return true;
    }

    // ══════════ ЗАДАЧА ════════════════════════════════════════════

    if (state === "awaiting_task_title") {
        data.title = text;
        await setSession(userId, peerId, "awaiting_task_description", data);
        await sendVkMessage(peerId, "Введите описание задачи (или '-' для пропуска):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_task_description") {
        data.description = text !== "-" ? text : "";
        await setSession(userId, peerId, "awaiting_task_due_date", data);
        await sendVkMessage(peerId, "Введите дедлайн (ДД.ММ.ГГГГ) или '-' для пропуска:", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_task_due_date") {
        if (text !== "-") {
            const m = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
            if (!m) {
                await sendVkMessage(peerId, "❌ Неверный формат. Попробуйте ДД.ММ.ГГГГ или '-':", cancelKeyboard);
                return true;
            }
            data.due_date = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
        }
        await setSession(userId, peerId, "awaiting_task_priority", data);
        await sendVkMessage(peerId, "Выберите приоритет:", priorityKeyboard);
        return true;
    }

    if (state === "awaiting_task_priority") {
        const actionMap: Record<string, string> = {
            priority_high: "high", priority_medium: "medium", priority_low: "low"
        };
        if (payload?.action && actionMap[payload.action]) {
            data.priority = actionMap[payload.action];
        }
        // priority_skip — оставляем пустым
        await setSession(userId, peerId, "awaiting_task_tags", data);
        await sendVkMessage(peerId, "Введите теги через запятую (или '-' для пропуска):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_task_tags") {
        if (text !== "-") data.tags = text;
        const { data: newTask, error } = await supabase
            .from("tasks")
            .insert({
                title: data.title, description: data.description || null, user_id: userId,
                due_date: data.due_date || null, priority: data.priority || null, completed: false
            })
            .select("id").single();
        if (error) {
            await sendVkMessage(peerId, `❌ Ошибка: ${error.message}`, mainKeyboard);
        } else {
            if (data.tags) await attachTags("task", newTask.id, data.tags, userId);
            await sendVkMessage(peerId, `✅ Задача «${data.title}» создана!`, mainKeyboard);
        }
        await clearSession(userId);
        return true;
    }

    // ══════════ ЗАМЕТКА ═══════════════════════════════════════════

    if (state === "awaiting_note_title") {
        data.title = text;
        await setSession(userId, peerId, "awaiting_note_content", data);
        await sendVkMessage(peerId, "Введите содержимое заметки (или '-' для пустой):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_note_content") {
        data.content = text !== "-" ? text : "";
        await setSession(userId, peerId, "awaiting_note_tags", data);
        await sendVkMessage(peerId, "Введите теги через запятую (или '-'):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_note_tags") {
        if (text !== "-") data.tags = text;
        const { data: newNote, error } = await supabase
            .from("notes")
            .insert({ title: data.title, content: data.content || null, user_id: userId })
            .select("id").single();
        if (error) {
            await sendVkMessage(peerId, `❌ Ошибка: ${error.message}`, mainKeyboard);
        } else {
            if (data.tags) await attachTags("note", newNote.id, data.tags, userId);
            await sendVkMessage(peerId, `✅ Заметка «${data.title}» сохранена!`, mainKeyboard);
        }
        await clearSession(userId);
        return true;
    }

    // ══════════ СОБЫТИЕ ═══════════════════════════════════════════

    if (state === "awaiting_event_title") {
        data.title = text;
        await setSession(userId, peerId, "awaiting_event_description", data);
        await sendVkMessage(peerId, "Введите описание (или '-'):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_event_description") {
        data.description = text !== "-" ? text : "";
        await setSession(userId, peerId, "awaiting_event_date", data);
        await sendVkMessage(peerId, "Введите дату события (ДД.ММ.ГГГГ):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_event_date") {
        const m = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (!m) {
            await sendVkMessage(peerId, "❌ Неверный формат. Введите ДД.ММ.ГГГГ:", cancelKeyboard);
            return true;
        }
        data.date = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
        await setSession(userId, peerId, "awaiting_event_time", data);
        await sendVkMessage(peerId, "Введите время (ЧЧ:ММ) или '-' для пропуска:", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_event_time") {
        if (text !== "-") {
            const m = text.match(/(\d{1,2}):(\d{2})/);
            if (m) data.time = text;
        }
        await setSession(userId, peerId, "awaiting_event_tags", data);
        await sendVkMessage(peerId, "Введите теги через запятую (или '-'):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_event_tags") {
        if (text !== "-") data.tags = text;
        const { data: newEvent, error } = await supabase
            .from("calendar_events")
            .insert({
                title: data.title, description: data.description || null, user_id: userId,
                date: data.date, time: data.time || null, source: "manual"
            })
            .select("id").single();
        if (error) {
            await sendVkMessage(peerId, `❌ Ошибка: ${error.message}`, mainKeyboard);
        } else {
            if (data.tags) await attachTags("calendar_event", newEvent.id, data.tags, userId);
            await sendVkMessage(peerId, `✅ Событие «${data.title}» создано на ${data.date}!`, mainKeyboard);
        }
        await clearSession(userId);
        return true;
    }

    // ══════════ ПРИВЫЧКА ══════════════════════════════════════════

    if (state === "awaiting_habit_name") {
        data.name = text;
        await setSession(userId, peerId, "awaiting_habit_description", data);
        await sendVkMessage(peerId, "Введите описание привычки (или '-'):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_habit_description") {
        data.description = text !== "-" ? text : "";
        await setSession(userId, peerId, "awaiting_habit_frequency", data);
        await sendVkMessage(peerId, "Выберите периодичность:", frequencyKeyboard);
        return true;
    }

    if (state === "awaiting_habit_frequency") {
        const freqMap: Record<string, string> = {
            freq_daily: "daily", freq_every_2_days: "every_2_days", freq_every_3_days: "every_3_days"
        };
        if (payload?.action && freqMap[payload.action]) {
            data.frequency = freqMap[payload.action];
        } else {
            await sendVkMessage(peerId, "Пожалуйста, нажмите одну из кнопок:", frequencyKeyboard);
            return true;
        }
        await setSession(userId, peerId, "awaiting_habit_tags", data);
        await sendVkMessage(peerId, "Введите теги через запятую (или '-'):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_habit_tags") {
        if (text !== "-") data.tags = text;
        const { data: newHabit, error } = await supabase
            .from("habits")
            .insert({
                name: data.name, description: data.description || null,
                frequency: data.frequency, user_id: userId
            })
            .select("id").single();
        if (error) {
            await sendVkMessage(peerId, `❌ Ошибка: ${error.message}`, mainKeyboard);
        } else {
            if (data.tags) await attachTags("habit", newHabit.id, data.tags, userId);
            await sendVkMessage(peerId, `✅ Привычка «${data.name}» создана (${data.frequency})!`, mainKeyboard);
        }
        await clearSession(userId);
        return true;
    }

    // ══════════ ПРОЕКТ ════════════════════════════════════════════

    if (state === "awaiting_project_name") {
        data.name = text;
        await setSession(userId, peerId, "awaiting_project_description", data);
        await sendVkMessage(peerId, "Введите описание проекта (или '-'):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_project_description") {
        data.description = text !== "-" ? text : "";
        await setSession(userId, peerId, "awaiting_project_status", data);
        await sendVkMessage(peerId, "Выберите статус проекта:", projectStatusKeyboard);
        return true;
    }

    if (state === "awaiting_project_status") {
        const statusMap: Record<string, string> = {
            status_active: "active", status_planned: "planned", status_completed: "completed"
        };
        data.status = (payload?.action && statusMap[payload.action]) ? statusMap[payload.action] : "active";
        await setSession(userId, peerId, "awaiting_project_tags", data);
        await sendVkMessage(peerId, "Введите теги через запятую (или '-'):", cancelKeyboard);
        return true;
    }

    if (state === "awaiting_project_tags") {
        if (text !== "-") data.tags = text;
        const { data: newProject, error } = await supabase
            .from("projects")
            .insert({
                name: data.name, description: data.description || null,
                status: data.status || "active", user_id: userId
            })
            .select("id").single();
        if (error) {
            await sendVkMessage(peerId, `❌ Ошибка: ${error.message}`, mainKeyboard);
        } else {
            if (data.tags) await attachTags("project", newProject.id, data.tags, userId);
            await sendVkMessage(peerId, `✅ Проект «${data.name}» создан!`, mainKeyboard);
        }
        await clearSession(userId);
        return true;
    }

    return false;
}

// ─── ГЛАВНЫЙ ОБРАБОТЧИК ───────────────────────────────────────────────────────

serve(async (req) => {
    try {
        const body = await req.json();

        // 1. Confirmation
        if (body.type === "confirmation") {
            const token = Deno.env.get("VK_CONFIRMATION_TOKEN");
            if (!token) return new Response("error", { status: 500 });
            return new Response(token, { status: 200 });
        }

        // 2. Secret key
        const secretKey = Deno.env.get("VK_SECRET_KEY");
        if (secretKey && body.secret !== secretKey) {
            return new Response("Invalid secret", { status: 403 });
        }

        // 3. Только message_new
        if (body.type !== "message_new") return new Response("ok");

        const msg = body.object.message;
        const peerId = msg.peer_id;
        const vkUserId = msg.from_id;
        const text = msg.text?.trim() || "";
        const payload = msg.payload ? JSON.parse(msg.payload) : null;

        // 4. Найти пользователя
        const { data: connection } = await supabase
            .from("vk_connections")
            .select("user_id")
            .eq("vk_user_id", vkUserId)
            .eq("verified", true)
            .maybeSingle();

        if (!connection) {
            // не привязан — проверяем, не прислал ли код привязки
            const codeMatch = text.match(/MOMENTUM-\d{4}/i);
            if (codeMatch) {
                const code = codeMatch[0].toUpperCase();
                const { data: pending } = await supabase
                    .from("vk_connections")
                    .select("user_id")
                    .eq("link_code", code)
                    .eq("verified", false)
                    .maybeSingle();

                if (!pending) {
                    await sendVkMessage(peerId, "❌ Код не найден или уже использован. Получите новый код в приложении.");
                    return new Response("ok");
                }

                // подтверждаем: записываем реальный from_id и verified = true
                const { error: linkErr } = await supabase
                    .from("vk_connections")
                    .update({ vk_user_id: vkUserId, verified: true, link_code: null })
                    .eq("user_id", pending.user_id)
                    .eq("link_code", code);

                if (linkErr) {
                    await sendVkMessage(peerId, `❌ Ошибка привязки: ${linkErr.message}`);
                } else {
                    await sendVkMessage(
                        peerId,
                        "✅ VK успешно привязан к вашему аккаунту ProductiveMe!\n\nТеперь управляйте задачами, заметками и привычками прямо здесь.",
                        mainKeyboard
                    );
                }
                return new Response("ok");
            }

            await sendVkMessage(
                peerId,
                "❌ Ваш VK не привязан к аккаунту.\n\nОткройте приложение ProductiveMe → Профиль → Интеграции → ВКонтакте, нажмите «Получить код привязки» и отправьте код сюда."
            );
            return new Response("ok");
        }

        const userId = connection.user_id;

        // 5. Активная сессия диалога?
        const session = await getSession(userId);
        if (session) {
            const handled = await handleDialog(userId, peerId, text, payload, session);
            if (handled) return new Response("ok");
        }

        // 6. Обработка кнопок главного меню
        const action = payload?.action;

        if (action === "show_add_menu") {
            await sendVkMessage(peerId, "Что хотите создать?", addMenuKeyboard);
            return new Response("ok");
        }

        if (action === "list_tasks") {
            await listTasks(userId, peerId);
            return new Response("ok");
        }

        if (action === "list_notes") {
            await listNotes(userId, peerId);
            return new Response("ok");
        }

        if (action === "list_habits") {
            await listHabits(userId, peerId);
            return new Response("ok");
        }

        if (action === "create_task") {
            await setSession(userId, peerId, "awaiting_task_title", {});
            await sendVkMessage(peerId, "📌 Введите название задачи:", cancelKeyboard);
            return new Response("ok");
        }

        if (action === "create_note") {
            await setSession(userId, peerId, "awaiting_note_title", {});
            await sendVkMessage(peerId, "📝 Введите название заметки:", cancelKeyboard);
            return new Response("ok");
        }

        if (action === "create_event") {
            await setSession(userId, peerId, "awaiting_event_title", {});
            await sendVkMessage(peerId, "📅 Введите название события:", cancelKeyboard);
            return new Response("ok");
        }

        if (action === "create_habit") {
            await setSession(userId, peerId, "awaiting_habit_name", {});
            await sendVkMessage(peerId, "🔥 Введите название привычки:", cancelKeyboard);
            return new Response("ok");
        }

        if (action === "create_project") {
            await setSession(userId, peerId, "awaiting_project_name", {});
            await sendVkMessage(peerId, "📁 Введите название проекта:", cancelKeyboard);
            return new Response("ok");
        }

        if (action === "cancel") {
            await clearSession(userId);
            await sendVkMessage(peerId, "❌ Отменено.", mainKeyboard);
            return new Response("ok");
        }

        // 7. Любое другое сообщение — показываем главное меню
        await sendVkMessage(
            peerId,
            "👋 Привет! Я бот ProductiveMe.\n\nИспользуй кнопки ниже для управления задачами, заметками и привычками.",
            mainKeyboard
        );

        return new Response("ok");
    } catch (err) {
        console.error("Unexpected error:", err);
        return new Response("ok"); // VK требует "ok" даже при ошибке
    }
});