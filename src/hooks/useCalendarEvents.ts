import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  type: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Поля интеграций
  source?: string | null;        // 'manual' | 'google' | 'yandex'
  google_event_id?: string | null;
  yandex_event_uid?: string | null;
  is_modified?: boolean;
}

export const useCalendarEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["calendarEvents"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async ({ taskIds, ...newEvent }: Omit<CalendarEvent, "id" | "user_id" | "created_at" | "updated_at" | "source" | "google_event_id"> & { taskIds?: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("calendar_events")
        .insert([{ ...newEvent, user_id: user.id, source: "manual" }])
        .select()
        .single();

      if (error) throw error;

      if (taskIds && taskIds.length > 0 && data) {
        await supabase.from("event_tasks").insert(
          taskIds.map(taskId => ({ event_id: data.id, task_id: taskId }))
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.invalidateQueries({ queryKey: ["eventTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTaskEvents"] });
      toast({
        title: "Событие создано",
        description: "Событие успешно добавлено",
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

  const updateEvent = useMutation({
    mutationFn: async ({ id, taskIds, ...updates }: Partial<CalendarEvent> & { id: string; taskIds?: string[] }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (taskIds !== undefined) {
        await supabase.from("event_tasks").delete().eq("event_id", id);
        if (taskIds.length > 0) {
          await supabase.from("event_tasks").insert(
            taskIds.map(taskId => ({ event_id: id, task_id: taskId }))
          );
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      queryClient.invalidateQueries({ queryKey: ["eventTasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTaskEvents"] });
      toast({
        title: "Событие обновлено",
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

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      toast({
        title: "Событие удалено",
        description: "Событие успешно удалено",
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

  return {
    events: events || [],
    isLoading,
    createEvent: createEvent.mutate,
    updateEvent: updateEvent.mutate,
    deleteEvent: deleteEvent.mutate,
  };
};