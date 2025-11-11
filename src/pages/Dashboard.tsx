import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckSquare, TrendingUp, Clock, Plus, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const todayTasks = [
    { id: 1, title: "Подготовить презентацию", priority: "high", deadline: "14:00", completed: false },
    { id: 2, title: "Созвон с командой", priority: "medium", deadline: "16:30", completed: true },
    { id: 3, title: "Обзор кода", priority: "low", deadline: "18:00", completed: false },
  ];

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
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">2 выполнено</p>
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
              <Button size="sm" className="bg-primary">
                <Plus className="h-4 w-4 mr-1" />
                Добавить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    className="h-5 w-5 rounded border-border"
                    readOnly
                  />
                  <div>
                    <p className={task.completed ? "line-through text-muted-foreground" : ""}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {task.deadline}
                    </p>
                  </div>
                </div>
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
    </div>
  );
}
