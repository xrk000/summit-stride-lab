import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useHabitTags = (habitId: string | null) => {
  return useQuery({
    queryKey: ["habitTags", habitId],
    queryFn: async () => {
      if (!habitId) return [];

      const { data, error } = await supabase
        .from("habit_tags")
        .select("tag_id, tags(id, name)")
        .eq("habit_id", habitId);

      if (error) throw error;
      
      return data
        .map(item => item.tags)
        .filter(Boolean)
        .map(tag => ({ id: tag.id, name: tag.name }));
    },
    enabled: !!habitId,
  });
};
