import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useEventTasks = (eventId: string | null) => {
  return useQuery({
    queryKey: ["eventTasks", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_tasks")
        .select("task_id, tasks(*)")
        .eq("event_id", eventId);
      if (error) throw error;
      return (data || []).map((r: any) => r.tasks).filter(Boolean);
    },
    enabled: !!eventId,
  });
};
