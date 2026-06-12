import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, addDays, parseISO,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { Loader2, Target, TrendingUp, AlertTriangle } from "lucide-react";

type Period = "week" | "month";

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

interface ChartPoint {
  label: string;
  план: number;
  факт: number;
}

export function PlanVsFactChart() {
  const [period, setPeriod] = useState<Period>("week");

  const { data, isLoading } = useQuery({
    queryKey: ["planVsFact", period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const now = new Date();
      const today = format(now, "yyyy-MM-dd");

      const rangeStart = period === "week"
        ? startOfWeek(now, { weekStartsOn: 1 })
        : startOfMonth(now);
      const rangeEnd = period === "week"
        ? endOfWeek(now, { weekStartsOn: 1 })
        : endOfMonth(now);

      const startStr = format(rangeStart, "yyyy-MM-dd");
      const endStr = format(rangeEnd, "yyyy-MM-dd");

      const [
        { data: tasks },
        { data: overdueTasks },
      ] = await Promise.all([
        supabase.from("tasks")
          .select("id, due_date, completed, completed_at")
          .eq("user_id", user.id),
        supabase.from("tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("completed", false)
          .not("due_date", "is", null)
          .lt("due_date", today),
      ]);

      if (!tasks) return null;

      const planTasks = tasks.filter(t => t.due_date && t.due_date >= startStr && t.due_date <= endStr);
      const factTasks = tasks.filter(t => {
        if (!t.completed || !t.completed_at) return false;
        const ds = format(parseISO(t.completed_at), "yyyy-MM-dd");
        return ds >= startStr && ds <= endStr;
      });

      const getFactDs = (t: typeof factTasks[0]) =>
        t.completed_at ? format(parseISO(t.completed_at), "yyyy-MM-dd") : "";

      let chartData: ChartPoint[];

      if (period === "week") {
        chartData = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(day => {
          const ds = format(day, "yyyy-MM-dd");
          return {
            label: format(day, "EEE", { locale: ru }),
            план: planTasks.filter(t => t.due_date === ds).length,
            факт: factTasks.filter(t => getFactDs(t) === ds).length,
          };
        });
      } else {
        // Group by calendar weeks within the month
        chartData = [];
        let weekStart = new Date(rangeStart);
        let weekNum = 1;
        while (format(weekStart, "yyyy-MM-dd") <= endStr) {
          const weekEndDate = addDays(weekStart, 6);
          const wEnd = weekEndDate > rangeEnd ? rangeEnd : weekEndDate;
          const wStartStr = format(weekStart, "yyyy-MM-dd");
          const wEndStr = format(wEnd, "yyyy-MM-dd");
          chartData.push({
            label: `Нед. ${weekNum}`,
            план: planTasks.filter(t => t.due_date && t.due_date >= wStartStr && t.due_date <= wEndStr).length,
            факт: factTasks.filter(t => {
              const ds = getFactDs(t);
              return ds >= wStartStr && ds <= wEndStr;
            }).length,
          });
          weekStart = addDays(weekStart, 7);
          weekNum++;
        }
      }

      const totalPlan = planTasks.length;
      const totalFact = factTasks.length;
      const completionRate = totalPlan > 0 ? Math.round((totalFact / totalPlan) * 100) : 0;

      return {
        chartData,
        totalPlan,
        totalFact,
        completionRate,
        overdueCount: overdueTasks?.length ?? 0,
      };
    },
  });

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-semibold">План / Факт по задачам</h3>
        <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/40 border border-border/60">
          {(["week", "month"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                period === p
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p === "week" ? "Неделя" : "Месяц"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                label: "Выполнение",
                value: `${data.completionRate}%`,
                icon: Target,
                color: data.completionRate >= 80
                  ? "text-green-500"
                  : data.completionRate >= 50
                  ? "text-amber-500"
                  : "text-red-500",
                bg: data.completionRate >= 80
                  ? "bg-green-500/10"
                  : data.completionRate >= 50
                  ? "bg-amber-500/10"
                  : "bg-red-500/10",
              },
              {
                label: "Факт / План",
                value: `${data.totalFact} / ${data.totalPlan}`,
                icon: TrendingUp,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                label: "Просрочено",
                value: String(data.overdueCount),
                icon: AlertTriangle,
                color: data.overdueCount > 0 ? "text-destructive" : "text-muted-foreground",
                bg: data.overdueCount > 0 ? "bg-destructive/10" : "bg-muted/30",
              },
            ].map(s => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-border/50 bg-muted/20"
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", s.bg)}>
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-none whitespace-nowrap">{s.label}</p>
                  <p className="text-sm font-bold mt-0.5">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {data.totalPlan === 0 && data.totalFact === 0 ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Нет задач с дедлайном в этом периоде</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.chartData} barGap={2} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="план"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.35}
                  name="План"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="факт"
                  fill="hsl(var(--primary))"
                  fillOpacity={1}
                  name="Факт"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      ) : null}
    </div>
  );
}
