-- Создаем таблицу тегов
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Включаем RLS для тегов
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags"
  ON public.tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON public.tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.tags FOR DELETE
  USING (auth.uid() = user_id);

-- Создаем таблицы связей тегов с сущностями
CREATE TABLE public.task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE public.note_tags (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE public.habit_tags (
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (habit_id, tag_id)
);

CREATE TABLE public.project_tags (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE public.calendar_event_tags (
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

-- Включаем RLS для таблиц связей
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_tags ENABLE ROW LEVEL SECURITY;

-- Политики для task_tags
CREATE POLICY "Users can view tags for their tasks"
  ON public.task_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can add tags to their tasks"
  ON public.task_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can remove tags from their tasks"
  ON public.task_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
  ));

-- Политики для note_tags
CREATE POLICY "Users can view tags for their notes"
  ON public.note_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can add tags to their notes"
  ON public.note_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can remove tags from their notes"
  ON public.note_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
  ));

-- Политики для habit_tags
CREATE POLICY "Users can view tags for their habits"
  ON public.habit_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_tags.habit_id AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can add tags to their habits"
  ON public.habit_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_tags.habit_id AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can remove tags from their habits"
  ON public.habit_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_tags.habit_id AND habits.user_id = auth.uid()
  ));

-- Политики для project_tags
CREATE POLICY "Users can view tags for their projects"
  ON public.project_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_tags.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can add tags to their projects"
  ON public.project_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_tags.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can remove tags from their projects"
  ON public.project_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_tags.project_id AND projects.user_id = auth.uid()
  ));

-- Политики для calendar_event_tags
CREATE POLICY "Users can view tags for their events"
  ON public.calendar_event_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM calendar_events WHERE calendar_events.id = calendar_event_tags.event_id AND calendar_events.user_id = auth.uid()
  ));

CREATE POLICY "Users can add tags to their events"
  ON public.calendar_event_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM calendar_events WHERE calendar_events.id = calendar_event_tags.event_id AND calendar_events.user_id = auth.uid()
  ));

CREATE POLICY "Users can remove tags from their events"
  ON public.calendar_event_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM calendar_events WHERE calendar_events.id = calendar_event_tags.event_id AND calendar_events.user_id = auth.uid()
  ));

-- Создаем таблицу для вложений
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'note')),
  entity_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attachments"
  ON public.attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
  ON public.attachments FOR DELETE
  USING (auth.uid() = user_id);

-- Создаем таблицу для пользовательских настроек
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Создаем триггер для обновления updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Создаем storage bucket для вложений
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

-- Политики для storage bucket attachments
CREATE POLICY "Users can view their own attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own attachments"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);