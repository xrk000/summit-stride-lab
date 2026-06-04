import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Search, X,
  Calendar as CalendarIcon, CheckSquare, TrendingUp, RefreshCw,
  Unplug, MapPin, Video, RefreshCcw, Loader2, Link
} from "lucide-react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useAllEventTags } from "@/hooks/useAllEventTags";
import { useAllTaskTags } from "@/hooks/useAllTaskTags";
import { useAllHabitTags } from "@/hooks/useAllHabitTags";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { YandexCalendarPanel } from "@/components/YandexCalendarPanel";
import { useYandexCalendar } from "@/hooks/useYandexCalendar";
import { cn } from "@/lib/utils";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const YandexIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.04 12c0-5.523 4.476-10 9.998-10C17.523 2 22 6.477 22 12s-4.477 10-10.002 10C6.515 22 2.04 17.523 2.04 12z" fill="#FC3F1D" />
    <path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.958l1.045.704-3.003 4.549H7.49l2.717-4.044c-1.55-1.111-2.43-2.19-2.43-4.044 0-2.289 1.573-3.912 4.576-3.912h3.003v12h-2.036V7.666z" fill="white" />
  </svg>
);

export default function Calendar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewingItem, setViewingItem] = useState<{ type: 'event' | 'task' | 'habit', data: any } | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { integration, isConnected, isConnecting, connect, sync, isSyncing, disconnect, isDisconnecting } = useGoogleCalendar();
  const { isConnected: isYandexConnected } = useYandexCalendar();
  const { tasks } = useTasks();
  const { habits, habitEntries } = useHabits();
  const { data: eventTagsMap } = useAllEventTags();
  const { data: taskTagsMap } = useAllTaskTags();
  const { data: habitTagsMap } = useAllHabitTags();

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingEvent) {
      updateEvent({ id: editingEvent.id, title: formData.get("title") as string, type: formData.get("type") as string, date: formData.get("date") as string, time: formData.get("time") as string, description: formData.get("description") as string });
      setEditingEvent(null);
    } else {
      createEvent({ title: formData.get("title") as string, type: formData.get("type") as string, date: formData.get("date") as string, time: formData.get("time") as string, description: formData.get("description") as string });
    }
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditEvent = (event: any) => { setEditingEvent(event); setIsDialogOpen(true); };
  const handleDeleteEvent = (eventId: string) => setDeletingEventId(eventId);
  const confirmDelete = () => { if (deletingEventId !== null) { deleteEvent(deletingEventId); setDeletingEventId(null); } };

  const filteredEvents = events.filter(event => {
    const matchesTitle = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const eventTags = eventTagsMap?.get(event.id) || [];
    const matchesTags = eventTags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || typeFilter === "events";
    return (matchesTitle || matchesTags) && matchesType;
  });

  const filteredTasks = tasks.filter(task => {
    const matchesTitle = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const taskTags = taskTagsMap?.get(task.id) || [];
    const matchesTags = taskTags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || typeFilter === "tasks";
    return (matchesTitle || matchesTags) && matchesType;
  });

  const filteredHabits = habits.filter(habit => {
    const matchesName = habit.name.toLowerCase().includes(searchQuery.toLowerCase());
    const habitTags = habitTagsMap?.get(habit.id) || [];
    const matchesTags = habitTags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || typeFilter === "habits";
    return (matchesName || matchesTags) && matchesType;
  });

  const searchResults = searchQuery ? [
    ...filteredEvents.map(event => ({ ...event, type: 'event' as const, date: event.date })),
    ...filteredTasks.map(task => ({ ...task, type: 'task' as const, date: task.due_date || '' })),
    ...filteredHabits.flatMap(habit => {
      const entries = habitEntries.filter(e => e.habit_id === habit.id && e.completed);
      return entries.map(entry => ({ ...habit, type: 'habit' as const, date: entry.date, entryId: entry.id }));
    })
  ].filter(item => item.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

  const handleSearchResultClick = (result: any) => {
    setSelectedDay(result.date);
    setCurrentDate(parseISO(result.date));
    setViewingItem({ type: result.type, data: result });
    setShowSearchResults(false);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getEventsForDay = (day: Date) => filteredEvents.filter(event => event.date === format(day, 'yyyy-MM-dd'));
  const getTasksForDay = (day: Date) => filteredTasks.filter(task => task.due_date === format(day, 'yyyy-MM-dd'));
  const getHabitsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const completedIds = habitEntries.filter(e => e.date === dayStr && e.completed).map(e => e.habit_id);
    return filteredHabits.filter(h => completedIds.includes(h.id));
  };

  const selectedDayEvents = filteredEvents.filter(event => event.date === selectedDay);
  const selectedDayTasks = filteredTasks.filter(task => task.due_date === selectedDay);
  const selectedDayHabits = getHabitsForDay(parseISO(selectedDay));

  const getDayActivity = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const completedIds = habitEntries.filter(e => e.date === dayStr && e.completed).map(e => e.habit_id);
    return filteredEvents.filter(e => e.date === dayStr).length
      + filteredTasks.filter(t => t.due_date === dayStr).length
      + filteredHabits.filter(h => completedIds.includes(h.id)).length;
  };

  const getHeatmapClass = (day: Date) => {
    const count = getDayActivity(day);
    if (count === 0) return "";
    if (count === 1) return "bg-primary/20";
    if (count === 2) return "bg-primary/40";
    if (count === 3) return "bg-primary/60";
    return "bg-primary/80";
  };

  const isExternalEvent = (event: any) => event.source === 'google' || event.source === 'yandex';

  const getEventCardClass = (event: any) => {
    if (event.source === 'google') return 'bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20';
    if (event.source === 'yandex') return 'bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20';
    return 'bg-muted/40 hover:bg-muted/70 border border-border/50';
  };

  const getEventSourceBadge = (event: any) => {
    if (event.source === 'google') return (
      <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-600 dark:text-blue-400 gap-1 px-1.5">
        <GoogleIcon /> Google
      </Badge>
    );
    if (event.source === 'yandex') return (
      <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-600 dark:text-orange-400 gap-1 px-1.5">
        <YandexIcon /> Яндекс
      </Badge>
    );
    return (
      <Badge variant={event.type === 'meeting' ? 'default' : event.type === 'task' ? 'secondary' : 'outline'}>
        {event.type === 'meeting' ? 'Встреча' : event.type === 'task' ? 'Задача' : event.type === 'reminder' ? 'Напоминание' : 'Заметка'}
      </Badge>
    );
  };

  // Статистика для hero
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const thisMonthEvents = events.filter(e => { try { return isSameMonth(parseISO(e.date), currentDate); } catch { return false; } }).length;
  const todayEventCount = events.filter(e => e.date === todayStr).length;
  const connectedCount = (isConnected ? 1 : 0) + (isYandexConnected ? 1 : 0);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Загрузка календаря...</span>
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
          {/* Заголовок */}
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              Расписание и события
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white">Календарь</h1>
            <p className="text-white/40 text-xs mt-2">
              {format(currentDate, "LLLL yyyy", { locale: ru })}
            </p>
          </div>

          {/* Статистика */}
          <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
            {[
              { label: "В этом месяце", value: thisMonthEvents, icon: CalendarIcon, color: "text-blue-400" },
              { label: "Сегодня", value: todayEventCount, icon: CheckSquare, color: "text-green-400" },
              { label: "Интеграций", value: `${connectedCount}/2`, icon: Link, color: "text-amber-400" },
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

          {/* Кнопка */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border transition-all text-sm font-medium bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30 text-blue-300"
            >
              <Plus className="h-4 w-4" />
              Новое событие
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ПОИСК + ФИЛЬТРЫ
      ═══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по событиям, задачам, тегам..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(e.target.value.length > 0); }}
            className="pl-9 bg-muted/40 border-border/60"
          />
          {/* Выпадающие результаты */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 rounded-xl border border-border/60 bg-popover shadow-lg">
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="font-semibold text-sm">Результаты ({searchResults.length})</span>
                  <button onClick={() => setShowSearchResults(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {searchResults.map((result, idx) => (
                  <button
                    key={`${result.type}-${result.id}-${idx}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left p-3 rounded-xl border border-border/50 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {result.type === 'event' && <CalendarIcon className="h-3.5 w-3.5 text-primary" />}
                          {result.type === 'task' && <CheckSquare className="h-3.5 w-3.5 text-primary" />}
                          {result.type === 'habit' && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
                          <span className="font-medium text-sm truncate">
                            {result.type === 'habit' ? (result as any).name : (result as any).title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-5">
                          {format(parseISO(result.date), 'dd MMMM yyyy', { locale: ru })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {result.type === 'event' ? 'Событие' : result.type === 'task' ? 'Задача' : 'Привычка'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border/60 shrink-0">
          {[
            { key: "all", label: "Все" },
            { key: "events", label: "События" },
            { key: "tasks", label: "Задачи" },
            { key: "habits", label: "Привычки" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                typeFilter === f.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ОСНОВНАЯ СЕТКА: КАЛЕНДАРЬ + БОКОВАЯ ПАНЕЛЬ
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Сетка месяца */}
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-5">
          {/* Навигация */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold capitalize">
              {format(currentDate, "LLLL yyyy", { locale: ru })}
            </h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Названия дней */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground">{day}</div>
            ))}
          </div>

          {/* Дни */}
          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map(day => {
              const dayEvents = getEventsForDay(day);
              const dayTasks = getTasksForDay(day);
              const dayHabits = getHabitsForDay(day);
              const dayStr = format(day, 'yyyy-MM-dd');
              const isSelected = dayStr === selectedDay;
              const isToday = isSameDay(day, new Date());
              const hasItems = dayEvents.length > 0 || dayTasks.length > 0 || dayHabits.length > 0;
              const manualEvents = dayEvents.filter(e => !e.source || e.source === 'manual');
              const googleEvents = dayEvents.filter(e => e.source === 'google');
              const yandexEvents = dayEvents.filter(e => e.source === 'yandex');

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDay(dayStr)}
                  className={cn(
                    "aspect-square p-2 rounded-lg border transition-colors",
                    getHeatmapClass(day),
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : isToday
                        ? "border-primary hover:bg-muted"
                        : "border-border hover:bg-muted",
                    !isSameMonth(day, currentDate) && "opacity-50"
                  )}
                >
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                  {hasItems && (
                    <div className="flex gap-1 mt-1 justify-center flex-wrap">
                      {manualEvents.slice(0, 1).map((_, i) => <div key={`m-${i}`} className="w-1.5 h-1.5 rounded-full bg-blue-500" />)}
                      {googleEvents.slice(0, 1).map((ev, i) => (
                        <div key={`g-${i}`} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color || '#ea4335' }} />
                      ))}
                      {yandexEvents.slice(0, 1).map((_, i) => <div key={`y-${i}`} className="w-1.5 h-1.5 rounded-full bg-orange-400" />)}
                      {dayTasks.slice(0, 1).map((t, i) => (
                        <div key={`t-${i}`} className={cn("w-1.5 h-1.5 rounded-full", t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500')} />
                      ))}
                      {dayHabits.slice(0, 1).map((_, i) => <div key={`h-${i}`} className="w-1.5 h-1.5 rounded-full bg-purple-500" />)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Легенда */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-blue-500" />Событие</span>
            {isConnected && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-red-400" />Google</span>}
            {isYandexConnected && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-orange-400" />Яндекс</span>}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-yellow-500" />Задача</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-purple-500" />Привычка</span>
          </div>
        </div>

        {/* Боковая панель: события дня */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="font-semibold text-base">
            {format(parseISO(selectedDay), "d MMMM", { locale: ru })}
          </h3>

          {selectedDayEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">События</p>
              {selectedDayEvents.map(event => (
                <div
                  key={event.id}
                  className={cn("p-3 rounded-xl transition-colors cursor-pointer", getEventCardClass(event))}
                  style={event.color ? { borderLeftColor: event.color, borderLeftWidth: '3px' } : {}}
                  onClick={() => setViewingItem({ type: 'event', data: event })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {event.time && (
                          <span className="text-xs text-muted-foreground font-medium">
                            {event.time}{event.end_time ? ` — ${event.end_time}` : ''}
                          </span>
                        )}
                        {getEventSourceBadge(event)}
                        {event.is_recurring && (
                          <span title="Повторяющееся"><RefreshCcw className="h-3 w-3 text-muted-foreground" /></span>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />{event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                      )}
                      {event.meet_link && (
                        <a href={event.meet_link} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 mt-1">
                          <Video className="h-3 w-3" />Подключиться к Meet
                        </a>
                      )}
                    </div>
                    {!isExternalEvent(event) && (
                      <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditEvent(event)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteEvent(event.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDayTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Задачи с дедлайном</p>
              {selectedDayTasks.map(task => (
                <div key={task.id}
                  className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/50 transition-colors cursor-pointer"
                  onClick={() => setViewingItem({ type: 'task', data: task })}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                      {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                    </Badge>
                    {task.completed && <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">Выполнено</Badge>}
                  </div>
                  <p className="font-medium text-sm">{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                </div>
              ))}
            </div>
          )}

          {selectedDayHabits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Выполненные привычки</p>
              {selectedDayHabits.map(habit => (
                <div key={habit.id}
                  className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 transition-colors cursor-pointer"
                  onClick={() => setViewingItem({ type: 'habit', data: habit })}>
                  <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20 mb-1">Привычка</Badge>
                  <p className="font-medium text-sm">{habit.name}</p>
                  {habit.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{habit.description}</p>}
                </div>
              ))}
            </div>
          )}

          {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 && selectedDayHabits.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Нет событий на этот день</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ИНТЕГРАЦИИ
      ═══════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className={cn(
          "flex items-center justify-between p-4 rounded-xl border transition-all",
          isConnected ? "border-blue-500/30 bg-blue-500/5" : "border-border/60 bg-muted/20 border-dashed"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm border border-border flex-shrink-0">
              <GoogleIcon />
            </div>
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                Google Calendar
                {isConnected && <span className="inline-block w-2 h-2 rounded-full bg-green-500" />}
              </p>
              {isConnected && integration ? (
                <p className="text-xs text-muted-foreground">
                  {integration.last_sync_at
                    ? `Синхронизировано: ${format(parseISO(integration.last_sync_at), "d MMM, HH:mm", { locale: ru })}`
                    : "Ещё не синхронизировалось"}
                  {!integration.has_refresh_token && <span className="ml-2 text-yellow-500">· Требуется переподключение</span>}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Подключите, чтобы события из Google появились здесь</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Подключено
                </Badge>
                <Button variant="outline" size="sm" onClick={() => sync()} disabled={isSyncing}>
                  <RefreshCw className={cn("h-4 w-4 mr-1.5", isSyncing && "animate-spin")} />
                  {isSyncing ? "Синхронизация..." : "Обновить"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => disconnect()} disabled={isDisconnecting} className="text-muted-foreground hover:text-destructive">
                  <Unplug className="h-4 w-4 mr-1.5" />Отключить
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={connect} disabled={isConnecting} className="border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10">
                <GoogleIcon /><span className="ml-2">{isConnecting ? "Подключение..." : "Подключить"}</span>
              </Button>
            )}
          </div>
        </div>
        <YandexCalendarPanel />
      </div>

      {/* Диалог создания / редактирования */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingEvent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Редактировать событие" : "Новое событие"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" name="title" placeholder="Введите название события" defaultValue={editingEvent?.title} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Тип</Label>
              <Select name="type" defaultValue={editingEvent?.type || "meeting"}>
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
              <Input id="date" name="date" type="date" defaultValue={editingEvent?.date || selectedDay} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Время</Label>
              <Input id="time" name="time" type="time" defaultValue={editingEvent?.time} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" defaultValue={editingEvent?.description || ""} />
            </div>
            <Button type="submit" className="w-full">{editingEvent ? "Сохранить" : "Создать"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
      <AlertDialog open={!!deletingEventId} onOpenChange={() => setDeletingEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить событие?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Просмотр события/задачи/привычки */}
      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingItem?.type === 'event' && viewingItem.data.source === 'google' && <><GoogleIcon /><span>Google Calendar</span></>}
              {viewingItem?.type === 'event' && viewingItem.data.source === 'yandex' && <><YandexIcon /><span>Яндекс Календарь</span></>}
              {viewingItem?.type === 'event' && !viewingItem.data.source && 'Событие'}
              {viewingItem?.type === 'task' && 'Задача'}
              {viewingItem?.type === 'habit' && 'Привычка'}
            </DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-3">
              {viewingItem.data.color && (
                <div className="h-1 rounded-full" style={{ backgroundColor: viewingItem.data.color }} />
              )}
              <div>
                <Label className="text-sm font-semibold">Название</Label>
                <p className="text-foreground mt-1 font-medium">
                  {viewingItem.type === 'habit' ? viewingItem.data.name : viewingItem.data.title}
                </p>
              </div>
              {viewingItem.data.date && (
                <div>
                  <Label className="text-sm font-semibold">Дата</Label>
                  <p className="text-foreground mt-1">{format(parseISO(viewingItem.data.date), "d MMMM yyyy", { locale: ru })}</p>
                </div>
              )}
              {viewingItem.data.time && (
                <div>
                  <Label className="text-sm font-semibold">Время</Label>
                  <p className="text-foreground mt-1">
                    {viewingItem.data.time}{viewingItem.data.end_time ? ` — ${viewingItem.data.end_time}` : ''}
                  </p>
                </div>
              )}
              {viewingItem.data.location && (
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Место
                  </Label>
                  <p className="text-foreground mt-1">{viewingItem.data.location}</p>
                </div>
              )}
              {viewingItem.data.meet_link && (
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" /> Видеоконференция
                  </Label>
                  <a href={viewingItem.data.meet_link} target="_blank" rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 hover:underline text-sm mt-1 flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" />Подключиться к Google Meet
                  </a>
                </div>
              )}
              {viewingItem.data.is_recurring && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCcw className="h-3.5 w-3.5" />Повторяющееся событие
                </div>
              )}
              {viewingItem.type === 'event' && !isExternalEvent(viewingItem.data) && viewingItem.data.type && (
                <div>
                  <Label className="text-sm font-semibold">Тип</Label>
                  <p className="text-foreground mt-1">
                    {viewingItem.data.type === 'meeting' ? 'Встреча' : viewingItem.data.type === 'reminder' ? 'Напоминание' : 'Заметка'}
                  </p>
                </div>
              )}
              {viewingItem.type === 'task' && viewingItem.data.priority && (
                <div>
                  <Label className="text-sm font-semibold">Приоритет</Label>
                  <p className="text-foreground mt-1">
                    {viewingItem.data.priority === 'high' ? '🔴 Высокий' : viewingItem.data.priority === 'medium' ? '🟡 Средний' : '🟢 Низкий'}
                  </p>
                </div>
              )}
              {viewingItem.type === 'task' && (
                <div>
                  <Label className="text-sm font-semibold">Статус</Label>
                  <p className="text-foreground mt-1">{viewingItem.data.completed ? '✅ Выполнено' : '⏳ В работе'}</p>
                </div>
              )}
              {viewingItem.type === 'habit' && viewingItem.data.frequency && (
                <div>
                  <Label className="text-sm font-semibold">Частота</Label>
                  <p className="text-foreground mt-1">
                    {viewingItem.data.frequency === 'daily' ? 'Ежедневно' : viewingItem.data.frequency === 'every_2_days' ? 'Каждые 2 дня' : 'Каждые 3 дня'}
                  </p>
                </div>
              )}
              {viewingItem.data.description && (
                <div>
                  <Label className="text-sm font-semibold">Описание</Label>
                  <p className="text-foreground mt-1 whitespace-pre-wrap text-sm">{viewingItem.data.description}</p>
                </div>
              )}
              {viewingItem.type === 'event' && isExternalEvent(viewingItem.data) && (
                <p className="text-xs text-muted-foreground border-t border-border pt-3 flex items-center gap-1.5">
                  {viewingItem.data.source === 'google' ? <GoogleIcon /> : <YandexIcon />}
                  Импортировано из {viewingItem.data.source === 'google' ? 'Google Calendar' : 'Яндекс Календаря'}. Редактирование доступно только там.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
