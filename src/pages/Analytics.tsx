import { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CheckSquare, TrendingUp, Target, Award, BarChart2, ListTodo, Loader2, FolderKanban } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { PlanVsFactChart } from "@/components/analytics/PlanVsFactChart";

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  accent: "hsl(var(--accent))",
  destructive: "hsl(var(--destructive))",
};

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
};

export default function Analytics() {
  const { data: analytics, isLoading } = useAnalytics();
  const [activeTab, setActiveTab] = useState<"projects" | "tasks" | "habits">("projects");

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Загрузка аналитики...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 space-y-6">
        {/* Hero без данных */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-primary/80 to-slate-900 p-8 min-h-[160px]">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />Продуктивность и прогресс
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">Аналитика</h1>
            <p className="text-white/40 text-sm mt-2">Нет данных для отображения</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-primary/80 to-slate-900 p-8 min-h-[160px]">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />Продуктивность и прогресс
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">Аналитика</h1>
            <p className="text-white/40 text-xs mt-2">Обзор вашей активности</p>
          </div>

          <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
            {[
              { label: "Всего задач", value: analytics.stats.totalTasks, icon: ListTodo, color: "text-blue-400" },
              { label: "Выполнено", value: `${analytics.stats.completionRate}%`, icon: CheckSquare, color: "text-green-400" },
              { label: "Привычки", value: analytics.stats.totalHabits, icon: Target, color: "text-amber-400" },
              { label: "Проектов", value: analytics.stats.activeProjects, icon: FolderKanban, color: "text-purple-400" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <s.icon className={cn("h-5 w-5 flex-shrink-0", s.color)} />
                <div>
                  <p className="text-white/40 text-xs leading-none">{s.label}</p>
                  <p className="text-white font-bold text-2xl leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          МОБИЛЬНЫЕ КАРТОЧКИ СТАТИСТИКИ
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:hidden">
        {[
          { label: "Всего задач", value: analytics.stats.totalTasks, sub: "В системе", icon: ListTodo, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Выполнено", value: `${analytics.stats.completedTasks}/${analytics.stats.totalTasks}`, sub: `${analytics.stats.completionRate}% успешность`, icon: CheckSquare, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Привычки", value: analytics.stats.totalHabits, sub: "Отслеживается", icon: Target, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Проектов", value: analytics.stats.activeProjects, sub: `Всего: ${analytics.stats.totalProjects}`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          HEATMAP АКТИВНОСТИ
      ═══════════════════════════════════════════ */}
      <ActivityHeatmap />

      {/* ═══════════════════════════════════════════
          ТАБЫ
      ═══════════════════════════════════════════ */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border/60 w-fit">
        {[
          { key: "projects" as const, label: "Проекты" },
          { key: "tasks" as const, label: "Задачи" },
          { key: "habits" as const, label: "Привычки" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              activeTab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          КОНТЕНТ ТАБОВ
      ═══════════════════════════════════════════ */}

      {/* Проекты */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="font-semibold mb-4">Задачи по проектам</h3>
            {analytics.projectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.projectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="totalTasks" fill={COLORS.primary} name="Всего задач" />
                  <Bar dataKey="completedTasks" fill={COLORS.success} name="Выполнено" />
                  <Bar dataKey="activeTasks" fill={COLORS.accent} name="В процессе" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Нет данных по проектам с задачами" />
            )}
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="font-semibold mb-4">Распределение задач</h3>
            {analytics.projectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.projectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, totalTasks }) => `${name}: ${totalTasks}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="totalTasks"
                  >
                    {analytics.projectData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Нет данных по проектам с задачами" />
            )}
          </div>
        </div>
      )}

      {/* Задачи */}
      {activeTab === "tasks" && (
        <div className="space-y-5">
          <PlanVsFactChart />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <h3 className="font-semibold mb-4">Выполнение задач по неделям</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.weeklyTaskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke={COLORS.success} strokeWidth={2} name="Выполнено" />
                  <Line type="monotone" dataKey="active" stroke={COLORS.warning} strokeWidth={2} name="Активные" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-5">
              <h3 className="font-semibold mb-4">Общая продуктивность</h3>
              {analytics.productivityData[0].value > 0 || analytics.productivityData[1].value > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.productivityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill={COLORS.primary}
                      dataKey="value"
                    >
                      {analytics.productivityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.success : COLORS.primary} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart text="Нет задач для анализа" />
              )}
            </div>
          </div>

          {analytics.priorityData.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <h3 className="font-semibold mb-4">Распределение по приоритетам</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill={COLORS.primary} name="Задач" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Привычки */}
      {activeTab === "habits" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="font-semibold mb-4">Прогресс привычек (последняя неделя)</h3>
            {analytics.habitProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.habitProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="value" fill={COLORS.primary} name="Прогресс %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Нет данных по привычкам" />
            )}
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="font-semibold mb-4">Активность по дням недели</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="tasks" fill={COLORS.primary} name="Задачи" />
                <Bar dataKey="events" fill={COLORS.accent} name="События" />
                <Bar dataKey="habits" fill={COLORS.success} name="Привычки" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ИТОГОВАЯ СТАТИСТИКА
      ═══════════════════════════════════════════ */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Итоговая статистика
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Всего задач выполнено", value: analytics.stats.completedTasks },
            { label: "Коэффициент выполнения", value: `${analytics.stats.completionRate}%` },
            { label: "События в календаре", value: analytics.stats.totalEvents },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl border border-border/60 bg-muted/20">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
