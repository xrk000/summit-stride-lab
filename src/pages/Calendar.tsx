import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function Calendar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [events, setEvents] = useState([
    { id: 1, time: "09:00", title: "Утренняя планерка", type: "meeting", color: "primary" },
    { id: 2, time: "14:00", title: "Презентация проекта", type: "task", color: "warning" },
    { id: 3, time: "19:00", title: "Тренировка", type: "habit", color: "success" },
  ]);

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEvent = {
      id: events.length + 1,
      time: formData.get("time") as string,
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      color: formData.get("type") === "meeting" ? "primary" : formData.get("type") === "task" ? "warning" : "success",
    };
    setEvents([...events, newEvent]);
    setIsDialogOpen(false);
    e.currentTarget.reset();
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Новое событие
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новое событие</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Время</Label>
                <Input id="time" name="time" type="time" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Тип</Label>
                <Select name="type" required>
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
                <Textarea id="description" name="description" />
              </div>
              <Button type="submit" className="w-full">Добавить</Button>
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
                </div>
                <p className="font-medium">{event.title}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
