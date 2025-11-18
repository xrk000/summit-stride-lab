import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAllEventTags = () => {
  return useQuery({
    queryKey: ["allEventTags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_event_tags")
        .select("event_id, tag_id, tags(id, name)");

      if (error) throw error;

      const eventTagsMap = new Map<string, Array<{ id: string; name: string }>>();
      
      data?.forEach(item => {
        if (item.tags) {
          const existing = eventTagsMap.get(item.event_id) || [];
          existing.push({ id: item.tags.id, name: item.tags.name });
          eventTagsMap.set(item.event_id, existing);
        }
      });

      return eventTagsMap;
    },
  });
};
