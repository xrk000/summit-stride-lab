import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAllTaskTags = () => {
  return useQuery({
    queryKey: ["allTaskTags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_tags")
        .select("task_id, tag_id, tags(id, name)");

      if (error) throw error;

      // Группируем теги по task_id
      const taskTagsMap = new Map<string, Array<{ id: string; name: string }>>();
      
      data?.forEach(item => {
        if (item.tags) {
          const existing = taskTagsMap.get(item.task_id) || [];
          existing.push({ id: item.tags.id, name: item.tags.name });
          taskTagsMap.set(item.task_id, existing);
        }
      });

      return taskTagsMap;
    },
  });
};
