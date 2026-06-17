import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserPreferences {
  tasks?: {
    sortBy?: string;
    filterBy?: string;
    selectedTags?: string[];
  };
  notes?: {
    sortBy?: string;
    filterBy?: string;
    selectedTags?: string[];
  };
  habits?: {
    sortBy?: string;
    filterBy?: string;
    selectedTags?: string[];
  };
  projects?: {
    sortBy?: string;
    filterBy?: string;
    selectedTags?: string[];
  };
  calendar?: {
    sortBy?: string;
    filterBy?: string;
    selectedTags?: string[];
  };
}

export const useUserPreferences = () => {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["userPreferences"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.preferences as UserPreferences || {};
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: UserPreferences) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_preferences")
          .update({ preferences: newPreferences as any })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_preferences")
          .insert([{ user_id: user.id, preferences: newPreferences as any }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
    },
  });

  return {
    preferences: preferences || {},
    isLoading,
    updatePreferences: updatePreferences.mutate,
  };
};
