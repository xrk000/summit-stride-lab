import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Link2, Unlink } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

export default function GoogleCalendarCard() {
  const {
    integration,
    isConnected,
    isConnecting,
    connect,
    sync,
    isSyncing,
    disconnect,
    isDisconnecting,
  } = useGoogleCalendar();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Импортируйте события из Google Календаря (встречи, билеты, напоминания) в свой календарь.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Подключено" : "Не подключено"}
          </Badge>
          {integration?.last_sync_at && (
            <span className="text-xs text-muted-foreground">
              Последняя синхронизация:{" "}
              {new Date(integration.last_sync_at).toLocaleString("ru-RU")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!isConnected && (
            <Button onClick={connect} disabled={isConnecting} className="gap-2">
              <Link2 className="h-4 w-4" />
              {isConnecting ? "Перенаправление..." : "Подключить Google Calendar"}
            </Button>
          )}
          {isConnected && (
            <>
              <Button onClick={() => sync()} disabled={isSyncing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Синхронизация..." : "Синхронизировать сейчас"}
              </Button>
              <Button
                onClick={() => disconnect()}
                disabled={isDisconnecting}
                variant="outline"
                className="gap-2"
              >
                <Unlink className="h-4 w-4" />
                Отключить
              </Button>
            </>
          )}
        </div>

        {isConnected && integration && !integration.has_refresh_token && (
          <p className="text-xs text-muted-foreground">
            Refresh-токен отсутствует. Если синхронизация перестанет работать — отключите и подключите заново.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
