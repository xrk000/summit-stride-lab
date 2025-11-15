import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfDay } from "date-fns";

export const useActivityData = (days: number = 7) => {
  return useQuery({
    queryKey: ["activityData", days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);

      // Fetch tasks completed per day
      const { data: tasks } = await supabase
        .from("tasks")
        .select("completed_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("completed_at", startDate.toISOString());

      // Fetch notes created per day
      const { data: notes } = await supabase
        .from("notes")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString());

      // Fetch habit entries per day
      const { data: habitEntries } = await supabase
        .from("habit_entries")
        .select("date")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("date", format(startDate, "yyyy-MM-dd"));

      // Create date map
      const activityMap: Record<string, { tasks: number; notes: number; habits: number }> = {};
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(endDate, i), "yyyy-MM-dd");
        activityMap[date] = { tasks: 0, notes: 0, habits: 0 };
      }

      // Count tasks
      tasks?.forEach(task => {
        if (task.completed_at) {
          const date = format(new Date(task.completed_at), "yyyy-MM-dd");
          if (activityMap[date]) activityMap[date].tasks++;
        }
      });

      // Count notes
      notes?.forEach(note => {
        const date = format(new Date(note.created_at), "yyyy-MM-dd");
        if (activityMap[date]) activityMap[date].notes++;
      });

      // Count habits
      habitEntries?.forEach(entry => {
        if (activityMap[entry.date]) activityMap[entry.date].habits++;
      });

      // Convert to array for charts
      return Object.entries(activityMap)
        .map(([date, counts]) => ({
          date: format(new Date(date), "dd MMM"),
          tasks: counts.tasks,
          notes: counts.notes,
          habits: counts.habits,
        }))
        .reverse();
    },
  });
};
