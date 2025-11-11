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
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";

type Event = {
  id: number;
  time: string;
  title: string;
  type: string;
  color: string;
  description?: string;
};

export default function Calendar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([
    { id: 1, time: "09:00", title: "Утренняя планерка", type: "meeting", color: "primary" },
    { id: 2, time: "14:00", title: "Презентация проекта", type: "task", color: "warning" },
    { id: 3, time: "19:00", title: "Тренировка", type: "habit", color: "success" },
  ]);

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get("type") as string;
    
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
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const currentMonth = "Ноябрь 2024";

  // Mock calendar data
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = i - 3; // Start from previous month
    const eventsCount = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
    const intensity = eventsCount > 0 ? (eventsCount / 3) * 100 : 0;
    return { day: day > 0 && day <= 30 ? day : null, events: eventsCount, intensity };
  });

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{currentMonth}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
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
                  className={`
                    aspect-square rounded-lg p-2 relative transition-all
                    ${item.day ? "hover:bg-muted" : "cursor-default"}
                    ${item.day === 11 ? "bg-primary text-primary-foreground font-bold" : ""}
                  `}
                  style={{
                    backgroundColor:
                      item.day && item.day !== 11 && item.intensity > 0
                        ? `hsl(195, 90%, ${95 - item.intensity * 0.5}%)`
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
                      style={{ backgroundColor: `hsl(195, 90%, ${95 - intensity * 0.5}%)` }}
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
            <CardTitle className="text-xl">Сегодня</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-2"
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
              </div>
            ))}
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
