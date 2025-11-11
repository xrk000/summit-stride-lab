import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckSquare, TrendingUp, Clock, Plus, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: number;
  title: string;
  priority: "high" | "medium" | "low";
  deadline: string;
  completed: boolean;
  project?: string;
  description?: string;
};

export default function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([
    { id: 1, title: "Подготовить презентацию", priority: "high", deadline: "14:00", completed: false, project: "Работа", description: "Презентация для клиента" },
    { id: 2, title: "Созвон с командой", priority: "medium", deadline: "16:30", completed: true, project: "Работа", description: "Обсуждение спринта" },
    { id: 3, title: "Обзор кода", priority: "low", deadline: "18:00", completed: false, project: "Проект А", description: "Проверить PR" },
  ]);

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: Math.max(0, ...todayTasks.map(t => t.id)) + 1,
      title: formData.get("title") as string,
      project: formData.get("project") as string,
      priority: formData.get("priority") as "high" | "medium" | "low",
      deadline: formData.get("deadline") as string,
      completed: false,
      description: formData.get("description") as string,
    };
    setTodayTasks([...todayTasks, newTask]);
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const toggleTaskStatus = (taskId: number) => {
    setTodayTasks(todayTasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const upcomingEvents = [
    { id: 1, title: "Встреча с клиентом", time: "Завтра, 10:00", type: "meeting" },
    { id: 2, title: "Дедлайн проекта", time: "Пятница, 17:00", type: "deadline" },
    { id: 3, title: "Тренировка", time: "Сегодня, 19:00", type: "habit" },
  ];

  const habits = [
    { id: 1, name: "Медитация", streak: 7, progress: 70 },
    { id: 2, name: "Чтение", streak: 14, progress: 100 },
    { id: 3, name: "Спорт", streak: 3, progress: 30 },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Добро пожаловать! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Сегодня {new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-elegant hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Задачи на сегодня</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayTasks.filter(t => t.completed).length} выполнено
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Событий</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">На этой неделе</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Привычки</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground mt-1">Средний прогресс</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Время сегодня</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4ч</div>
            <p className="text-xs text-muted-foreground mt-1">Продуктивное время</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Задачи на сегодня</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary">
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая задача</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddTask} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Название</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project">Проект</Label>
                      <Input id="project" name="project" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Приоритет</Label>
                      <Select name="priority" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите приоритет" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Высокий</SelectItem>
                          <SelectItem value="medium">Средний</SelectItem>
                          <SelectItem value="low">Низкий</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Время дедлайна</Label>
                      <Input id="deadline" name="deadline" type="time" required />
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
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors",
                  task.completed && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskStatus(task.id)}
                    className="h-5 w-5 rounded border-border cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {task.deadline}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      task.priority === "high"
                        ? "destructive"
                        : task.priority === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTask(task)}
                  >
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Предстоящие события</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  {event.type === "meeting" && <Calendar className="h-5 w-5 text-primary" />}
                  {event.type === "deadline" && <AlertCircle className="h-5 w-5 text-warning" />}
                  {event.type === "habit" && <TrendingUp className="h-5 w-5 text-success" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Habits Progress */}
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Прогресс привычек</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {habits.map((habit) => (
                <div key={habit.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{habit.name}</p>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      🔥 {habit.streak} дней
                    </Badge>
                  </div>
                  <Progress value={habit.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{habit.progress}% выполнено</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Проект</Label>
              <p className="text-sm mt-1">{selectedTask?.project}</p>
            </div>
            <div>
              <Label>Приоритет</Label>
              <p className="text-sm mt-1">
                {selectedTask?.priority === "high" ? "Высокий" : selectedTask?.priority === "medium" ? "Средний" : "Низкий"}
              </p>
            </div>
            <div>
              <Label>Дедлайн</Label>
              <p className="text-sm mt-1">{selectedTask?.deadline}</p>
            </div>
            <div>
              <Label>Описание</Label>
              <p className="text-sm mt-1">{selectedTask?.description || "Нет описания"}</p>
            </div>
            <div>
              <Label>Статус</Label>
              <p className="text-sm mt-1">{selectedTask?.completed ? "Выполнена" : "Активна"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
