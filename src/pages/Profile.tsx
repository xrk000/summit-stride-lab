import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Calendar, FileText, Target, Trophy, Star, FolderOpen, Upload, Download } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useUserStats } from "@/hooks/useUserStats";
import { useAchievements } from "@/hooks/useAchievements";
import { useActivityData } from "@/hooks/useActivityData";
import { useCheckAchievements } from "@/hooks/useCheckAchievements";
import { useDataExport } from "@/hooks/useDataExport";
import { useState, useRef, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconMap: Record<string, any> = {
  CheckCircle2,
  Target,
  Trophy,
  Calendar,
  Star,
  FileText,
  FolderOpen,
};

const Profile = () => {
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: achievements } = useAchievements();
  const { data: weekActivity } = useActivityData(7);
  const { data: monthActivity } = useActivityData(30);
  const checkAchievements = useCheckAchievements();
  const { exportToCSV, exportToPDF } = useDataExport();
  
  const [username, setUsername] = useState("");
  const [timezone, setTimezone] = useState("GMT+3");
  const [exportType, setExportType] = useState<"all" | "tasks" | "notes" | "habits" | "projects" | "calendar">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setTimezone(profile.timezone || "GMT+3");
    }
  }, [profile]);

  useEffect(() => {
    // Check achievements when component mounts
    checkAchievements.mutate();
  }, []);

  const handleSaveProfile = () => {
    updateProfile({ username, timezone });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const completionRate = stats ? Math.round((stats.tasksCompleted / (stats.totalTasks || 1)) * 100) : 0;
  const earnedAchievements = achievements?.filter(a => a.earned) || [];
  const lockedAchievements = achievements?.filter(a => !a.earned) || [];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={profile?.avatar_url || ""} alt="User" />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {profile?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleAvatarClick}>
            <Upload className="h-6 w-6 text-white" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">Личный кабинет</h1>
          <p className="text-muted-foreground">Ваша статистика и достижения</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="h-fit">
            {earnedAchievements.length} достижений
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => checkAchievements.mutate()}
            disabled={checkAchievements.isPending}
          >
            {checkAchievements.isPending ? "Проверка..." : "Проверить достижения"}
          </Button>
        </div>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Экспорт данных
          </CardTitle>
          <CardDescription>
            Экспортируйте свои данные и статистику в различных форматах
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="export-type">Тип данных</Label>
                <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                  <SelectTrigger id="export-type">
                    <SelectValue placeholder="Выберите тип данных" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все данные</SelectItem>
                    <SelectItem value="tasks">Только задачи</SelectItem>
                    <SelectItem value="notes">Только заметки</SelectItem>
                    <SelectItem value="habits">Только привычки</SelectItem>
                    <SelectItem value="projects">Только проекты</SelectItem>
                    <SelectItem value="calendar">Только календарь</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => exportToCSV(exportType)}
                variant="default"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Экспорт в CSV
              </Button>
              <Button
                onClick={() => exportToPDF(true)}
                variant="secondary"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Экспорт в PDF (со статистикой)
              </Button>
              <Button
                onClick={() => exportToPDF(false)}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Экспорт в PDF (без статистики)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Задачи</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasksCompleted}/{stats.totalTasks}</div>
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
              <div className="text-2xl font-bold">{stats.notesCreated}</div>
              <p className="text-xs text-muted-foreground mt-1">Создано заметок</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">События</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.calendarEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">Запланировано событий</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Привычки</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.habitsTracked}</div>
              <p className="text-xs text-muted-foreground mt-1">Отслеживается привычек</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Прогресс продуктивности</CardTitle>
              <CardDescription>Ваши показатели</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Выполнение задач</span>
                  <span className="text-sm text-muted-foreground">{completionRate}%</span>
                </div>
                <Progress value={completionRate} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ваши достижения</CardTitle>
              <CardDescription>Заработано: {earnedAchievements.length} из {achievements?.length || 0}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {earnedAchievements.map((achievement) => {
                  const Icon = iconMap[achievement.icon];
                  return (
                    <div key={achievement.id} className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                      {Icon && <Icon className="h-8 w-8 text-primary mb-2" />}
                      <span className="text-sm font-medium text-center">{achievement.name}</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">{achievement.description}</span>
                    </div>
                  );
                })}
                {lockedAchievements.map((achievement) => {
                  const Icon = iconMap[achievement.icon];
                  return (
                    <div key={achievement.id} className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border border-border opacity-50">
                      {Icon && <Icon className="h-8 w-8 text-muted-foreground mb-2" />}
                      <span className="text-sm text-center text-muted-foreground">{achievement.name}</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">{achievement.description}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Активность за неделю</CardTitle>
              <CardDescription>Последние 7 дней</CardDescription>
            </CardHeader>
            <CardContent>
              {weekActivity && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weekActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tasks" stroke="hsl(var(--primary))" name="Задачи" />
                    <Line type="monotone" dataKey="notes" stroke="hsl(var(--accent))" name="Заметки" />
                    <Line type="monotone" dataKey="habits" stroke="hsl(var(--secondary))" name="Привычки" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активность за месяц</CardTitle>
              <CardDescription>Последние 30 дней</CardDescription>
            </CardHeader>
            <CardContent>
              {monthActivity && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tasks" stroke="hsl(var(--primary))" name="Задачи" />
                    <Line type="monotone" dataKey="notes" stroke="hsl(var(--accent))" name="Заметки" />
                    <Line type="monotone" dataKey="habits" stroke="hsl(var(--secondary))" name="Привычки" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки профиля</CardTitle>
              <CardDescription>Управление личными данными</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Имя пользователя</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ваше имя"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Часовой пояс</Label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  >
                    <option value="GMT+3">GMT+3 (Москва)</option>
                    <option value="GMT+0">GMT+0 (UTC)</option>
                    <option value="GMT-5">GMT-5 (Нью-Йорк)</option>
                    <option value="GMT+1">GMT+1 (Берлин)</option>
                  </select>
                </div>
                <Button onClick={handleSaveProfile}>Сохранить изменения</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
