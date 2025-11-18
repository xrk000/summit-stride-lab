import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAllHabitTags = () => {
  return useQuery({
    queryKey: ["allHabitTags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_tags")
        .select("habit_id, tag_id, tags(id, name)");

      if (error) throw error;

      const habitTagsMap = new Map<string, Array<{ id: string; name: string }>>();
      
      data?.forEach(item => {
        if (item.tags) {
          const existing = habitTagsMap.get(item.habit_id) || [];
          existing.push({ id: item.tags.id, name: item.tags.name });
          habitTagsMap.set(item.habit_id, existing);
        }
      });

      return habitTagsMap;
    },
  });
};
