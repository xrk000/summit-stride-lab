import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar, CheckSquare, TrendingUp, Plus, AlertCircle,
  FileText, Flame, Star, AlertTriangle, CheckCheck,
  ArrowRight, Settings, GripVertical, Eye, EyeOff, Check as CheckIcon,
  ChevronDown, Zap, FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isHabitDueOnDate } from "@/lib/habitUtils";
import { useTasks } from "@/hooks/useTasks";
import { useUserStats } from "@/hooks/useUserStats";
import { useHabits } from "@/hooks/useHabits";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useNotes } from "@/hooks/useNotes";
import { useAllTaskTags } from "@/hooks/useAllTaskTags";
import { useProfile } from "@/hooks/useProfile";
import { useProjects } from "@/hooks/useProjects";
import { useTags } from "@/hooks/useTags";
import { TaskTagSelector } from "@/components/TaskTagSelector";
import { TagInput } from "@/components/TagInput";
import { format, isToday, isFuture, isPast, parseISO, addDays, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragOverlay,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Widget system ────────────────────────────────────────────────────────────

type WidgetId = "focus" | "week" | "urgent" | "today" | "events" | "habits" | "notes";
type WidgetSize = 1 | 2 | 3;

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  size: WidgetSize;
}

const WIDGET_META: Record<WidgetId, { label: string }> = {
  focus:  { label: "Фокус дня" },
  week:   { label: "Обзор недели" },
  urgent: { label: "Горящие задачи" },
  today:  { label: "Задачи на сегодня" },
  events: { label: "Предстоящие события" },
  habits: { label: "Привычки — 7 дней" },
  notes:  { label: "Последние заметки" },
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "focus",  visible: true, size: 2 },
  { id: "week",   visible: true, size: 1 },
  { id: "today",  visible: true, size: 1 },
  { id: "events", visible: true, size: 1 },
  { id: "habits", visible: true, size: 1 },
  { id: "urgent", visible: true, size: 3 },
  { id: "notes",  visible: true, size: 3 },
];

const STORAGE_KEY = "flowstate_dashboard_v1";

function loadConfig(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: WidgetConfig[] = JSON.parse(raw);
      const storedIds = new Set(parsed.map(w => w.id));
      const missing = DEFAULT_WIDGETS.filter(w => !storedIds.has(w.id));
      return [...parsed, ...missing];
    }
  } catch {}
  return DEFAULT_WIDGETS;
}

function saveConfig(cfg: WidgetConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

// ─── SortableWidget ───────────────────────────────────────────────────────────

function SortableWidget({
  config, isEditing, onToggleVisible, onSetSize, children,
}: {
  config: WidgetConfig;
  isEditing: boolean;
  onToggleVisible: () => void;
  onSetSize: (s: WidgetSize) => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: config.id, disabled: !isEditing });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  if (!config.visible && !isEditing) return null;

  const spanClasses: Record<WidgetSize, string> = {
    1: "col-span-1",
    2: "col-span-1 sm:col-span-2",
    3: "col-span-1 sm:col-span-2 lg:col-span-3",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex flex-col", spanClasses[config.size], !config.visible && isEditing && "opacity-40")}
    >
      {isEditing && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded-lg bg-primary/10 border border-primary/30 border-dashed select-none flex-shrink-0">
          <button
            {...attributes} {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground touch-none flex-shrink-0"
            title="Перетащить"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium flex-1 truncate text-foreground">
            {WIDGET_META[config.id].label}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-muted-foreground mr-0.5">Размер:</span>
            {([1, 2, 3] as WidgetSize[]).map(s => (
              <button key={s} onClick={() => onSetSize(s)}
                className={cn(
                  "w-6 h-6 text-xs rounded font-bold transition-colors",
                  config.size === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                )}>
                {s}
              </button>
            ))}
            <button onClick={onToggleVisible}
              className={cn("p-1 rounded transition-colors hover:bg-muted ml-1",
                !config.visible ? "text-muted-foreground" : "text-foreground")}
              title={config.visible ? "Скрыть" : "Показать"}>
              {config.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
      <div className={cn("flex-1 min-h-0", isEditing && !config.visible && "pointer-events-none")}>
        {children}
      </div>
    </div>
  );
}

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
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Отлично!" : score >= 50 ? "Хорошо" : "Давай!";
  return (
    <div className="relative flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28">
      <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/20" />
        <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg sm:text-2xl font-bold text-white">{score}</span>
        <span className="text-[10px] sm:text-xs text-white/70">{label}</span>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  // ── Диалоги и выбор ──
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newNoteTags, setNewNoteTags] = useState<any[]>([]);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  // ── Widget config ──
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isBriefOpen, setIsBriefOpen] = useState(() => {
    try { return localStorage.getItem('flowstate_brief_open') === 'true'; } catch { return false; }
  });

  const updateWidgets = useCallback((next: WidgetConfig[]) => {
    setWidgets(next);
    saveConfig(next);
  }, []);

  const toggleVisible = useCallback((id: WidgetId) => {
    updateWidgets(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  }, [widgets, updateWidgets]);

  const setSize = useCallback((id: WidgetId, size: WidgetSize) => {
    updateWidgets(widgets.map(w => w.id === id ? { ...w, size } : w));
  }, [widgets, updateWidgets]);

  // ── DnD ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  }, []);

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIdx = widgets.findIndex(w => w.id === active.id);
      const newIdx = widgets.findIndex(w => w.id === over.id);
      updateWidgets(arrayMove(widgets, oldIdx, newIdx));
    }
  }, [widgets, updateWidgets]);

  // ── Данные ──
  const { tasks, createTask, toggleTask } = useTasks();
  const { projects } = useProjects();
  const { addTagToEntity } = useTags();
  const { data: stats } = useUserStats();
  const { habits, habitEntries } = useHabits();
  const { events, createEvent } = useCalendarEvents();
  const { notes, createNoteAsync } = useNotes();
  const { data: taskTagsMap } = useAllTaskTags();
  const { profile } = useProfile();

  const greeting = getGreeting();
  const quote = getDailyQuote();
  const today = new Date();

  const displayName = profile?.username || (profile as any)?.email?.split('@')[0] || "Пользователь";
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
    const last7Dates = Array.from({ length: 7 }, (_, i) => subDays(today, i));
    const scheduledDates = last7Dates.filter(d => isHabitDueOnDate(habit, d));
    const done = scheduledDates.filter(d =>
      habitEntries.some(e => e.habit_id === habit.id && e.date === format(d, 'yyyy-MM-dd') && e.completed)
    ).length;
    const total = Math.max(scheduledDates.length, 1);
    return { id: habit.id, name: habit.name, done, pct: Math.round((done / total) * 100) };
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

  const todayStr = format(today, 'yyyy-MM-dd');
  const todayDueHabits = habits.filter(h => isHabitDueOnDate(h, today));
  const todayHabitsCompleted = todayDueHabits.filter(h =>
    habitEntries.some(e => e.habit_id === h.id && e.date === todayStr && e.completed)
  ).length;
  const todayEventsList = events.filter(e => e.date === todayStr);
  const nextTodayEvent = todayEventsList.find(e => e.time);

  // ── Обработчики форм ──
  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createTask({
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      priority: fd.get("priority") as string,
      due_date: (fd.get("deadline") as string) || format(today, 'yyyy-MM-dd'),
      completed: false,
      completed_at: null,
      tagIds: selectedTagIds,
      projectId: selectedProjectId,
    });
    setIsTaskDialogOpen(false); setSelectedTagIds([]); setSelectedProjectId(null); e.currentTarget.reset();
  };
  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const newNote = await createNoteAsync({ title: fd.get("title") as string, content: fd.get("content") as string });
      if (newNote && newNoteTags.length > 0) {
        for (const tag of newNoteTags) {
          addTagToEntity({ entityType: 'note', entityId: (newNote as any).id, tagId: tag.id });
        }
      }
    } catch {
      return;
    }
    setIsNoteDialogOpen(false); setNewNoteTags([]); e.currentTarget.reset();
  };
  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createEvent({ title: fd.get("title") as string, date: fd.get("date") as string, time: fd.get("time") as string || null, description: (fd.get("description") as string) || null, type: (fd.get("type") as string) || "meeting" });
    setIsEventDialogOpen(false); e.currentTarget.reset();
  };

  // ── Рендер виджетов ──
  const renderWidget = (id: WidgetId) => {
    switch (id) {

      case "focus":
        return (
          <Card className="h-full border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Star className="h-4 w-4 fill-primary" />Фокус дня
              </CardTitle>
            </CardHeader>
            <CardContent>
              {focusTask ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 space-y-3 cursor-pointer hover:bg-primary/15 transition-colors"
                    onClick={() => setSelectedTask(focusTask)}>
                    <Badge variant={focusTask.priority === 'high' ? 'destructive' : focusTask.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                      {focusTask.priority === 'high' ? '🔴 Высокий приоритет' : focusTask.priority === 'medium' ? '🟡 Средний' : '🟢 Низкий'}
                    </Badge>
                    <p className="font-semibold text-lg leading-snug break-words line-clamp-3">{focusTask.title}</p>
                    {focusTask.description && <p className="text-sm text-muted-foreground line-clamp-2">{focusTask.description}</p>}
                    {focusTask.due_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{format(parseISO(focusTask.due_date), "d MMMM", { locale: ru })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => toggleTask(focusTask.id)}>
                      <CheckCheck className="h-4 w-4 mr-1.5" />{focusTask.completed ? "Снять отметку" : "Выполнено!"}
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
        );

      case "week":
        return (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />Неделя
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1.5 h-20 mb-3">
                {weekDays.map((day, i) => {
                  const h = day.total === 0 ? 4 : Math.round((day.total / maxW) * 72) + 8;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={cn("w-full rounded-sm transition-all", day.isToday ? "bg-primary rounded-md" : "bg-muted-foreground/25")} style={{ height: `${h}px` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1.5">
                {weekDays.map((day, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p className={cn("text-xs font-medium", day.isToday ? "text-primary" : "text-muted-foreground")}>{day.label}</p>
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
        );

      case "urgent":
        return (
          <Card className="h-full border-orange-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />Горящие задачи
                {urgentTasks.length > 0 && <Badge variant="destructive" className="text-xs ml-auto">{urgentTasks.length}</Badge>}
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
                  <div key={task.id}
                    className={cn("flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer hover:opacity-80 transition-opacity",
                      overdue ? "bg-red-500/5 border-red-500/20" : "bg-orange-500/5 border-orange-500/20")}
                    onClick={() => setSelectedTask(task)}>
                    <input type="checkbox" checked={task.completed}
                      onChange={e => { e.stopPropagation(); toggleTask(task.id); }}
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
        );

      case "today":
        return (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />Задачи сегодня
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
                <div key={task.id}
                  className={cn("flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors cursor-pointer", task.completed && "opacity-50")}
                  onClick={() => setSelectedTask(task)}>
                  <input type="checkbox" checked={task.completed || false}
                    onChange={e => { e.stopPropagation(); toggleTask(task.id); }}
                    className="h-4 w-4 cursor-pointer flex-shrink-0" />
                  <p className={cn("text-sm flex-1 truncate", task.completed && "line-through text-muted-foreground")}>{task.title}</p>
                  <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"} className="text-xs flex-shrink-0 px-1.5">
                    {task.priority === "high" ? "!" : task.priority === "medium" ? "•" : "○"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case "events":
        return (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />Предстоящие события
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
                  <div key={event.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(event)}>
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
        );

      case "habits":
        return (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />Привычки — 7 дней
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
                      <Flame className="h-3 w-3 text-orange-400" />{habit.done}/7
                    </span>
                  </div>
                  <Progress value={habit.pct} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case "notes":
        return (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />Последние заметки
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotes.length === 0 ? (
                <div className="flex items-center justify-center py-6 gap-3 text-muted-foreground">
                  <span className="text-2xl">📝</span>
                  <p className="text-sm">Заметок пока нет</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentNotes.map(note => {
                    const fl = note.content?.split('\n')[0] || "";
                    const emoji = fl.match(/^\p{Emoji}/u)?.[0] || "📝";
                    return (
                      <div key={note.id}
                        className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border"
                        onClick={() => setSelectedNote(note)}>
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
        );

      default:
        return null;
    }
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* ── Hero ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-primary/80 to-slate-900 p-4 sm:p-6 lg:p-8 sm:min-h-[200px]">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6 lg:gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-sm mb-1.5 sm:mb-2 flex items-center gap-1.5">
              <span>{greeting.emoji}</span><span>{greeting.text}</span>
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 truncate">{displayName}!</h1>
            <p className="text-white/50 text-sm mb-2 sm:mb-4">{greeting.sub}</p>
            <p className="hidden sm:block text-white/70 text-sm italic max-w-md leading-relaxed">«{quote}»</p>
            <p className="text-white/40 text-xs mt-2 sm:mt-4">{format(today, "EEEE, d MMMM yyyy", { locale: ru })}</p>
          </div>

          <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
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

          <div className="flex flex-col gap-2 flex-shrink-0">
            <p className="hidden sm:block text-white/40 text-xs uppercase tracking-wider mb-1">Быстро создать</p>
            <div className="flex flex-row flex-wrap sm:flex-col gap-2">
              {[
                { icon: CheckSquare, label: "Задача", color: "bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30 text-blue-300", open: () => setIsTaskDialogOpen(true) },
                { icon: FileText, label: "Заметка", color: "bg-amber-500/20 hover:bg-amber-500/40 border-amber-500/30 text-amber-300", open: () => setIsNoteDialogOpen(true) },
                { icon: Calendar, label: "Событие", color: "bg-emerald-500/20 hover:bg-emerald-500/40 border-emerald-500/30 text-emerald-300", open: () => setIsEventDialogOpen(true) },
              ].map(a => (
                <button key={a.label} onClick={a.open}
                  className={cn("flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all text-sm font-medium", a.color)}>
                  <a.icon className="h-4 w-4" />{a.label}
                </button>
              ))}
              <button onClick={() => setIsEditing(v => !v)}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all text-sm font-medium",
                  isEditing
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/30 text-purple-300"
                )}>
                <Settings className="h-4 w-4" />
                {isEditing ? "Завершить" : "Настроить"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily Brief ── */}
      <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
        <button
          onClick={() => { const n = !isBriefOpen; setIsBriefOpen(n); localStorage.setItem('flowstate_brief_open', String(n)); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
        >
          <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <div className="flex-1 flex items-center gap-2 text-sm flex-wrap min-w-0">
            <span className="flex items-center gap-1 text-muted-foreground">
              <CheckSquare className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <span className={cn(todayTasks.length > 0 && todayCompleted === todayTasks.length ? "text-green-400" : "")}>
                {todayTasks.length === 0 ? "Нет задач" : todayCompleted === todayTasks.length ? "Все задачи выполнены" : `${todayCompleted}/${todayTasks.length} задач`}
              </span>
            </span>
            <span className="text-muted-foreground/30 select-none">·</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              <span>
                {nextTodayEvent
                  ? `${nextTodayEvent.title} в ${nextTodayEvent.time}`
                  : todayEventsList.length > 0
                    ? `${todayEventsList.length} событие`
                    : "Событий нет"}
              </span>
            </span>
            <span className="text-muted-foreground/30 select-none">·</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
              <span className={cn(todayDueHabits.length > 0 && todayHabitsCompleted === todayDueHabits.length ? "text-orange-400" : "")}>
                {todayDueHabits.length === 0 ? "Привычек нет" : `${todayHabitsCompleted}/${todayDueHabits.length} привычек`}
              </span>
            </span>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", isBriefOpen && "rotate-180")} />
        </button>

        {isBriefOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-4 pt-3 border-t border-border/40">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Задачи</p>
              {todayTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Нет задач на сегодня</p>
              ) : todayTasks.slice(0, 4).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <div className={cn("w-3.5 h-3.5 rounded-full border flex-shrink-0",
                    task.completed ? "bg-green-500 border-green-500" : "border-muted-foreground/40")} />
                  <span className={cn("truncate", task.completed && "line-through text-muted-foreground")}>{task.title}</span>
                </div>
              ))}
              {todayTasks.length > 4 && <p className="text-xs text-muted-foreground">+{todayTasks.length - 4} ещё</p>}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">События сегодня</p>
              {todayEventsList.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Нет событий сегодня</p>
              ) : todayEventsList.slice(0, 3).map(event => (
                <div key={event.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                  <span className="truncate">
                    {event.title}
                    {event.time && <span className="text-muted-foreground"> · {event.time}</span>}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Привычки</p>
              {todayDueHabits.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Нет привычек на сегодня</p>
              ) : todayDueHabits.slice(0, 4).map(habit => {
                const done = habitEntries.some(e => e.habit_id === habit.id && e.date === todayStr && e.completed);
                return (
                  <div key={habit.id} className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3.5 h-3.5 rounded-full border flex-shrink-0",
                      done ? "bg-green-500 border-green-500" : "border-muted-foreground/40")} />
                    <span className={cn("truncate", done && "text-muted-foreground")}>{habit.name}</span>
                    {done && <CheckIcon className="h-3 w-3 text-green-500 flex-shrink-0" />}
                  </div>
                );
              })}
              {todayDueHabits.length > 4 && <p className="text-xs text-muted-foreground">+{todayDueHabits.length - 4} ещё</p>}
            </div>
          </div>
        )}
      </div>

      {/* ── Баннер режима редактирования ── */}
      {isEditing && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/30 border-dashed">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GripVertical className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Режим редактирования — перетаскивайте виджеты, меняйте размер <span className="font-semibold text-foreground">[1] [2] [3]</span> и видимость</span>
          </div>
          <button onClick={() => setIsEditing(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0 ml-4">
            <CheckIcon className="h-3.5 w-3.5" />Готово
          </button>
        </div>
      )}

      {/* ── Виджеты ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {widgets.map(widget => (
              <SortableWidget
                key={widget.id}
                config={widget}
                isEditing={isEditing}
                onToggleVisible={() => toggleVisible(widget.id)}
                onSetSize={(s) => setSize(widget.id, s)}
              >
                {renderWidget(widget.id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeId ? (
            <div className="rounded-xl border-2 border-primary border-dashed bg-card/90 p-5 shadow-2xl backdrop-blur-sm"
              style={{ gridColumn: `span ${widgets.find(w => w.id === activeId)?.size ?? 1}` }}>
              <p className="font-semibold text-sm flex items-center gap-2 text-primary">
                <GripVertical className="h-4 w-4" />
                {WIDGET_META[activeId as WidgetId]?.label}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Диалоги ── */}
      <Dialog open={isTaskDialogOpen} onOpenChange={(open) => {
        setIsTaskDialogOpen(open);
        if (!open) { setSelectedTagIds([]); setSelectedProjectId(null); }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Новая задача</DialogTitle></DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger><SelectValue placeholder="Выберите приоритет" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="low">Низкий</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Дедлайн</Label>
              <Input id="deadline" name="deadline" type="date" defaultValue={format(today, 'yyyy-MM-dd')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                Проект
              </Label>
              <Select
                value={selectedProjectId ?? "none"}
                onValueChange={v => setSelectedProjectId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без проекта" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Без проекта</span>
                  </SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TaskTagSelector selectedTagIds={selectedTagIds} onTagsChange={setSelectedTagIds} />
            <Button type="submit" className="w-full">Создать задачу</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={(open) => {
        setIsNoteDialogOpen(open);
        if (!open) setNewNoteTags([]);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Новая заметка</DialogTitle></DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" name="title" placeholder="Введите название заметки" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Содержание</Label>
              <Textarea id="content" name="content" placeholder="Напишите содержание заметки..." className="min-h-[280px] font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>Теги</Label>
              <TagInput
                entityType="note"
                entityId="temp"
                selectedTags={newNoteTags}
                isNewEntity
                onTagsChange={setNewNoteTags}
              />
            </div>
            <Button type="submit" className="w-full">Создать заметку</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новое событие</DialogTitle></DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" name="title" placeholder="Введите название события" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Тип</Label>
              <Select name="type" defaultValue="meeting">
                <SelectTrigger><SelectValue placeholder="Выберите тип события" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Встреча</SelectItem>
                  <SelectItem value="reminder">Напоминание</SelectItem>
                  <SelectItem value="note">Заметка</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Дата</Label>
              <Input id="date" name="date" type="date" defaultValue={format(today, 'yyyy-MM-dd')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Время</Label>
              <Input id="time" name="time" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" />
            </div>
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

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedEvent?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div><Label>Дата</Label><p className="mt-1">{selectedEvent?.date ? format(parseISO(selectedEvent.date), "dd MMMM yyyy", { locale: ru }) : "—"}</p></div>
            {selectedEvent?.time && <div><Label>Время</Label><p className="mt-1">{selectedEvent.time}{selectedEvent.end_time ? ` — ${selectedEvent.end_time}` : ""}</p></div>}
            {selectedEvent?.type && <div><Label>Тип</Label><p className="mt-1">{selectedEvent.type === "meeting" ? "Встреча" : selectedEvent.type === "reminder" ? "Напоминание" : "Заметка"}</p></div>}
            {selectedEvent?.source && selectedEvent.source !== "manual" && <div><Label>Источник</Label><p className="mt-1">{selectedEvent.source === "google" ? "Google Calendar" : "Яндекс Календарь"}</p></div>}
            {selectedEvent?.location && <div><Label>Место</Label><p className="mt-1">{selectedEvent.location}</p></div>}
            {selectedEvent?.description && <div><Label>Описание</Label><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{selectedEvent.description}</p></div>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedNote?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            {selectedNote?.updated_at && (
              <p className="text-xs text-muted-foreground">Обновлено: {format(new Date(selectedNote.updated_at), "d MMMM yyyy, HH:mm", { locale: ru })}</p>
            )}
            <div className="max-h-80 overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedNote?.content || "Нет содержания"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
