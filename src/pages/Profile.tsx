import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Calendar, FileText, Target, TrendingUp } from "lucide-react";

const Profile = () => {
  // Временные данные - потом будем подключать к базе
  const userStats = {
    tasksCompleted: 45,
    totalTasks: 60,
    notesCreated: 28,
    habitsTracked: 12,
    projectsActive: 3,
    calendarEvents: 24,
  };

  const completionRate = Math.round((userStats.tasksCompleted / userStats.totalTasks) * 100);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Заголовок профиля */}
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src="" alt="User" />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">UN</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">Личный кабинет</h1>
          <p className="text-muted-foreground">Ваша статистика и достижения</p>
        </div>
        <Badge variant="secondary" className="h-fit">
          Активный пользователь
        </Badge>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Задачи</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.tasksCompleted}/{userStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Выполнено задач</p>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заметки</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.notesCreated}</div>
            <p className="text-xs text-muted-foreground mt-1">Создано заметок</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">События</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.calendarEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Запланировано событий</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Привычки</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.habitsTracked}</div>
            <p className="text-xs text-muted-foreground mt-1">Отслеживается привычек</p>
          </CardContent>
        </Card>
      </div>

      {/* Детальная информация */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Прогресс продуктивности</CardTitle>
              <CardDescription>Ваши показатели за последнее время</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Выполнение задач</span>
                  <span className="text-sm text-muted-foreground">{completionRate}%</span>
                </div>
                <Progress value={completionRate} />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Активность привычек</span>
                  <span className="text-sm text-muted-foreground">85%</span>
                </div>
                <Progress value={85} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Планирование</span>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <Progress value={92} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активные проекты</CardTitle>
              <CardDescription>Проекты в работе: {userStats.projectsActive}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Дипломная работа</span>
                  <Badge variant="outline">В процессе</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Изучение React</span>
                  <Badge variant="outline">В процессе</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Фитнес план</span>
                  <Badge variant="outline">В процессе</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ваши достижения</CardTitle>
              <CardDescription>Заработанные награды за продуктивность</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm font-medium text-center">Первые 10 задач</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <Target className="h-8 w-8 text-primary mb-2" />
                  <span className="text-sm font-medium text-center">Неделя привычек</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border border-border opacity-50">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-center text-muted-foreground">50 задач</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки профиля</CardTitle>
              <CardDescription>Управление личными данными и предпочтениями</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Имя пользователя</label>
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Часовой пояс</label>
                  <select className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md">
                    <option>GMT+3 (Москва)</option>
                    <option>GMT+0 (UTC)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
