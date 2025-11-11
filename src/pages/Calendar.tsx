import { useState, DragEvent } from "react";
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

type RecurrenceType = "none" | "daily" | "weekly" | "monthly";

type Event = {
  id: number;
  time: string;
  title: string;
  type: string;
  color: string;
  description?: string;
  date: string; // Формат: YYYY-MM-DD
  recurrence?: RecurrenceType;
  recurrenceEndDate?: string;
  linkedTaskId?: number;
  linkedHabitId?: number;
};

export default function Calendar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // Ноябрь 2025
  const [selectedDay, setSelectedDay] = useState<string>("2025-11-11"); // Текущий выбранный день в формате YYYY-MM-DD
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all"); // all, meeting, task, habit, note

  // Моковые данные для связи
  const availableTasks = [
    { id: 1, title: "Написать отчет" },
    { id: 2, title: "Обновить документацию" },
    { id: 3, title: "Код ревью" },
  ];

  const availableHabits = [
    { id: 1, name: "Медитация" },
    { id: 2, name: "Чтение" },
    { id: 3, name: "Тренировка" },
  ];

  const [events, setEvents] = useState<Event[]>([
    // 5 ноября - 1 событие
    { id: 1, time: "10:00", title: "Встреча с клиентом", type: "meeting", color: "primary", date: "2025-11-05", recurrence: "none" },
    
    // 11 ноября - 3 события
    { id: 2, time: "09:00", title: "Утренняя планерка", type: "meeting", color: "primary", date: "2025-11-11", recurrence: "weekly", recurrenceEndDate: "2025-12-31" },
    { id: 3, time: "14:00", title: "Презентация проекта", type: "task", color: "warning", date: "2025-11-11", linkedTaskId: 2 },
    { id: 4, time: "19:00", title: "Тренировка", type: "habit", color: "success", date: "2025-11-11", recurrence: "daily", linkedHabitId: 3 },
    
    // 15 ноября - 5 событий
    { id: 5, time: "08:00", title: "Пробежка", type: "habit", color: "success", date: "2025-11-15", recurrence: "daily" },
    { id: 6, time: "10:00", title: "Звонок с командой", type: "meeting", color: "primary", date: "2025-11-15" },
    { id: 7, time: "12:30", title: "Обед с партнерами", type: "meeting", color: "primary", date: "2025-11-15" },
    { id: 8, time: "15:00", title: "Работа над задачами", type: "task", color: "warning", date: "2025-11-15", linkedTaskId: 1 },
    { id: 9, time: "18:00", title: "Английский", type: "habit", color: "success", date: "2025-11-15", linkedHabitId: 2 },
    
    // 20 ноября - 2 события
    { id: 10, time: "11:00", title: "Консультация", type: "meeting", color: "primary", date: "2025-11-20" },
    { id: 11, time: "16:00", title: "Код-ревью", type: "task", color: "warning", date: "2025-11-20", linkedTaskId: 3 },
    
    // 25 ноября - 4 события
    { id: 12, time: "09:00", title: "Планирование спринта", type: "meeting", color: "primary", date: "2025-11-25" },
    { id: 13, time: "11:30", title: "Разработка фичи", type: "task", color: "warning", date: "2025-11-25" },
    { id: 14, time: "15:00", title: "Тестирование", type: "task", color: "warning", date: "2025-11-25" },
    { id: 15, time: "20:00", title: "Чтение", type: "habit", color: "success", date: "2025-11-25", recurrence: "daily", linkedHabitId: 2 },
  ]);

  // Генерация повторяющихся событий
  const generateRecurringEvents = (event: Event): Event[] => {
    if (!event.recurrence || event.recurrence === "none") return [event];
    
    const recurringEvents: Event[] = [event];
    const startDate = new Date(event.date);
    const endDate = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate());
    
    let currentDate = new Date(startDate);
    let idCounter = 1;
    
    while (currentDate <= endDate) {
      if (event.recurrence === "daily") {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (event.recurrence === "weekly") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (event.recurrence === "monthly") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      if (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        recurringEvents.push({
          ...event,
          id: event.id * 10000 + idCounter++,
          date: dateStr,
        });
      }
    }
    
    return recurringEvents;
  };

  // Расширенный список событий с повторяющимися
  const allEvents = events.flatMap(event => generateRecurringEvents(event));

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get("type") as string;
    const recurrence = formData.get("recurrence") as RecurrenceType;
    const linkedTaskId = formData.get("linkedTaskId") as string;
    const linkedHabitId = formData.get("linkedHabitId") as string;
    
    if (editingEvent) {
      setEvents(events.map(event => 
        event.id === editingEvent.id 
          ? {
              ...event,
              time: formData.get("time") as string,
              title: formData.get("title") as string,
              type,
              color: type === "meeting" ? "primary" : type === "task" ? "warning" : "success",
              description: formData.get("description") as string,
              recurrence,
              recurrenceEndDate: recurrence !== "none" ? formData.get("recurrenceEndDate") as string : undefined,
              linkedTaskId: linkedTaskId && linkedTaskId !== "none" ? parseInt(linkedTaskId) : undefined,
              linkedHabitId: linkedHabitId && linkedHabitId !== "none" ? parseInt(linkedHabitId) : undefined,
            }
          : event
      ));
      setEditingEvent(null);
    } else {
      const newEvent: Event = {
        id: Math.max(0, ...events.map(e => e.id)) + 1,
        time: formData.get("time") as string,
        title: formData.get("title") as string,
        type,
        color: type === "meeting" ? "primary" : type === "task" ? "warning" : "success",
        description: formData.get("description") as string,
        date: selectedDay,
        recurrence,
        recurrenceEndDate: recurrence !== "none" ? formData.get("recurrenceEndDate") as string : undefined,
        linkedTaskId: linkedTaskId && linkedTaskId !== "none" ? parseInt(linkedTaskId) : undefined,
        linkedHabitId: linkedHabitId && linkedHabitId !== "none" ? parseInt(linkedHabitId) : undefined,
      };
      setEvents([...events, newEvent]);
    }
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter(event => event.id !== eventId));
    setDeletingEventId(null);
  };

  // Drag & Drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, event: Event) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>, targetDate: string) => {
    e.preventDefault();
    if (draggedEvent && draggedEvent.date !== targetDate) {
      setEvents(events.map(event => 
        event.id === draggedEvent.id 
          ? { ...event, date: targetDate }
          : event
      ));
    }
    setDraggedEvent(null);
  };

  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDate = event.date === selectedDay;
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    
    return matchesSearch && matchesDate && matchesType;
  });

  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  
  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
                      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const currentMonth = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Функция для получения количества событий на день с учетом фильтра
  const getEventsCountForDate = (dateStr: string) => {
    return allEvents.filter(event => {
      const matchesDate = event.date === dateStr;
      const matchesType = typeFilter === "all" || event.type === typeFilter;
      return matchesDate && matchesType;
    }).length;
  };

  // Генерация дней календаря
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Получаем день недели первого дня (0 = Воскресенье, нужно преобразовать)
  let firstDayOfWeek = firstDay.getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Преобразуем в формат Пн=0, Вс=6

  const calendarDays = [];
  
  // Добавляем пустые ячейки для начала месяца
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push({ day: null, events: 0, intensity: 0, date: "" });
  }
  
  // Добавляем дни месяца
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const eventsCount = getEventsCountForDate(dateStr);
    const intensity = eventsCount > 0 ? Math.min((eventsCount / 5) * 100, 100) : 0;
    calendarDays.push({ day, events: eventsCount, intensity, date: dateStr });
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Календарь</h1>
          <p className="text-muted-foreground mt-1">Планируйте своё время эффективно</p>
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
                <Input id="title" name="title" defaultValue={editingEvent?.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Время</Label>
                <Input id="time" name="time" type="time" defaultValue={editingEvent?.time} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Тип</Label>
                <Select name="type" defaultValue={editingEvent?.type} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Встреча</SelectItem>
                    <SelectItem value="task">Задача</SelectItem>
                    <SelectItem value="habit">Привычка</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurrence">Повторение</Label>
                <Select name="recurrence" defaultValue={editingEvent?.recurrence || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите повторение" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не повторяется</SelectItem>
                    <SelectItem value="daily">Ежедневно</SelectItem>
                    <SelectItem value="weekly">Еженедельно</SelectItem>
                    <SelectItem value="monthly">Ежемесячно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurrenceEndDate">Окончание повторения</Label>
                <Input 
                  id="recurrenceEndDate" 
                  name="recurrenceEndDate" 
                  type="date" 
                  defaultValue={editingEvent?.recurrenceEndDate}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedTaskId">Связанная задача</Label>
                <Select name="linkedTaskId" defaultValue={editingEvent?.linkedTaskId?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Не связано" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не связано</SelectItem>
                    {availableTasks.map(task => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedHabitId">Связанная привычка</Label>
                <Select name="linkedHabitId" defaultValue={editingEvent?.linkedHabitId?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Не связано" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не связано</SelectItem>
                    {availableHabits.map(habit => (
                      <SelectItem key={habit.id} value={habit.id.toString()}>
                        {habit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" defaultValue={editingEvent?.description} />
              </div>
              <Button type="submit" className="w-full">
                {editingEvent ? "Сохранить" : "Добавить"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск событий..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Фильтр по типу" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все события</SelectItem>
            <SelectItem value="meeting">Встречи</SelectItem>
            <SelectItem value="task">Задачи</SelectItem>
            <SelectItem value="habit">Привычки</SelectItem>
            <SelectItem value="note">Заметки</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{currentMonth}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {days.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((item, i) => (
                <button
                  key={i}
                  onClick={() => item.day && setSelectedDay(item.date)}
                  onDragOver={(e) => item.day && handleDragOver(e)}
                  onDrop={(e) => item.day && handleDrop(e, item.date)}
                  disabled={!item.day}
                  className={`
                    aspect-square rounded-lg p-2 relative transition-all
                    ${item.day ? "hover:bg-muted cursor-pointer" : "cursor-default invisible"}
                    ${item.date === selectedDay ? "bg-primary text-primary-foreground font-bold ring-2 ring-primary ring-offset-2" : ""}
                    ${draggedEvent && item.day ? "hover:ring-2 hover:ring-primary/50" : ""}
                  `}
                  style={{
                    backgroundColor:
                      item.day && item.date !== selectedDay && item.intensity > 0
                        ? `hsl(262, 83%, ${95 - item.intensity * 0.5}%)`
                        : undefined,
                  }}
                >
                  {item.day && (
                    <>
                      <span className="text-sm">{item.day}</span>
                      {item.events > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {Array.from({ length: Math.min(item.events, 3) }).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Тепловая карта загруженности</span>
              <div className="flex items-center gap-2">
                <span>Меньше</span>
                <div className="flex gap-1">
                  {[0, 25, 50, 75, 100].map((intensity) => (
                    <div
                      key={intensity}
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: `hsl(262, 83%, ${95 - intensity * 0.5}%)` }}
                    />
                  ))}
                </div>
                <span>Больше</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-display">
              {new Date(selectedDay).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Нет событий на этот день</p>
            ) : (
              filteredEvents.map((event) => (
              <div
                key={event.id}
                draggable
                onDragStart={(e) => handleDragStart(e, event)}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-2 cursor-move"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{event.time}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`
                        ${event.color === "primary" ? "bg-primary/10 text-primary border-primary/20" : ""}
                        ${event.color === "warning" ? "bg-warning/10 text-warning border-warning/20" : ""}
                        ${event.color === "success" ? "bg-success/10 text-success border-success/20" : ""}
                      `}
                    >
                      {event.type === "meeting" ? "Встреча" : event.type === "task" ? "Задача" : "Привычка"}
                    </Badge>
                    {event.recurrence && event.recurrence !== "none" && (
                      <Badge variant="outline" className="bg-accent/10 text-accent-foreground">
                        {event.recurrence === "daily" ? "Ежедневно" : event.recurrence === "weekly" ? "Еженедельно" : "Ежемесячно"}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEditEvent(event)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeletingEventId(event.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="font-medium">{event.title}</p>
                {event.linkedTaskId && (
                  <p className="text-xs text-muted-foreground">
                    🔗 Задача: {availableTasks.find(t => t.id === event.linkedTaskId)?.title}
                  </p>
                )}
                {event.linkedHabitId && (
                  <p className="text-xs text-muted-foreground">
                    🔗 Привычка: {availableHabits.find(h => h.id === event.linkedHabitId)?.name}
                  </p>
                )}
              </div>
              ))
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
              Вы уверены, что хотите удалить это событие? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingEventId && handleDeleteEvent(deletingEventId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
