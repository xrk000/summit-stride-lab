-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  timezone text default 'GMT+3',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create achievements table
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  icon text not null,
  condition_type text not null, -- 'tasks_completed', 'habits_streak', 'notes_created', etc.
  condition_value integer not null,
  created_at timestamptz default now() not null
);

-- Enable RLS for achievements (public read)
alter table public.achievements enable row level security;

create policy "Anyone can view achievements"
  on public.achievements for select
  using (true);

-- Create user_achievements table
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  earned_at timestamptz default now() not null,
  unique(user_id, achievement_id)
);

-- Enable RLS
alter table public.user_achievements enable row level security;

create policy "Users can view their own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert their own achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- Insert default achievements
insert into public.achievements (name, description, icon, condition_type, condition_value) values
  ('Первые шаги', 'Выполните 10 задач', 'CheckCircle2', 'tasks_completed', 10),
  ('Продуктивный старт', 'Выполните 50 задач', 'Target', 'tasks_completed', 50),
  ('Мастер задач', 'Выполните 100 задач', 'Trophy', 'tasks_completed', 100),
  ('Неделя привычек', 'Отслеживайте привычки 7 дней подряд', 'Calendar', 'habits_streak', 7),
  ('Месяц дисциплины', 'Отслеживайте привычки 30 дней подряд', 'Star', 'habits_streak', 30),
  ('Заметки начинающего', 'Создайте 10 заметок', 'FileText', 'notes_created', 10),
  ('Проектный старт', 'Создайте 3 проекта', 'FolderOpen', 'projects_created', 3);

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger to create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for profiles updated_at
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();