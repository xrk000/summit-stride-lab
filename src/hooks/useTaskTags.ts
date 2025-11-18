import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTaskTags = (taskId: string | null) => {
  return useQuery({
    queryKey: ["taskTags", taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from("task_tags")
        .select("tag_id, tags(id, name)")
        .eq("task_id", taskId);

      if (error) throw error;
      
      return data
        .map(item => item.tags)
        .filter(Boolean)
        .map(tag => ({ id: tag.id, name: tag.name }));
    },
    enabled: !!taskId,
  });
};
