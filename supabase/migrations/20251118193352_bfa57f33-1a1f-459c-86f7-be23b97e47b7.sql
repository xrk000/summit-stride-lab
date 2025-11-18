-- Create project_tasks junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.project_tasks (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, task_id)
);

-- Enable RLS
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_tasks
CREATE POLICY "Users can view project_tasks for their projects"
  ON public.project_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tasks to their projects"
  ON public.project_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tasks from their projects"
  ON public.project_tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_task_id ON public.project_tasks(task_id);