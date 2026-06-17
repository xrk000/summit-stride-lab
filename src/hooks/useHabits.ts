import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface HabitEntry {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  user_id: string;
  created_at: string;
}

export const useHabits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: habits, isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Habit[];
    },
  });

  const { data: habitEntries } = useQuery({
    queryKey: ["habitEntries"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("habit_entries")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as HabitEntry[];
    },
  });

  const createHabit = useMutation({
    mutationFn: async (newHabit: Omit<Habit, "id" | "user_id" | "created_at" | "updated_at"> & { tagIds?: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const { tagIds, ...habitData } = newHabit;

      const { data, error } = await supabase
        .from("habits")
        .insert([{ ...habitData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Добавляем теги, если они есть
      if (tagIds && tagIds.length > 0 && data) {
        const habitTags = tagIds.map(tagId => ({
          habit_id: data.id,
          tag_id: tagId
        }));
        
        const { error: tagsError } = await supabase
          .from("habit_tags")
          .insert(habitTags);
        
        if (tagsError) console.error("Error adding tags:", tagsError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.invalidateQueries({ queryKey: ["habitTags"] });
      toast({
        title: "Привычка создана",
        description: "Привычка успешно добавлена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHabit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Habit> & { id: string }) => {
      const { data, error } = await supabase
        .from("habits")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast({
        title: "Привычка обновлена",
        description: "Изменения сохранены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      toast({
        title: "Привычка удалена",
        description: "Привычка успешно удалена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleHabitEntry = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      // Проверяем, есть ли уже запись
      const { data: existing } = await supabase
        .from("habit_entries")
        .select("*")
        .eq("habit_id", habitId)
        .eq("date", date)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Обновляем существующую запись
        const { error } = await supabase
          .from("habit_entries")
          .update({ completed: !existing.completed })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Создаем новую запись
        const { error } = await supabase
          .from("habit_entries")
          .insert([{ habit_id: habitId, date, completed: true, user_id: user.id }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habitEntries"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  return {
    habits: habits || [],
    habitEntries: habitEntries || [],
    isLoading,
    createHabit: createHabit.mutate,
    updateHabit: updateHabit.mutate,
    deleteHabit: deleteHabit.mutate,
    toggleHabitEntry: toggleHabitEntry.mutate,
  };
};
