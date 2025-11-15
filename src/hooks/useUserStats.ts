import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserStats = () => {
  return useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {
        tasksCompleted: 0,
        totalTasks: 0,
        notesCreated: 0,
        habitsTracked: 0,
        projectsActive: 0,
        calendarEvents: 0,
      };

      const [tasks, completedTasks, notes, habits, events, projects] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("calendar_events").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      return {
        tasksCompleted: completedTasks.count || 0,
        totalTasks: tasks.count || 0,
        notesCreated: notes.count || 0,
        habitsTracked: habits.count || 0,
        projectsActive: projects.count || 0,
        calendarEvents: events.count || 0,
      };
    },
  });
};
