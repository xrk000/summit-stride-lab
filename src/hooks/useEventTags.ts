import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useEventTags = (eventId: string | null) => {
  return useQuery({
    queryKey: ["eventTags", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from("calendar_event_tags")
        .select("tag_id, tags(id, name)")
        .eq("event_id", eventId);

      if (error) throw error;
      
      return data
        .map(item => item.tags)
        .filter(Boolean)
        .map(tag => ({ id: tag.id, name: tag.name }));
    },
    enabled: !!eventId,
  });
};
