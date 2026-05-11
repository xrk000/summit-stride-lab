import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, CheckSquare, TrendingUp, Plus, AlertCircle,
  ChevronRight, FileText, Flame, Target, Zap, Star,
  AlertTriangle, CheckCheck, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useUserStats } from "@/hooks/useUserStats";
import { useHabits } from "@/hooks/useHabits";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useNotes } from "@/hooks/useNotes";
import { useAllTaskTags } from "@/hooks/useAllTaskTags";
import { useProfile } from "@/hooks/useProfile";
import { TaskTagSelector } from "@/components/TaskTagSelector";
import { format, isToday, isFuture, isPast, parseISO, addDays, subDays } from "date-fns";
import { ru } from "date-fns/locale";

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "Доброе утро", emoji: "🌅", sub: "Отличное время чтобы начать день продуктивно" };
  if (h >= 12 && h < 17) return { text: "Добрый день", emoji: "☀️", sub: "Продолжай в том же духе!" };
  if (h >= 17 && h < 22) return { text: "Добрый вечер", emoji: "🌇", sub: "Подведём итоги дня" };
  return { text: "Доброй ночи", emoji: "🌙", sub: "Время отдохнуть и восстановиться" };
}

const QUOTES = [
  "Маленькие шаги каждый день — большой путь каждый год.",
  "Дисциплина — это мост между целями и достижениями.",
  "Не нужно быть великим, чтобы начать. Нужно начать, чтобы стать великим.",
  "Сегодня тяжело — завтра легче. Продолжай.",
  "Каждый день — новая возможность стать лучше.",
  "Успех — это сумма маленьких усилий, повторяемых изо дня в день.",
  "Делай сегодня то, что другие не хотят — завтра живи так, как другие не могут.",
];

function getDailyQuote() {
  const d = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[d % QUOTES.length];
}

function ProductivityRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Отлично!" : score >= 50 ? "Хорошо" : "Давай!";
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/20" />
        <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs text-white/70">{label}</span>
      </div>
    </div>
  );
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  const { tasks, createTask, toggleTask } = useTasks();
  const { data: stats } = useUserStats();
  const { habits, habitEntries } = useHabits();
  const { events, createEvent } = useCalendarEvents();
  const { notes, createNote } = useNotes();
  const { data: taskTagsMap } = useAllTaskTags();
  const { profile } = useProfile();

  const greeting = getGreeting();
  const quote = getDailyQuote();
  const today = new Date();

  const displayName = profile?.username
    || (profile as any)?.email?.split('@')[0]
    || "Пользователь";

  const todayTasks = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)));
  const todayCompleted = todayTasks.filter(t => t.completed).length;

  const urgentTasks = tasks.filter(t => {
    if (t.completed || !t.due_date) return false;
    const due = parseISO(t.due_date);
    return isPast(due) || isToday(due) || due <= addDays(today, 1);
  }).slice(0, 5);

  const upcomingEvents = events
    .filter(e => isFuture(parseISO(e.date)) || isToday(parseISO(e.date)))
    .slice(0, 5);

  const habitProgress = habits.map(habit => {
    const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(today, i), 'yyyy-MM-dd'));
    const done = habitEntries.filter(e => e.habit_id === habit.id && e.completed && last7.includes(e.date)).length;
    return { id: habit.id, name: habit.name, done, pct: Math.round((done / 7) * 100) };
  });

  const avgHabit = habitProgress.length > 0
    ? Math.round(habitProgress.reduce((a, h) => a + h.pct, 0) / habitProgress.length) : 0;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const ds = format(date, 'yyyy-MM-dd');
    const total = tasks.filter(t => t.due_date === ds && t.completed).length
      + habitEntries.filter(e => e.date === ds && e.completed).length
      + events.filter(e => e.date === ds).length;
    return { date, label: format(date, 'EEEEE', { locale: ru }), total, isToday: isToday(date) };
  });
  const maxW = Math.max(...weekDays.map(d => d.total), 1);

  const focusTask = useMemo(() => {
    if (focusTaskId) return tasks.find(t => t.id === focusTaskId) || null;
    return tasks.find(t => !t.completed && t.priority === 'high')
      || tasks.find(t => !t.completed && t.priority === 'medium')
      || tasks.find(t => !t.completed) || null;
  }, [tasks, focusTaskId]);

  const productivityScore = useMemo(() => {
    let s = 0;
    if (todayTasks.length > 0) s += Math.round((todayCompleted / todayTasks.length) * 40);
    s += Math.round(avgHabit * 0.4);
    if (upcomingEvents.some(e => isToday(parseISO(e.date)))) s += 20;
    return Math.min(s, 100);
  }, [todayTasks, todayCompleted, avgHabit, upcomingEvents]);

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createTask({ title: fd.get("title") as string, description: fd.get("description") as string, priority: fd.get("priority") as string, due_date: format(today, 'yyyy-MM-dd'), completed: false, completed_at: null, tagIds: selectedTagIds });
    setIsTaskDialogOpen(false); setSelectedTagIds([]); e.currentTarget.reset();
  };
  const handleAddNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createNote({ title: fd.get("title") as string, content: fd.get("content") as string });
    setIsNoteDialogOpen(false); e.currentTarget.reset();
  };
  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createEvent({ title: fd.get("title") as string, date: fd.get("date") as string, time: fd.get("time") as string || null, description: null, type: "meeting" });
    setIsEventDialogOpen(false); e.currentTarget.reset();
  };

  return (
    <div className="p-6 space-y-6">

      {/* ══════════════════════════════════════════════
          HERO — полная ширина, тёмный градиент
      ══════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-primary/80 to-slate-900 p-8 min-h-[200px]">
        {/* Декоративные круги */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Левая часть — приветствие */}
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <span>{greeting.emoji}</span>
              <span>{greeting.text}</span>
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-1 truncate">
              {displayName}!
            </h1>
            <p className="text-white/50 text-sm mb-4">{greeting.sub}</p>
            <p className="text-white/70 text-sm italic max-w-md leading-relaxed">
              «{quote}»
            </p>
            <p className="text-white/40 text-xs mt-4">
              {format(today, "EEEE, d MMMM yyyy", { locale: ru })}
            </p>
          </div>

          {/* Центр — кольцо + статистика */}
          <div className="flex items-center gap-8 flex-shrink-0">
            <div className="flex flex-col items-center gap-2">
              <ProductivityRing score={productivityScore} />
              <p className="text-white/50 text-xs text-center">Продуктивность</p>
            </div>
            <div className="hidden lg:flex flex-col gap-4">
              {[
                { label: "Задач выполнено", value: `${todayCompleted}/${todayTasks.length}`, icon: CheckCheck, color: "text-green-400" },
                { label: "Привычки (7 дн.)", value: `${avgHabit}%`, icon: Flame, color: "text-orange-400" },
                { label: "Событий", value: stats?.calendarEvents || 0, icon: Calendar, color: "text-blue-400" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className={cn("h-4 w-4 flex-shrink-0", s.color)} />
                  <div>
                    <p className="text-white/40 text-xs leading-none">{s.label}</p>
                    <p className="text-white font-bold text-lg leading-tight">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Правая часть — быстрые действия */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Быстро создать</p>
            {[
              { icon: CheckSquare, label: "Задача", color: "bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30 text-blue-300", open: () => setIsTaskDialogOpen(true) },
              { icon: FileText, label: "Заметка", color: "bg-amber-500/20 hover:bg-amber-500/40 border-amber-500/30 text-amber-300", open: () => setIsNoteDialogOpen(true) },
              { icon: Calendar, label: "Событие", color: "bg-emerald-500/20 hover:bg-emerald-500/40 border-emerald-500/30 text-emerald-300", open: () => setIsEventDialogOpen(true) },
            ].map(a => (
              <button key={a.label} onClick={a.open}
                className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium", a.color)}>
                <a.icon className="h-4 w-4" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          РЯД 2: Фокус дня (широкий) + Обзор недели + Горящие
      ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Фокус дня — 2 колонки */}
        <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-primary">
              <Star className="h-4 w-4 fill-primary" />
              Фокус дня
            </CardTitle>
          </CardHeader>
          <CardContent>
            {focusTask ? (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                  <Badge variant={focusTask.priority === 'high' ? 'destructive' : focusTask.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                    {focusTask.priority === 'high' ? '🔴 Высокий приоритет' : focusTask.priority === 'medium' ? '🟡 Средний' : '🟢 Низкий'}
                  </Badge>
                  <p className="font-semibold text-lg leading-snug">{focusTask.title}</p>
                  {focusTask.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{focusTask.description}</p>
                  )}
                  {focusTask.due_date && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(focusTask.due_date), "d MMMM", { locale: ru })}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => toggleTask(focusTask.id)}>
                    <CheckCheck className="h-4 w-4 mr-1.5" />
                    {focusTask.completed ? "Снять отметку" : "Выполнено!"}
                  </Button>
                  <Button size="sm" variant="outline" className="px-3" onClick={() => {
                    const others = tasks.filter(t => !t.completed && t.id !== focusTask.id);
                    if (others.length) setFocusTaskId(others[Math.floor(Math.random() * others.length)].id);
                  }}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCheck className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Все задачи выполнены!</p>
                  <p className="text-xs text-muted-foreground mt-1">🎉 Ты молодец</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Обзор недели — 1 колонка */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Неделя
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-20 mb-3">
              {weekDays.map((day, i) => {
                const h = day.total === 0 ? 4 : Math.round((day.total / maxW) * 72) + 8;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={cn("w-full rounded-sm transition-all", day.isToday ? "bg-primary rounded-md" : "bg-muted-foreground/25")}
                      style={{ height: `${h}px` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {weekDays.map((day, i) => (
                <div key={i} className="flex-1 text-center">
                  <p className={cn("text-xs font-medium", day.isToday ? "text-primary" : "text-muted-foreground")}>
                    {day.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Задач всего</span>
                <span className="font-semibold">{stats?.totalTasks || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Выполнено</span>
                <span className="font-semibold text-green-500">{stats?.tasksCompleted || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Горящие задачи — 2 колонки */}
        <Card className="lg:col-span-2 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Горящие задачи
              {urgentTasks.length > 0 && (
                <Badge variant="destructive" className="text-xs ml-auto">{urgentTasks.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgentTasks.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCheck className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">Дедлайны под контролем!</p>
              </div>
            ) : urgentTasks.map(task => {
              const due = task.due_date ? parseISO(task.due_date) : null;
              const overdue = due && isPast(due) && !isToday(due);
              return (
                <div key={task.id} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-sm",
                  overdue ? "bg-red-500/5 border-red-500/20" : "bg-orange-500/5 border-orange-500/20"
                )}>
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)}
                    className="h-4 w-4 flex-shrink-0 cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{task.title}</p>
                    {due && (
                      <p className={cn("text-xs mt-0.5", overdue ? "text-red-500" : "text-orange-500")}>
                        {overdue ? "⏰ Просрочено: " : "📅 До: "}{format(due, "d MMM", { locale: ru })}
                      </p>
                    )}
                  </div>
                  <AlertCircle className={cn("h-4 w-4 flex-shrink-0", overdue ? "text-red-500" : "text-orange-400")} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════
          РЯД 3: Задачи сегодня + События + Привычки
      ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Задачи на сегодня */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Задачи сегодня
              </CardTitle>
              <Badge variant="outline" className="text-xs">{todayCompleted}/{todayTasks.length}</Badge>
            </div>
            {todayTasks.length > 0 && (
              <Progress value={todayTasks.length > 0 ? (todayCompleted / todayTasks.length) * 100 : 0} className="h-1 mt-2" />
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2 text-center">
                <span className="text-3xl">📋</span>
                <p className="text-sm text-muted-foreground">Нет задач на сегодня</p>
              </div>
            ) : todayTasks.slice(0, 5).map(task => (
              <div key={task.id} className={cn("flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors", task.completed && "opacity-50")}>
                <input type="checkbox" checked={task.completed || false} onChange={() => toggleTask(task.id)} className="h-4 w-4 cursor-pointer flex-shrink-0" />
                <p className={cn("text-sm flex-1 truncate", task.completed && "line-through text-muted-foreground")}>{task.title}</p>
                <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"} className="text-xs flex-shrink-0 px-1.5">
                  {task.priority === "high" ? "!" : task.priority === "medium" ? "•" : "○"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Предстоящие события */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Предстоящие события
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2 text-center">
                <span className="text-3xl">📅</span>
                <p className="text-sm text-muted-foreground">Нет предстоящих событий</p>
              </div>
            ) : upcomingEvents.map(event => {
              const d = parseISO(event.date);
              const todayFlag = isToday(d);
              const sourceBadge = (event as any).source;
              return (
                <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors">
                  <div className={cn("w-9 h-9 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-center", todayFlag ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <span className="text-xs font-bold leading-none">{format(d, 'd')}</span>
                    <span className="text-xs leading-none opacity-70">{format(d, 'MMM', { locale: ru })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {todayFlag ? "Сегодня" : format(d, "EEE", { locale: ru })}
                      {event.time ? ` · ${event.time}` : ""}
                      {sourceBadge === 'google' && " · Google"}
                      {sourceBadge === 'yandex' && " · Яндекс"}
                    </p>
                  </div>
                  {todayFlag && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Привычки */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Привычки — 7 дней
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {habitProgress.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2 text-center">
                <span className="text-3xl">💪</span>
                <p className="text-sm text-muted-foreground">Нет активных привычек</p>
              </div>
            ) : habitProgress.slice(0, 5).map(habit => (
              <div key={habit.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate flex-1 mr-2">{habit.name}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-400" />
                    {habit.done}/7
                  </span>
                </div>
                <Progress value={habit.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════
          РЯД 4: Последние заметки (широко)
      ══════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" />
            Последние заметки
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotes.length === 0 ? (
            <div className="flex items-center justify-center py-6 gap-3 text-muted-foreground">
              <span className="text-2xl">📝</span>
              <p className="text-sm">Заметок пока нет</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentNotes.map(note => {
                const fl = note.content?.split('\n')[0] || "";
                const emoji = fl.match(/^\p{Emoji}/u)?.[0] || "📝";
                return (
                  <div key={note.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border">
                    <span className="text-2xl flex-shrink-0">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {note.content?.replace(/^.+\n/, "").replace(/[#\-\[\]⚡💡🔲📖🔍📕🌅🎯✈️💪🍳🗣️📋📞📊]/g, "").trim() || "Нет содержания"}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {format(new Date(note.updated_at), "d MMM, HH:mm", { locale: ru })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Диалоги ── */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новая задача</DialogTitle></DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div><Label>Название</Label><Input name="title" required className="mt-1" /></div>
            <div>
              <Label>Приоритет</Label>
              <select name="priority" className="w-full px-3 py-2 border border-border rounded-md bg-background mt-1" required>
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>
            <div><Label>Описание</Label><Textarea name="description" className="mt-1" /></div>
            <TaskTagSelector selectedTagIds={selectedTagIds} onTagsChange={setSelectedTagIds} />
            <Button type="submit" className="w-full">Создать задачу</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новая заметка</DialogTitle></DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div><Label>Название</Label><Input name="title" required className="mt-1" /></div>
            <div><Label>Содержание</Label><Textarea name="content" className="min-h-[120px] mt-1" /></div>
            <Button type="submit" className="w-full">Создать заметку</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новое событие</DialogTitle></DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div><Label>Название</Label><Input name="title" required className="mt-1" /></div>
            <div><Label>Дата</Label><Input name="date" type="date" defaultValue={format(today, 'yyyy-MM-dd')} required className="mt-1" /></div>
            <div><Label>Время</Label><Input name="time" type="time" className="mt-1" /></div>
            <Button type="submit" className="w-full">Создать событие</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedTask?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div><Label>Приоритет</Label><p className="mt-1">{selectedTask?.priority === "high" ? "Высокий" : selectedTask?.priority === "medium" ? "Средний" : "Низкий"}</p></div>
            {selectedTask?.due_date && <div><Label>Дедлайн</Label><p className="mt-1">{format(parseISO(selectedTask.due_date), "dd MMMM yyyy", { locale: ru })}</p></div>}
            <div><Label>Описание</Label><p className="mt-1 text-muted-foreground">{selectedTask?.description || "Нет описания"}</p></div>
            <div><Label>Статус</Label><p className="mt-1">{selectedTask?.completed ? "✓ Выполнена" : "В работе"}</p></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
