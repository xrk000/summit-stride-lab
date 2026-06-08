import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAllTaskEvents = () => {
  return useQuery({
    queryKey: ["allTaskEvents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tasks")
        .select("task_id, event_id");
      if (error) throw error;
      // Map: task_id -> event_id
      const map = new Map<string, string>();
      for (const row of data || []) {
        map.set(row.task_id, row.event_id);
      }
      return map;
    },
  });
};
