import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Unlink, ExternalLink, Copy, Check } from "lucide-react";

// 👇 ЗАМЕНИ на ссылку своего сообщества-бота
const VK_BOT_URL = "https://vk.com/momentum2026";

const VkIcon = () => (
  <span className="h-5 w-5 rounded bg-[#0077FF] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
    VK
  </span>
);

function generateCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `MOMENTUM-${n}`;
}

export default function VkConnect() {
  const [connected, setConnected] = useState<number | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    loadConnection();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function loadConnection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any)
      .from("vk_connections")
      .select("vk_user_id, verified")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data && data.verified && data.vk_user_id) {
      setConnected(data.vk_user_id);
    }
  }

  async function handleGetCode() {
    setError("");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const newCode = generateCode();

      await (supabase as any).from("vk_connections").delete().eq("user_id", user.id);
      const { error: insErr } = await (supabase as any)
        .from("vk_connections")
        .insert({
          user_id: user.id,
          vk_user_id: null,
          link_code: newCode,
          verified: false,
        });
      if (insErr) throw insErr;

      setCode(newCode);
      startPolling(user.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startPolling(userId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      const { data } = await (supabase as any)
        .from("vk_connections")
        .select("vk_user_id, verified")
        .eq("user_id", userId)
        .maybeSingle();
      if (data && data.verified && data.vk_user_id) {
        setConnected(data.vk_user_id);
        setCode(null);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await (supabase as any).from("vk_connections").delete().eq("user_id", user.id);
      setConnected(null);
      setCode(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <VkIcon />
          ВКонтакте
        </CardTitle>
        <CardDescription>
          Привяжите ВКонтакте, чтобы пересылать сообщения боту как задачи и заметки.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Подключено" : "Не подключено"}
          </Badge>
          {connected && (
            <span className="text-xs text-muted-foreground">ID ВКонтакте: {connected}</span>
          )}
        </div>

        {connected ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 py-1.5 px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Подключено
            </Badge>
            <Button onClick={handleDisconnect} disabled={loading} variant="outline" className="gap-2">
              <Unlink className="h-4 w-4" />
              Отвязать
            </Button>
          </div>
        ) : code ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border font-mono text-sm hover:border-primary/50 transition-colors"
              >
                <span className="select-all">{code}</span>
                {copied
                  ? <Check className="h-3.5 w-3.5 text-green-600" />
                  : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <a href={VK_BOT_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Открыть бота
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Отправьте код боту — страница обновится сама после подтверждения.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleGetCode} disabled={loading} className="gap-2">
                <Link2 className="h-4 w-4" />
                {loading ? "Генерация..." : "Получить код привязки"}
              </Button>
              <a href={VK_BOT_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Открыть бота
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Получите код и отправьте его боту во ВКонтакте — привязка подтвердится автоматически.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
}
