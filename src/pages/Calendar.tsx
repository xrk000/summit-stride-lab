import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Search, X, Calendar as CalendarIcon, CheckSquare, TrendingUp, RefreshCw, Unplug } from "lucide-react";
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

  const isExternalEvent = (event: any) => event.source === 'google' || event.source === 'yandex';

  const getEventCardClass = (event: any) => {
    if (event.source === 'google') return 'bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20';
    if (event.source === 'yandex') return 'bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20';
    return 'bg-muted/50 hover:bg-muted';
  };

  if (isLoading) return <div className="p-8"><p className="text-muted-foreground">Загрузка календаря...</p></div>;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Календарь</h1>
          <p className="text-muted-foreground mt-1">{format(currentDate, "LLLL yyyy", { locale: ru })}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingEvent(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="h-4 w-4 mr-2" />Новое событие</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingEvent ? "Редактировать событие" : "Новое событие"}</DialogTitle></DialogHeader>
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
      </div>

      {/* Google Calendar Panel */}
      <Card className={isConnected ? "border-blue-500/30 bg-blue-500/5" : "border-dashed"}>
        <CardContent className="flex items-center justify-between p-4">
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
                  {integration.last_sync_at ? `Синхронизировано: ${format(parseISO(integration.last_sync_at), "d MMM, HH:mm", { locale: ru })}` : "Ещё не синхронизировалось"}
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
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
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
        </CardContent>
      </Card>

      {/* Yandex Calendar Panel */}
      <YandexCalendarPanel />

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по тегам..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(e.target.value.length > 0); }}
            className="pl-9"
          />
          {showSearchResults && searchResults.length > 0 && (
            <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 shadow-lg">
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Результаты поиска ({searchResults.length})</h3>
                  <button onClick={() => setShowSearchResults(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                {searchResults.map((result, idx) => (
                  <button key={`${result.type}-${result.id}-${idx}`} onClick={() => handleSearchResultClick(result)} className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {result.type === 'event' && <CalendarIcon className="h-4 w-4 text-primary" />}
                          {result.type === 'task' && <CheckSquare className="h-4 w-4 text-primary" />}
                          {result.type === 'habit' && <TrendingUp className="h-4 w-4 text-primary" />}
                          <span className="font-medium text-sm">{result.type === 'habit' ? (result as any).name : (result as any).title}</span>
                          {(result as any).source === 'google' && <span className="flex items-center gap-1 text-xs text-blue-500"><GoogleIcon />Google</span>}
                          {(result as any).source === 'yandex' && <span className="flex items-center gap-1 text-xs text-orange-500"><YandexIcon />Яндекс</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{format(parseISO(result.date), 'dd MMMM yyyy', { locale: ru })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{result.type === 'event' ? 'Событие' : result.type === 'task' ? 'Задача' : 'Привычка'}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
        <div className="flex gap-2">
          {["all", "events", "tasks", "habits"].map(f => (
            <Button key={f} variant={typeFilter === f ? "default" : "outline"} onClick={() => setTypeFilter(f)}>
              {f === "all" ? "Все" : f === "events" ? "События" : f === "tasks" ? "Задачи" : "Привычки"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentDate, "LLLL yyyy", { locale: ru })}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground">{day}</div>
              ))}
            </div>
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
                    className={`aspect-square p-2 rounded-lg border transition-colors ${getHeatmapClass(day)} ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'} ${isToday && !isSelected ? 'border-primary' : 'border-border'} ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}`}
                  >
                    <div className="text-sm font-medium">{format(day, 'd')}</div>
                    {hasItems && (
                      <div className="flex gap-1 mt-1 justify-center flex-wrap">
                        {manualEvents.slice(0, 1).map((_, i) => <div key={`m-${i}`} className="w-1.5 h-1.5 rounded-full bg-blue-500" />)}
                        {googleEvents.slice(0, 1).map((_, i) => <div key={`g-${i}`} className="w-1.5 h-1.5 rounded-full bg-red-400" />)}
                        {yandexEvents.slice(0, 1).map((_, i) => <div key={`y-${i}`} className="w-1.5 h-1.5 rounded-full bg-orange-400" />)}
                        {dayTasks.slice(0, 1).map((t, i) => (
                          <div key={`t-${i}`} className={`w-1.5 h-1.5 rounded-full ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        ))}
                        {dayHabits.slice(0, 1).map((_, i) => <div key={`h-${i}`} className="w-1.5 h-1.5 rounded-full bg-purple-500" />)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-blue-500" />Событие</span>
              {isConnected && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-red-400" />Google</span>}
              {isYandexConnected && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-orange-400" />Яндекс</span>}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-yellow-500" />Задача</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2 h-2 rounded-full bg-purple-500" />Привычка</span>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>{format(parseISO(selectedDay), "d MMMM", { locale: ru })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDayEvents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">События</h3>
                {selectedDayEvents.map(event => (
                  <div key={event.id} className={`p-3 rounded-lg transition-colors cursor-pointer ${getEventCardClass(event)}`} onClick={() => setViewingItem({ type: 'event', data: event })}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {event.time && <span className="text-xs text-muted-foreground">{event.time}</span>}
                          {getEventSourceBadge(event)}
                        </div>
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        {event.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
                      </div>
                      {!isExternalEvent(event) && (
                        <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => handleEditEvent(event)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedDayTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Задачи с дедлайном</h3>
                {selectedDayTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setViewingItem({ type: 'task', data: task })}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                        {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </Badge>
                      {task.completed && <Badge variant="outline" className="bg-green-500/10 text-green-500">Выполнено</Badge>}
                    </div>
                    <p className="font-medium">{task.title}</p>
                    {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {selectedDayHabits.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Выполненные привычки</h3>
                {selectedDayHabits.map(habit => (
                  <div key={habit.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setViewingItem({ type: 'habit', data: habit })}>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 mb-1">Привычка</Badge>
                    <p className="font-medium">{habit.name}</p>
                    {habit.description && <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 && selectedDayHabits.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Нет событий, задач и привычек на этот день</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingEventId} onOpenChange={() => setDeletingEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить событие?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить. Событие будет удалено навсегда.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingItem?.type === 'event' && viewingItem.data.source === 'google' && <><GoogleIcon /><span>Событие из Google Calendar</span></>}
              {viewingItem?.type === 'event' && viewingItem.data.source === 'yandex' && <><YandexIcon /><span>Событие из Яндекс Календаря</span></>}
              {viewingItem?.type === 'event' && !viewingItem.data.source && 'Событие'}
              {viewingItem?.type === 'task' && 'Задача'}
              {viewingItem?.type === 'habit' && 'Привычка'}
            </DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Название</Label>
                <p className="text-foreground mt-1">{viewingItem.type === 'habit' ? viewingItem.data.name : viewingItem.data.title}</p>
              </div>
              {viewingItem.type === 'event' && !isExternalEvent(viewingItem.data) && viewingItem.data.type && (
                <div>
                  <Label className="text-sm font-semibold">Тип</Label>
                  <p className="text-foreground mt-1">{viewingItem.data.type === 'meeting' ? 'Встреча' : viewingItem.data.type === 'reminder' ? 'Напоминание' : 'Заметка'}</p>
                </div>
              )}
              {viewingItem.data.date && (
                <div>
                  <Label className="text-sm font-semibold">Дата</Label>
                  <p className="text-foreground mt-1">{format(parseISO(viewingItem.data.date), "d MMMM yyyy", { locale: ru })}</p>
                </div>
              )}
              {viewingItem.data.time && (
                <div>
                  <Label className="text-sm font-semibold">Время</Label>
                  <p className="text-foreground mt-1">{viewingItem.data.time}</p>
                </div>
              )}
              {viewingItem.type === 'task' && (
                <>
                  {viewingItem.data.priority && (
                    <div>
                      <Label className="text-sm font-semibold">Приоритет</Label>
                      <p className="text-foreground mt-1">{viewingItem.data.priority === 'high' ? 'Высокий' : viewingItem.data.priority === 'medium' ? 'Средний' : 'Низкий'}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-semibold">Статус</Label>
                    <p className="text-foreground mt-1">{viewingItem.data.completed ? 'Выполнено' : 'В работе'}</p>
                  </div>
                </>
              )}
              {viewingItem.type === 'habit' && viewingItem.data.frequency && (
                <div>
                  <Label className="text-sm font-semibold">Частота</Label>
                  <p className="text-foreground mt-1">{viewingItem.data.frequency === 'daily' ? 'Ежедневно' : viewingItem.data.frequency === 'weekly' ? 'Еженедельно' : viewingItem.data.frequency}</p>
                </div>
              )}
              {viewingItem.data.description && (
                <div>
                  <Label className="text-sm font-semibold">Описание</Label>
                  <p className="text-foreground mt-1 whitespace-pre-wrap">{viewingItem.data.description}</p>
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
