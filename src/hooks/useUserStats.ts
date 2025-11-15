import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserStats = () => {
  return useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch tasks stats
      const { count: totalTasks } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: completedTasks } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);

      // Fetch notes count
      const { count: notesCount } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch habits count
      const { count: habitsCount } = await supabase
        .from("habits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch calendar events count
      const { count: eventsCount } = await supabase
        .from("calendar_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch projects count
      const { count: projectsCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      return {
        tasksCompleted: completedTasks || 0,
        totalTasks: totalTasks || 0,
        notesCreated: notesCount || 0,
        habitsTracked: habitsCount || 0,
        projectsActive: projectsCount || 0,
        calendarEvents: eventsCount || 0,
      };
    },
  });
};
