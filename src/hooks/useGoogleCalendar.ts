import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

export interface GoogleIntegration {
  user_id: string;
  expires_at: string | null;
  last_sync_at: string | null;
  has_refresh_token: boolean;
}

export const useGoogleCalendar = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // ─── Статус подключения из БД ───────────────────────────────────────────────
  const { data: integration, isLoading } = useQuery({
    queryKey: ["googleIntegration"],
    queryFn: async (): Promise<GoogleIntegration | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("google_integrations")
        .select("user_id, expires_at, last_sync_at, provider_refresh_token")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        user_id: data.user_id,
        expires_at: data.expires_at,
        last_sync_at: data.last_sync_at,
        has_refresh_token: !!data.provider_refresh_token,
      };
    },
  });

  // ─── Сохранение токенов и первая синхронизация ──────────────────────────────
  const saveTokensAndSync = useCallback(async (
    providerToken: string,
    refreshToken: string | null,
    expiresIn: number | null,
  ) => {
    try {
      const { error } = await supabase.functions.invoke("save-google-tokens", {
        body: {
          provider_token: providerToken,
          provider_refresh_token: refreshToken,
          expires_in: expiresIn,
        },
      });
      if (error) throw error;

      toast({
        title: "Google Calendar подключён",
        description: "Запускаем первую синхронизацию...",
      });
      queryClient.invalidateQueries({ queryKey: ["googleIntegration"] });

      const { data: syncData, error: syncErr } =
        await supabase.functions.invoke("google-calendar-sync");
      if (syncErr) throw syncErr;

      toast({
        title: "Синхронизация завершена",
        description: `Импортировано событий: ${syncData?.imported ?? 0}`,
      });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      queryClient.invalidateQueries({ queryKey: ["googleIntegration"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      toast({
        title: "Ошибка подключения",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [queryClient, toast]);

  // ─── ОСНОВНОЙ ФИЧ: читаем токен из сессии при монтировании ─────────────────
  // onAuthStateChange ненадёжен при full-page redirect — событие может
  // сработать до монтирования компонента. Поэтому проверяем getSession() сами.
  useEffect(() => {
    if (sessionStorage.getItem("google_calendar_connecting") !== "1") return;

    const captureTokenFromSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const providerToken = session.provider_token as string | null;
      const refreshToken = session.provider_refresh_token as string | null;
      const expiresIn = session.expires_in as number | null;

      if (!providerToken) return; // запасной вариант — onAuthStateChange

      sessionStorage.removeItem("google_calendar_connecting");
      await saveTokensAndSync(providerToken, refreshToken, expiresIn);
    };

    captureTokenFromSession();
  }, [saveTokensAndSync]);

  // ─── Запасной вариант: onAuthStateChange ────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) return;
        if (
          event !== "SIGNED_IN" &&
          event !== "TOKEN_REFRESHED" &&
          event !== "USER_UPDATED"
        ) return;

        const providerToken = session.provider_token as string | null;
        const refreshToken = session.provider_refresh_token as string | null;
        const expiresIn = session.expires_in as number | null;

        if (!providerToken) return;
        if (sessionStorage.getItem("google_calendar_connecting") !== "1") return;

        sessionStorage.removeItem("google_calendar_connecting");
        await saveTokensAndSync(providerToken, refreshToken, expiresIn);
      },
    );
    return () => subscription.unsubscribe();
  }, [saveTokensAndSync]);

  // ─── Подключить ─────────────────────────────────────────────────────────────
  const connect = async () => {
    setIsConnecting(true);
    sessionStorage.setItem("google_calendar_connecting", "1");

    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        scopes: GOOGLE_CALENDAR_SCOPE,
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      sessionStorage.removeItem("google_calendar_connecting");
      setIsConnecting(false);
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  // ─── Ручная синхронизация ────────────────────────────────────────────────────
  const sync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "google-calendar-sync"
      );
      if (error) throw error;
      return data as { imported: number; total: number };
    },
    onSuccess: (data) => {
      toast({
        title: "Синхронизация завершена",
        description: `Импортировано событий: ${data.imported} из ${data.total}`,
      });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      queryClient.invalidateQueries({ queryKey: ["googleIntegration"] });
    },
    onError: (e: Error) => {
      toast({
        title: "Ошибка синхронизации",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  // ─── Отключить ───────────────────────────────────────────────────────────────
  const disconnect = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Удаляем интеграцию
      const { error } = await supabase
        .from("google_integrations")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;

      // Удаляем импортированные Google-события
      await supabase
        .from("calendar_events")
        .delete()
        .eq("user_id", user.id)
        .eq("source", "google");

      // 👇 Отвязываем Google identity, чтобы повторная привязка работала
      const googleIdentity = user.identities?.find(i => i.provider === "google");
      if (googleIdentity) {
        const { error: unlinkErr } = await supabase.auth.unlinkIdentity(googleIdentity);
        if (unlinkErr) {
          // не роняем весь disconnect, но логируем
          console.error("unlinkIdentity error:", unlinkErr);
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Google Calendar отключён" });
      queryClient.invalidateQueries({ queryKey: ["googleIntegration"] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
    onError: (e: Error) => {
      toast({
        title: "Ошибка",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  return {
    integration,
    isLoading,
    isConnected: !!integration,
    isConnecting,
    connect,
    sync: sync.mutate,
    isSyncing: sync.isPending,
    disconnect: disconnect.mutate,
    isDisconnecting: disconnect.isPending,
  };
};