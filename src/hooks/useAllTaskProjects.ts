import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAllTaskProjects = () => {
  return useQuery({
    queryKey: ["allTaskProjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks")
        .select("task_id, project_id");
      if (error) throw error;
      const map = new Map<string, string>();
      for (const row of data || []) {
        map.set(row.task_id, row.project_id);
      }
      return map;
    },
  });
};
