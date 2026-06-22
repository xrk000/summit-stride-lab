import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface YandexIntegration {
  user_id: string;
  ical_url: string | null;
  last_sync_at: string | null;
}

export const useYandexCalendar = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integration, isLoading } = useQuery({
    queryKey: ["yandexIntegration"],
    queryFn: async (): Promise<YandexIntegration | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("yandex_integrations")
        .select("user_id, ical_url, last_sync_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as YandexIntegration | null;
    },
  });

  const saveIcalUrl = useMutation({
    mutationFn: async (ical_url: string) => {
      const { data, error } = await supabase.functions.invoke("save-yandex-credentials", {
        body: { ical_url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Ссылка сохранена", description: "Яндекс Календарь подключён, синхронизация..." });
      queryClient.invalidateQueries({ queryKey: ["yandexIntegration"] });
      sync.mutate();
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const sync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("yandex-calendar-sync", {
        body: {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; imported: number; total: number; skipped?: number };
    },
    onSuccess: (data) => {
      const skipped = data.skipped || 0;
      toast({
        title: "Синхронизация завершена",
        description: skipped > 0
          ? `Импортировано ${data.imported} из ${data.total} (${skipped} ваших изменений сохранено)`
          : `Импортировано событий: ${data.imported} из ${data.total}`,
      });
      queryClient.invalidateQueries({ queryKey: ["yandexIntegration"] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка синхронизации", description: e.message, variant: "destructive" });
    },
  });

  const markSynced = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any)
      .from("yandex_integrations")
      .upsert({ user_id: user.id, last_sync_at: new Date().toISOString() }, { onConflict: "user_id" });
    queryClient.invalidateQueries({ queryKey: ["yandexIntegration"] });
    queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
  };

  const disconnect = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await (supabase as any).from("yandex_integrations").delete().eq("user_id", user.id);
      // Удаляем yandex-события, КРОМЕ отредактированных пользователем
      await (supabase as any).from("calendar_events").delete().eq("user_id", user.id).eq("source", "yandex").eq("is_modified", false);
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
    saveIcalUrl: saveIcalUrl.mutate,
    isSavingUrl: saveIcalUrl.isPending,
    sync: sync.mutate,
    isSyncing: sync.isPending,
    markSynced,
    disconnect: disconnect.mutate,
    isDisconnecting: disconnect.isPending,
  };
};