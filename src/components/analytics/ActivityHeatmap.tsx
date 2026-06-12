import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, subWeeks, eachDayOfInterval, addDays, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface DayData {
  date: string;
  tasks: number;
  habits: number;
  events: number;
}

interface TooltipState {
  data: DayData;
  x: number;
  y: number;
}

function getHeatLevel(total: number): 0 | 1 | 2 | 3 | 4 {
  if (total === 0) return 0;
  if (total <= 2) return 1;
  if (total <= 4) return 2;
  if (total <= 6) return 3;
  return 4;
}

const HEAT_CLASSES = [
  "bg-border/80 dark:bg-muted/25",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/65",
  "bg-primary/85",
] as const;

const WEEKS = 12;
const DAY_LABELS = ["Пн", "", "Ср", "", "Пт", "", "Вс"];

export function ActivityHeatmap() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["activityHeatmap"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const today = new Date();
      const gridStart = startOfWeek(subWeeks(today, WEEKS - 1), { weekStartsOn: 1 });
      const startStr = format(gridStart, "yyyy-MM-dd");
      const endStr = format(today, "yyyy-MM-dd");

      const [
        { data: completedTasks },
        { data: habitEntries },
        { data: calendarEvents },
      ] = await Promise.all([
        supabase.from("tasks")
          .select("completed_at")
          .eq("user_id", user.id)
          .eq("completed", true)
          .not("completed_at", "is", null)
          .gte("completed_at", startStr)
          .lte("completed_at", endStr + "T23:59:59"),
        supabase.from("habit_entries")
          .select("date")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("date", startStr)
          .lte("date", endStr),
        supabase.from("calendar_events")
          .select("date")
          .eq("user_id", user.id)
          .gte("date", startStr)
          .lte("date", endStr),
      ]);

      // Build date map
      const map = new Map<string, DayData>();
      eachDayOfInterval({ start: gridStart, end: today }).forEach(day => {
        const ds = format(day, "yyyy-MM-dd");
        map.set(ds, { date: ds, tasks: 0, habits: 0, events: 0 });
      });

      completedTasks?.forEach(t => {
        if (!t.completed_at) return;
        const ds = format(parseISO(t.completed_at), "yyyy-MM-dd");
        const d = map.get(ds);
        if (d) d.tasks++;
      });
      habitEntries?.forEach(h => {
        const d = map.get(h.date);
        if (d) d.habits++;
      });
      calendarEvents?.forEach(e => {
        const d = map.get(e.date);
        if (d) d.events++;
      });

      // Build weeks grid (column = week, row = day of week Mon–Sun)
      const weeks: (DayData | null)[][] = [];
      const monthLabels: (string | null)[] = [];
      let weekCursor = new Date(gridStart);

      for (let w = 0; w < WEEKS; w++) {
        const week: (DayData | null)[] = [];
        for (let d = 0; d < 7; d++) {
          const ds = format(addDays(weekCursor, d), "yyyy-MM-dd");
          week.push(map.get(ds) ?? null);
        }
        weeks.push(week);

        const firstDay = week.find(Boolean);
        if (firstDay) {
          const thisMonth = format(parseISO(firstDay.date), "LLL", { locale: ru });
          const prevFirstDay = w > 0 ? weeks[w - 1].find(Boolean) : null;
          const prevMonth = prevFirstDay ? format(parseISO(prevFirstDay.date), "LLL", { locale: ru }) : null;
          monthLabels.push(w === 0 || thisMonth !== prevMonth ? thisMonth : null);
        } else {
          monthLabels.push(null);
        }

        weekCursor = addDays(weekCursor, 7);
      }

      return { weeks, monthLabels };
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h3 className="font-semibold mb-4">Активность</h3>
        <div className="h-[130px] flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { weeks, monthLabels } = data;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-semibold">Активность за 12 недель</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Меньше</span>
          {HEAT_CLASSES.map((cls, i) => (
            <div key={i} className={cn("w-[11px] h-[11px] rounded-[2px]", cls)} />
          ))}
          <span>Больше</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-[3px]">
          {/* Day-of-week labels */}
          <div className="flex flex-col mr-1 pt-5 flex-shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-[13px] w-5 flex items-center mb-[3px] last:mb-0">
                <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3px]">
              {/* Month label */}
              <div className="h-5 flex items-end pb-0.5">
                {monthLabels[wIdx] && (
                  <span className="text-[9px] text-muted-foreground leading-none capitalize whitespace-nowrap">
                    {monthLabels[wIdx]}
                  </span>
                )}
              </div>

              {/* Day cells */}
              {week.map((dayData, dIdx) => {
                if (!dayData) {
                  return <div key={dIdx} className="w-[13px] h-[13px] rounded-[2px] opacity-0" />;
                }
                const total = dayData.tasks + dayData.habits + dayData.events;
                const level = getHeatLevel(total);
                return (
                  <div
                    key={dIdx}
                    className={cn(
                      "w-[13px] h-[13px] rounded-[2px] cursor-default transition-opacity hover:opacity-70",
                      HEAT_CLASSES[level]
                    )}
                    onMouseEnter={(e) => setTooltip({ data: dayData, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip (fixed to viewport) */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg border border-border bg-popover text-popover-foreground shadow-lg px-3 py-2 text-xs"
          style={{
            left: Math.min(tooltip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 170),
            top: tooltip.y - 90,
          }}
        >
          <p className="font-semibold mb-1.5">
            {format(parseISO(tooltip.data.date), "d MMMM yyyy", { locale: ru })}
          </p>
          <div className="space-y-0.5 text-muted-foreground">
            <p>Задачи: <span className="text-foreground font-medium">{tooltip.data.tasks}</span></p>
            <p>Привычки: <span className="text-foreground font-medium">{tooltip.data.habits}</span></p>
            <p>События: <span className="text-foreground font-medium">{tooltip.data.events}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
