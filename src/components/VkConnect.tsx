import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VkConnect() {
  const [vkId, setVkId] = useState("");
  const [connected, setConnected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConnection();
  }, []);

  async function loadConnection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await (supabase as any)
      .from("vk_connections")
      .select("vk_user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setConnected(data.vk_user_id);
      setVkId(data.vk_user_id.toString());
    }
  }

  async function handleConnect() {
    setError("");
    const vkIdNum = parseInt(vkId, 10);
    if (isNaN(vkIdNum) || vkIdNum <= 0) {
      setError("Введите корректный числовой ID ВКонтакте");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      await (supabase as any).from("vk_connections").delete().eq("user_id", user.id);
      const { error: insertError } = await (supabase as any)
        .from("vk_connections")
        .insert({ user_id: user.id, vk_user_id: vkIdNum });

      if (insertError) throw insertError;
      setConnected(vkIdNum);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await (supabase as any).from("vk_connections").delete().eq("user_id", user.id);
      setConnected(null);
      setVkId("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium">🔗 ВКонтакте</h4>
      {connected ? (
        <div className="flex items-center gap-3">
          <span className="text-green-600 text-sm">✅ Подключено: ID {connected}</span>
          <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={loading}>
            Отвязать
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Чтобы использовать бота, введите свой числовой ID ВКонтакте.<br />
            Как узнать: перейдите в настройки профиля ВК → нажмите «✎» у имени → скопируйте число из адресной строки.
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              value={vkId}
              onChange={(e) => setVkId(e.target.value)}
              placeholder="Пример: 12345678"
              className="max-w-[200px]"
            />
            <Button onClick={handleConnect} disabled={loading} size="sm">
              {loading ? "Привязка..." : "Привязать"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </>
      )}
    </div>
  );
}