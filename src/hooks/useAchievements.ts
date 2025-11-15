import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  earned?: boolean;
  earned_at?: string;
}

export const useAchievements = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*");

      if (achievementsError) throw achievementsError;

      // Fetch user's earned achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at")
        .eq("user_id", user.id);

      if (userAchievementsError) throw userAchievementsError;

      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id));

      return allAchievements?.map(achievement => ({
        ...achievement,
        earned: earnedIds.has(achievement.id),
        earned_at: userAchievements?.find(ua => ua.achievement_id === achievement.id)?.earned_at,
      })) as Achievement[];
    },
  });
};
