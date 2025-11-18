import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckSquare, TrendingUp, Clock, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useHabits } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useUserStats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import TodayTasksDialog from "@/components/TodayTasksDialog";
import WeekEventsDialog from "@/components/WeekEventsDialog";
import TimeStatsDialog from "@/components/TimeStatsDialog";
import { isToday, startOfWeek, endOfWeek } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isTodayTasksDialogOpen, setIsTodayTasksDialogOpen] = useState(false);
  const [isWeekEventsDialogOpen, setIsWeekEventsDialogOpen] = useState(false);
  const [isTimeStatsDialogOpen, setIsTimeStatsDialogOpen] = useState(false);

  const { tasks, isLoading: tasksLoading, createTask, toggleTask } = useTasks();
  const { events, isLoading: eventsLoading } = useCalendarEvents();
  const { habits, habitEntries, isLoading: habitsLoading } = useHabits();
  const { data: userStats } = useUserStats();

  // Фильтрация задач на сегодня
  const today = new Date();
  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    return isToday(taskDate);
  });

  // Фильтрация событий на эту неделю
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= weekStart && eventDate <= weekEnd;
  });

  // События на сегодня для статистики времени
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return isToday(eventDate);
  });

  const completedTodayTasks = todayTasks.filter(t => t.completed).length;

  // Расчет среднего прогресса привычек
  const habitProgress = habits.length > 0
    ? Math.round(
        habits.reduce((sum, habit) => {
          const entries = habitEntries?.filter(e => e.habit_id === habit.id && e.completed) || [];
          return sum + (entries.length > 0 ? 100 : 0);
        }, 0) / habits.length
      )
    : 0;

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createTask({
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      priority: formData.get("priority") as string || null,
      due_date: formData.get("due_date") as string || null,
      completed: false,
      completed_at: null,
    });
    
    setIsAddTaskDialogOpen(false);
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
        <Card 
          className="shadow-elegant hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setIsTodayTasksDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Задачи на сегодня</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedTodayTasks} выполнено
            </p>
          </CardContent>
        </Card>

        <Card 
          className="shadow-elegant hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setIsWeekEventsDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Событий</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{weekEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">На этой неделе</p>
          </CardContent>
        </Card>

        <Card 
          className="shadow-elegant hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/analytics')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Привычки</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{habitProgress}%</div>
            <p className="text-xs text-muted-foreground mt-1">Средний прогресс</p>
          </CardContent>
        </Card>

        <Card 
          className="shadow-elegant hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setIsTimeStatsDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Время сегодня</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round((completedTodayTasks * 0.5 + todayEvents.length * 1) * 10) / 10}ч
            </div>
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
              <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                <Button size="sm" className="bg-primary" onClick={() => setIsAddTaskDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить
                </Button>
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
                      <Select name="priority">
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
                      <Label htmlFor="due_date">Срок выполнения</Label>
                      <Input id="due_date" name="due_date" type="date" />
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
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {tasksLoading ? (
                  <p className="text-center text-muted-foreground py-8">Загрузка...</p>
                ) : todayTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Нет задач на сегодня</p>
                ) : (
                  todayTasks.slice(0, 5).map((task) => (
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
                              {new Date(task.due_date).toLocaleDateString('ru-RU')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.priority && (
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
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/tasks?taskId=${task.id}`)}
                        >
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Предстоящие события</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {eventsLoading ? (
                  <p className="text-center text-muted-foreground py-8">Загрузка...</p>
                ) : weekEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Нет событий на эту неделю</p>
                ) : (
                  weekEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/calendar?eventId=${event.id}`)}
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('ru-RU', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {event.time && `, ${event.time}`}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Habits Progress */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Прогресс привычек</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {habitsLoading ? (
              <p className="text-center text-muted-foreground py-8">Загрузка...</p>
            ) : habits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет привычек</p>
            ) : (
              habits.slice(0, 3).map((habit) => {
                const entries = habitEntries?.filter(e => e.habit_id === habit.id && e.completed) || [];
                const progress = entries.length > 0 ? 100 : 0;
                
                return (
                  <div key={habit.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{habit.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {entries.length} {entries.length === 1 ? 'день' : 'дней'}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <TodayTasksDialog
        open={isTodayTasksDialogOpen}
        onOpenChange={setIsTodayTasksDialogOpen}
        tasks={todayTasks}
        onToggleTask={toggleTask}
      />

      <WeekEventsDialog
        open={isWeekEventsDialogOpen}
        onOpenChange={setIsWeekEventsDialogOpen}
        events={weekEvents}
      />

      <TimeStatsDialog
        open={isTimeStatsDialogOpen}
        onOpenChange={setIsTimeStatsDialogOpen}
        tasksCompleted={completedTodayTasks}
        eventsToday={todayEvents.length}
      />
    </div>
  );
}
