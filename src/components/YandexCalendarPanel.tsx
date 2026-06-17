import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Unplug, Upload, RefreshCw, Link2 } from "lucide-react";
import { useYandexCalendar } from "@/hooks/useYandexCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

const YandexIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.04 12c0-5.523 4.476-10 9.998-10C17.523 2 22 6.477 22 12s-4.477 10-10.002 10C6.515 22 2.04 17.523 2.04 12z" fill="#FC3F1D" />
    <path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.958l1.045.704-3.003 4.549H7.49l2.717-4.044c-1.55-1.111-2.43-2.19-2.43-4.044 0-2.289 1.573-3.912 4.576-3.912h3.003v12h-2.036V7.666z" fill="white" />
  </svg>
);

function unfoldLines(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function parseDt(value: string): { date: string; time: string | null } {
  const v = value.trim().replace("Z", "");
  if (v.length === 8) return { date: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, time: null };
  return { date: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, time: `${v.slice(9, 11)}:${v.slice(11, 13)}` };
}

function parseIcs(text: string) {
  const lines = unfoldLines(text).split(/\r?\n/);
  const events: { uid: string; title: string; description: string | null; date: string; time: string | null }[] = [];
  let inEvent = false;
  let props: Record<string, string> = {};
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { inEvent = true; props = {}; continue; }
    if (line === "END:VEVENT") {
      inEvent = false;
      if (props.UID && props.DTSTART) {
        const { date, time } = parseDt(props.DTSTART);
        const desc = [props.DESCRIPTION, props.LOCATION]
          .map(s => s?.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\/g, ""))
          .filter(Boolean).join("\n\n") || null;
        events.push({ uid: props.UID, title: (props.SUMMARY || "(без названия)").replace(/\\,/g, ",").replace(/\\/g, ""), description: desc, date, time });
      }
      continue;
    }
    if (!inEvent) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    props[line.substring(0, idx).split(";")[0].toUpperCase()] = line.substring(idx + 1);
  }
  return events;
}

export const YandexCalendarPanel = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const { toast } = useToast();
  const {
    integration, isConnected,
    saveIcalUrl, isSavingUrl,
    sync, isSyncing,
    markSynced, disconnect, isDisconnecting,
  } = useYandexCalendar();

  const handleSaveUrl = () => {
    const url = urlInput.trim();
    if (!url) {
      toast({ title: "Введите ссылку", description: "Вставьте ссылку iCal из Яндекс Календаря", variant: "destructive" });
      return;
    }
    saveIcalUrl(url);
    setUrlInput("");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const events = parseIcs(text);
      if (events.length === 0) {
        toast({ title: "Файл пустой", description: "В файле не найдено событий", variant: "destructive" });
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      let imported = 0;
      for (const ev of events) {
        const { error } = await (supabase as any).from("calendar_events").upsert(
          { user_id: user.id, title: ev.title, description: ev.description, date: ev.date, time: ev.time, type: "yandex", source: "yandex", yandex_event_uid: ev.uid },
          { onConflict: "user_id,yandex_event_uid" }
        );
        if (!error) imported++;
      }
      await markSynced();
      toast({ title: "Импорт завершён", description: `Импортировано событий: ${imported} из ${events.length}` });
    } catch (err) {
      toast({ title: "Ошибка импорта", description: err instanceof Error ? err.message : "Неизвестная ошибка", variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className={isConnected ? "border-orange-500/30 bg-orange-500/5" : "border-dashed"}>
      <CardContent className="p-4 space-y-4">
        {/* Шапка */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm border border-border flex-shrink-0">
              <YandexIcon />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm flex items-center gap-2">
                Яндекс Календарь
                {isConnected && <span className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
              </p>
              {isConnected && integration?.last_sync_at ? (
                <p className="text-xs text-muted-foreground truncate">
                  Синхронизировано: {format(parseISO(integration.last_sync_at), "d MMM, HH:mm", { locale: ru })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Вставьте ссылку iCal для автоматической синхронизации
                </p>
              )}
            </div>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Подключено
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => disconnect()} disabled={isDisconnecting} className="text-muted-foreground hover:text-destructive">
                <Unplug className="h-4 w-4 mr-1.5" />
                Отключить
              </Button>
            </div>
          )}
        </div>

        {/* Основной способ: ссылка iCal */}
        {!isConnected ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://calendar.yandex.ru/export/ics.xml?private_token=..."
                  className="pl-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleSaveUrl} disabled={isSavingUrl}>
                {isSavingUrl ? "Сохранение..." : "Подключить"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ссылку можно получить в настройках Яндекс Календаря → «Экспорт» → ссылка iCal.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => sync()} disabled={isSyncing} className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Синхронизация..." : "Синхронизировать"}
            </Button>
          </div>
        )}

        {/* Запасной способ: загрузка файла */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Или загрузите .ics файл вручную
            </p>
            <input ref={fileInputRef} type="file" accept=".ics" className="hidden" onChange={handleFile} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              <Upload className={`h-4 w-4 mr-1.5 ${isImporting ? "animate-pulse" : ""}`} />
              {isImporting ? "Импорт..." : "Загрузить .ics"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};