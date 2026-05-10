import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface YandexIntegration {
  user_id: string;
  last_sync_at: string | null;
}

export const useYandexCalendar = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Считаем "подключённым" если в таблице есть запись
  const { data: integration, isLoading } = useQuery({
    queryKey: ["yandexIntegration"],
    queryFn: async (): Promise<YandexIntegration | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("yandex_integrations")
        .select("user_id, last_sync_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Вызывается после успешного импорта .ics — создаёт/обновляет запись
  const markSynced = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("yandex_integrations")
      .upsert({ user_id: user.id, last_sync_at: new Date().toISOString() }, { onConflict: "user_id" });
    queryClient.invalidateQueries({ queryKey: ["yandexIntegration"] });
    queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
  };

  // Отключить — удалить запись и все события
  const disconnect = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await supabase.from("yandex_integrations").delete().eq("user_id", user.id);
      await supabase.from("calendar_events").delete().eq("user_id", user.id).eq("source", "yandex");
    },
    onSuccess: () => {
      toast({ title: "Яндекс Календарь отключён" });
      queryClient.invalidateQueries({ queryKey: ["yandexIntegration"] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  return {
    integration,
    isLoading,
    isConnected: !!integration,
    markSynced,
    disconnect: disconnect.mutate,
    isDisconnecting: disconnect.isPending,
  };
};