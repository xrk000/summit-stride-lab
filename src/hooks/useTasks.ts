import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  completed: boolean;
  due_date: string | null;
  completed_at: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useTasks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  const createTask = useMutation({
    mutationFn: async ({ tagIds, projectId, eventId, ...newTask }: Omit<Task, "id" | "user_id" | "created_at" | "updated_at"> & { tagIds?: string[]; projectId?: string | null; eventId?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tasks")
        .insert([{ ...newTask, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      if (tagIds && tagIds.length > 0 && data) {
        const tagRelations = tagIds.map(tagId => ({ task_id: data.id, tag_id: tagId }));
        const { error: tagError } = await supabase.from("task_tags").insert(tagRelations);
        if (tagError) throw tagError;
      }

      if (projectId && data) {
        const { error: projError } = await supabase
          .from("project_tasks")
          .insert({ project_id: projectId, task_id: data.id });
        if (projError) throw projError;
      }

      if (eventId && data) {
        const { error: evErr } = await supabase
          .from("event_tasks")
          .insert({ event_id: eventId, task_id: data.id });
        if (evErr) throw evErr;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTaskProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projectTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTaskEvents"] });
      queryClient.invalidateQueries({ queryKey: ["eventTasks"] });
      toast({
        title: "Задача создана",
        description: "Задача успешно добавлена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, tagIds, projectId, eventId, ...updates }: Partial<Task> & { id: string; tagIds?: string[]; projectId?: string | null; eventId?: string | null }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (tagIds !== undefined) {
        await supabase.from("task_tags").delete().eq("task_id", id);
        if (tagIds.length > 0) {
          const tagRelations = tagIds.map(tagId => ({ task_id: id, tag_id: tagId }));
          const { error: tagError } = await supabase.from("task_tags").insert(tagRelations);
          if (tagError) throw tagError;
        }
      }

      if (projectId !== undefined) {
        await supabase.from("project_tasks").delete().eq("task_id", id);
        if (projectId) {
          const { error: projError } = await supabase
            .from("project_tasks")
            .insert({ project_id: projectId, task_id: id });
          if (projError) throw projError;
        }
      }

      if (eventId !== undefined) {
        await supabase.from("event_tasks").delete().eq("task_id", id);
        if (eventId) {
          const { error: evErr } = await supabase
            .from("event_tasks")
            .insert({ event_id: eventId, task_id: id });
          if (evErr) throw evErr;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTaskProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projectTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTaskEvents"] });
      queryClient.invalidateQueries({ queryKey: ["eventTasks"] });
      toast({
        title: "Задача обновлена",
        description: "Изменения сохранены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Задача удалена",
        description: "Задача успешно удалена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleTask = useMutation({
    mutationFn: async (id: string) => {
      const task = tasks?.find(t => t.id === id);
      if (!task) throw new Error("Task not found");

      const { data, error } = await supabase
        .from("tasks")
        .update({
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить статус задачи",
        variant: "destructive",
      });
    },
  });

  return {
    tasks: tasks || [],
    isLoading,
    createTask: createTask.mutate,
    createTaskAsync: createTask.mutateAsync,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
    toggleTask: toggleTask.mutate,
  };
};