import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckSquare, TrendingUp, Clock, Plus, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useUserStats } from "@/hooks/useUserStats";
import { useHabits } from "@/hooks/useHabits";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAllTaskTags } from "@/hooks/useAllTaskTags";
import { TaskTagSelector } from "@/components/TaskTagSelector";
import VkConnect from "@/components/VkConnect"; // 👈 новый импорт
import { format, isToday, isFuture, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export default function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { tasks, createTask, toggleTask } = useTasks();
  const { data: stats } = useUserStats();
  const { habits, habitEntries } = useHabits();
  const { events } = useCalendarEvents();
  const { data: taskTagsMap } = useAllTaskTags();

  const todayTasks = tasks.filter(task =>
    task.due_date && isToday(parseISO(task.due_date))
  );

  const upcomingEvents = events
    .filter(event => isFuture(parseISO(event.date)))
    .slice(0, 3)
    .map(event => ({
      id: event.id,
      title: event.title,
      time: format(parseISO(event.date), "dd MMMM, HH:mm", { locale: ru }),
      type: event.type || 'meeting'
    }));

  const habitProgress = habits.map(habit => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return format(date, 'yyyy-MM-dd');
    });

    const completedDays = habitEntries.filter(
      entry => entry.habit_id === habit.id &&
        entry.completed &&
        last7Days.includes(entry.date)
    ).length;

    return {
      id: habit.id,
      name: habit.name,
      streak: completedDays,
      progress: Math.round((completedDays / 7) * 100)
    };
  });

  const avgHabitProgress = habitProgress.length > 0
    ? Math.round(habitProgress.reduce((acc, h) => acc + h.progress, 0) / habitProgress.length)
    : 0;

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTask({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as string,
      due_date: new Date().toISOString().split('T')[0],
      completed: false,
      completed_at: null,
      tagIds: selectedTagIds,
    });
    setIsDialogOpen(false);
    setSelectedTagIds([]);
    e.currentTarget.reset();
  };


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
            <div className="text-3xl font-bold">{stats?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.tasksCompleted || 0} выполнено
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Событий</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.calendarEvents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Всего событий</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Привычки</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgHabitProgress}%</div>
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
                      <Label htmlFor="priority">Приоритет</Label>
                      <select
                        name="priority"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        required
                      >
                        <option value="high">Высокий</option>
                        <option value="medium">Средний</option>
                        <option value="low">Низкий</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Описание</Label>
                      <Textarea id="description" name="description" />
                    </div>
                    <TaskTagSelector
                      selectedTagIds={selectedTagIds}
                      onTagsChange={setSelectedTagIds}
                    />
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
                    checked={task.completed || false}
                    onChange={() => toggleTask(task.id)}
                    className="h-5 w-5 rounded border-border cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(task.due_date), "dd MMM", { locale: ru })}
                      </p>
                    )}
                    {taskTagsMap?.get(task.id) && taskTagsMap.get(task.id)!.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {taskTagsMap.get(task.id)!.map(tag => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
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
              {habitProgress.slice(0, 3).map((habit) => (
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

      {/* 👇 БЛОК ПРИВЯЗКИ ВК */}
      <div className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <VkConnect />
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
              <Label>Приоритет</Label>
              <p className="text-sm mt-1">
                {selectedTask?.priority === "high" ? "Высокий" : selectedTask?.priority === "medium" ? "Средний" : "Низкий"}
              </p>
            </div>
            {selectedTask?.due_date && (
              <div>
                <Label>Дедлайн</Label>
                <p className="text-sm mt-1">{format(parseISO(selectedTask.due_date), "dd MMMM yyyy", { locale: ru })}</p>
              </div>
            )}
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