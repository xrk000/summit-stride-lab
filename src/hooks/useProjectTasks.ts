import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export const useProjectTasks = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projectTasks = [], refetch } = useQuery({
    queryKey: ["projectTasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          task_id,
          tasks (*)
        `)
        .eq("project_id", projectId);

      if (error) throw error;
      return data.map(pt => pt.tasks).filter(Boolean);
    },
    enabled: !!projectId,
  });

  // Refetch when projectId changes
  useEffect(() => {
    if (projectId) {
      refetch();
    }
  }, [projectId, refetch]);

  const addTaskToProject = useMutation({
    mutationFn: async ({ projectId, taskId }: { projectId: string; taskId: string }) => {
      const { error } = await supabase
        .from("project_tasks")
        .insert({ project_id: projectId, task_id: taskId });

      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast({
        title: "Задача добавлена",
        description: "Задача успешно добавлена к проекту",
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

  const removeTaskFromProject = useMutation({
    mutationFn: async ({ projectId, taskId }: { projectId: string; taskId: string }) => {
      const { error } = await supabase
        .from("project_tasks")
        .delete()
        .eq("project_id", projectId)
        .eq("task_id", taskId);

      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast({
        title: "Задача удалена",
        description: "Задача удалена из проекта",
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

  return {
    projectTasks,
    addTaskToProject: addTaskToProject.mutate,
    removeTaskFromProject: removeTaskFromProject.mutate,
  };
};
