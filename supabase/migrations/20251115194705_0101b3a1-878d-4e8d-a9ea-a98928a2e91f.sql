-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false,
  completed_at timestamptz,
  priority text,
  due_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.tasks enable row level security;

drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Create notes table
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.notes enable row level security;

drop policy if exists "Users can view their own notes" on public.notes;
create policy "Users can view their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notes" on public.notes;
create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Create habits table
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  frequency text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.habits enable row level security;

drop policy if exists "Users can view their own habits" on public.habits;
create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own habits" on public.habits;
create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own habits" on public.habits;
create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own habits" on public.habits;
create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- Create habit_entries table
create table if not exists public.habit_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  date date not null,
  completed boolean default false,
  created_at timestamptz default now() not null
);

alter table public.habit_entries enable row level security;

drop policy if exists "Users can view their own habit entries" on public.habit_entries;
create policy "Users can view their own habit entries"
  on public.habit_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own habit entries" on public.habit_entries;
create policy "Users can insert their own habit entries"
  on public.habit_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own habit entries" on public.habit_entries;
create policy "Users can update their own habit entries"
  on public.habit_entries for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own habit entries" on public.habit_entries;
create policy "Users can delete their own habit entries"
  on public.habit_entries for delete
  using (auth.uid() = user_id);

-- Create calendar_events table
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  date date not null,
  time text,
  type text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.calendar_events enable row level security;

drop policy if exists "Users can view their own calendar events" on public.calendar_events;
create policy "Users can view their own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own calendar events" on public.calendar_events;
create policy "Users can insert their own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own calendar events" on public.calendar_events;
create policy "Users can update their own calendar events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own calendar events" on public.calendar_events;
create policy "Users can delete their own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

-- Create projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  status text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.projects enable row level security;

drop policy if exists "Users can view their own projects" on public.projects;
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own projects" on public.projects;
create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);