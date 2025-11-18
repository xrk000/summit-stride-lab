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
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useAllEventTags } from "@/hooks/useAllEventTags";
import { useAllTaskTags } from "@/hooks/useAllTaskTags";
import { useAllHabitTags } from "@/hooks/useAllHabitTags";
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export default function Calendar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { tasks } = useTasks();
  const { habits, habitEntries } = useHabits();
  const { data: eventTagsMap } = useAllEventTags();
  const { data: taskTagsMap } = useAllTaskTags();
  const { data: habitTagsMap } = useAllHabitTags();

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingEvent) {
      updateEvent({
        id: editingEvent.id,
        title: formData.get("title") as string,
        type: formData.get("type") as string,
        date: formData.get("date") as string,
        time: formData.get("time") as string,
        description: formData.get("description") as string,
      });
      setEditingEvent(null);
    } else {
      createEvent({
        title: formData.get("title") as string,
        type: formData.get("type") as string,
        date: formData.get("date") as string,
        time: formData.get("time") as string,
        description: formData.get("description") as string,
      });
    }
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setDeletingEventId(eventId);
  };

  const confirmDelete = () => {
    if (deletingEventId !== null) {
      deleteEvent(deletingEventId);
      setDeletingEventId(null);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesTitle = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const eventTags = eventTagsMap?.get(event.id) || [];
    const matchesTags = eventTags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSearch = matchesTitle || matchesTags;
    const matchesType = typeFilter === "all" || typeFilter === "events";
    return matchesSearch && matchesType;
  });

  const filteredTasks = tasks.filter(task => {
    const matchesTitle = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const taskTags = taskTagsMap?.get(task.id) || [];
    const matchesTags = taskTags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSearch = matchesTitle || matchesTags;
    const matchesType = typeFilter === "all" || typeFilter === "tasks";
    return matchesSearch && matchesType;
  });

  const filteredHabits = habits.filter(habit => {
    const matchesName = habit.name.toLowerCase().includes(searchQuery.toLowerCase());
    const habitTags = habitTagsMap?.get(habit.id) || [];
    const matchesTags = habitTags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSearch = matchesName || matchesTags;
    const matchesType = typeFilter === "all" || typeFilter === "habits";
    return matchesSearch && matchesType;
  });

  const selectedDayEvents = filteredEvents.filter(event => event.date === selectedDay);

  // Календарные утилиты
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return filteredEvents.filter(event => event.date === dayStr);
  };

  const getTasksForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return filteredTasks.filter(task => task.due_date === dayStr);
  };

  const getHabitsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    // Получаем привычки, которые были выполнены в этот день
    const completedHabitIds = habitEntries
      .filter(entry => entry.date === dayStr && entry.completed)
      .map(entry => entry.habit_id);
    
    return filteredHabits.filter(habit => completedHabitIds.includes(habit.id));
  };

  const selectedDayTasks = filteredTasks.filter(task => task.due_date === selectedDay);
  const selectedDayHabits = getHabitsForDay(parseISO(selectedDay));

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Загрузка календаря...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Календарь</h1>
          <p className="text-muted-foreground mt-1">
            {format(currentDate, "LLLL yyyy", { locale: ru })}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingEvent(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Новое событие
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Редактировать событие" : "Новое событие"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={editingEvent?.title}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Тип</Label>
                <Select name="type" defaultValue={editingEvent?.type || "meeting"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Событие</SelectItem>
                    <SelectItem value="reminder">Напоминание</SelectItem>
                    <SelectItem value="note">Заметка</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Дата</Label>
                <Input 
                  id="date" 
                  name="date" 
                  type="date" 
                  defaultValue={editingEvent?.date || selectedDay}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Время</Label>
                <Input 
                  id="time" 
                  name="time" 
                  type="time" 
                  defaultValue={editingEvent?.time}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingEvent?.description || ""}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingEvent ? "Сохранить" : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск событий..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            onClick={() => setTypeFilter("all")}
          >
            Все
          </Button>
          <Button
            variant={typeFilter === "events" ? "default" : "outline"}
            onClick={() => setTypeFilter("events")}
          >
            События
          </Button>
          <Button
            variant={typeFilter === "tasks" ? "default" : "outline"}
            onClick={() => setTypeFilter("tasks")}
          >
            Задачи
          </Button>
          <Button
            variant={typeFilter === "habits" ? "default" : "outline"}
            onClick={() => setTypeFilter("habits")}
          >
            Привычки
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentDate, "LLLL yyyy", { locale: ru })}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const dayTasks = getTasksForDay(day);
                const dayHabits = getHabitsForDay(day);
                const dayStr = format(day, 'yyyy-MM-dd');
                const isSelected = dayStr === selectedDay;
                const isToday = isSameDay(day, new Date());
                const hasItems = dayEvents.length > 0 || dayTasks.length > 0 || dayHabits.length > 0;
                
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDay(dayStr)}
                    className={`
                      aspect-square p-2 rounded-lg border transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}
                      ${isToday && !isSelected ? 'border-primary' : 'border-border'}
                      ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="text-sm font-medium">{format(day, 'd')}</div>
                    {hasItems && (
                      <div className="flex gap-1 mt-1 justify-center flex-wrap">
                        {dayEvents.slice(0, 2).map((event, idx) => (
                          <div
                            key={`event-${idx}`}
                            className="w-1.5 h-1.5 rounded-full bg-blue-500"
                          />
                        ))}
                        {dayTasks.slice(0, 2).map((task, idx) => (
                          <div
                            key={`task-${idx}`}
                            className={`w-1.5 h-1.5 rounded-full ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                          />
                        ))}
                        {dayHabits.slice(0, 2).map((habit, idx) => (
                          <div
                            key={`habit-${idx}`}
                            className="w-1.5 h-1.5 rounded-full bg-purple-500"
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {format(parseISO(selectedDay), "d MMMM", { locale: ru })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* События */}
            {selectedDayEvents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">События</h3>
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {event.time && (
                            <span className="text-xs text-muted-foreground">{event.time}</span>
                          )}
                          <Badge variant={
                            event.type === 'meeting' ? 'default' :
                            event.type === 'task' ? 'secondary' :
                            event.type === 'habit' ? 'outline' :
                            'default'
                          }>
                            {event.type === 'meeting' ? 'Встреча' :
                             event.type === 'task' ? 'Задача' :
                             event.type === 'habit' ? 'Привычка' :
                             'Заметка'}
                          </Badge>
                        </div>
                        <p className="font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Задачи с дедлайном на этот день */}
            {selectedDayTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Задачи с дедлайном</h3>
                {selectedDayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={
                            task.priority === 'high' ? 'destructive' :
                            task.priority === 'medium' ? 'default' :
                            'secondary'
                          }>
                            {task.priority === 'high' ? 'Высокий' :
                             task.priority === 'medium' ? 'Средний' :
                             'Низкий'}
                          </Badge>
                          {task.completed && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">
                              Выполнено
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Привычки выполненные в этот день */}
            {selectedDayHabits.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Выполненные привычки</h3>
                {selectedDayHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                            Привычка
                          </Badge>
                        </div>
                        <p className="font-medium">{habit.name}</p>
                        {habit.description && (
                          <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 && selectedDayHabits.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет событий, задач и привычек на этот день
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEventId} onOpenChange={() => setDeletingEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить событие?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Событие будет удалено навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
