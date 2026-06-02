import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Calendar, FileText, Target, Upload, Loader2,
  Settings, BarChart2, User, Plug, TrendingUp, CheckCheck, Flame
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useUserStats } from "@/hooks/useUserStats";
import { useActivityData } from "@/hooks/useActivityData";
import { useHabits } from "@/hooks/useHabits";
import GoogleCalendarCard from "@/components/GoogleCalendarCard";
import VkConnect from "@/components/VkConnect";
import { useState, useRef, useEffect } from "react";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";

const Profile = () => {
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: weekActivity } = useActivityData(7);
  const { data: monthActivity } = useActivityData(30);
  const { habits, habitEntries } = useHabits();

  const [username, setUsername] = useState("");
  const [timezone, setTimezone] = useState("GMT+3");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setTimezone(profile.timezone || "GMT+3");
    }
  }, [profile]);

  const displayName = profile?.username
    || (profile as any)?.email?.split('@')[0]
    || "Пользователь";

  const completionRate = stats
    ? Math.round((stats.tasksCompleted / (stats.totalTasks || 1)) * 100) : 0;

  const today = new Date();
  const habitProgress = habits.map(habit => {
    const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(today, i), 'yyyy-MM-dd'));
    const done = habitEntries.filter(e => e.habit_id === habit.id && e.completed && last7.includes(e.date)).length;
    return { id: habit.id, name: habit.name, done, pct: Math.round((done / 7) * 100) };
  });
  const avgHabit = habitProgress.length > 0
    ? Math.round(habitProgress.reduce((a, h) => a + h.pct, 0) / habitProgress.length) : 0;

  const productivityScore = Math.min(Math.round(completionRate * 0.5 + avgHabit * 0.5), 100);

  const scoreColor = productivityScore >= 70 ? "#22c55e" : productivityScore >= 40 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 40;
  const strokeOffset = circumference * (1 - productivityScore / 100);

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-primary/70 to-slate-900 px-8 py-10 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 left-1/3 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-6">
          {/* Аватар */}
          <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="h-24 w-24 ring-4 ring-white/20">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-3xl bg-primary/30 text-white">
                {displayName[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadAvatar.isPending
                ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                : <Upload className="h-6 w-6 text-white" />}
            </div>
            <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-green-400 border-2 border-slate-900" />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { uploadAvatar.mutate(f); if (fileInputRef.current) fileInputRef.current.value = ""; }
              }} />
          </div>

          {/* Имя и бейджи */}
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Личный кабинет</p>
            <h1 className="text-3xl font-bold text-white truncate">{displayName}</h1>
            {(profile as any)?.email && (
              <p className="text-white/40 text-sm mt-0.5 truncate">{(profile as any).email}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-white/10 text-white border-white/20 text-xs">
                🌍 {timezone}
              </Badge>
              {profile?.created_at && (
                <Badge className="bg-white/10 text-white border-white/20 text-xs">
                  📅 С {format(new Date(profile.created_at), "MMMM yyyy", { locale: ru })}
                </Badge>
              )}
            </div>
          </div>

          {/* Кольцо продуктивности */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="-rotate-90 w-24 h-24">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={scoreColor} strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{productivityScore}</span>
                <span className="text-white/50 text-xs">балл</span>
              </div>
            </div>
            <p className="text-white/40 text-xs">Продуктивность</p>
          </div>
        </div>
      </div>

      {/* ── КОНТЕНТ ── */}
      <div className="p-6 space-y-6">

        {/* Стат-карточки */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Задач выполнено", value: stats.tasksCompleted, sub: `из ${stats.totalTasks}`, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10", progress: completionRate },
              { label: "Заметок создано", value: stats.notesCreated, sub: "всего", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Событий", value: stats.calendarEvents, sub: "запланировано", icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Привычек", value: stats.habitsTracked, sub: "отслеживается", icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <span className="text-2xl font-bold">{s.value}</span>
                  </div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                  {s.progress !== undefined && (
                    <Progress value={s.progress} className="h-1.5 mt-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="inline-flex h-auto p-1 gap-0.5">
            <TabsTrigger value="overview" className="gap-1.5 px-4 py-2">
              <TrendingUp className="h-4 w-4" />Обзор
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 px-4 py-2">
              <BarChart2 className="h-4 w-4" />Активность
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1.5 px-4 py-2">
              <Plug className="h-4 w-4" />Интеграции
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 px-4 py-2">
              <Settings className="h-4 w-4" />Настройки
            </TabsTrigger>
          </TabsList>

          {/* ── Обзор ── */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCheck className="h-5 w-5 text-blue-500" />
                    Выполнение задач
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold">{completionRate}%</span>
                    <span className="text-muted-foreground text-sm mb-1.5">
                      {stats?.tasksCompleted || 0} из {stats?.totalTasks || 0} задач
                    </span>
                  </div>
                  <Progress value={completionRate} className="h-2.5 rounded-full" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-green-500/10 text-center">
                      <p className="text-2xl font-bold text-green-500">{stats?.tasksCompleted || 0}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Выполнено</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-2xl font-bold">{(stats?.totalTasks || 0) - (stats?.tasksCompleted || 0)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Осталось</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Привычки — 7 дней
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {habitProgress.length === 0 ? (
                    <div className="flex flex-col items-center py-6 gap-2 text-muted-foreground">
                      <span className="text-2xl">💪</span>
                      <p className="text-sm">Нет активных привычек</p>
                    </div>
                  ) : habitProgress.slice(0, 4).map(h => (
                    <div key={h.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate flex-1 mr-2">{h.name}</span>
                        <span className="text-muted-foreground flex-shrink-0 flex items-center gap-1 text-xs">
                          <Flame className="h-3 w-3 text-orange-400" />{h.done}/7
                        </span>
                      </div>
                      <Progress value={h.pct} className="h-1.5" />
                    </div>
                  ))}
                  <div className="pt-2 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Средний прогресс</span>
                    <Badge variant="outline" className="font-semibold">{avgHabit}%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {weekActivity && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Активность за неделю
                  </CardTitle>
                  <CardDescription>Задачи, заметки и привычки за 7 дней</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={weekActivity}>
                      <defs>
                        <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                      <Area type="monotone" dataKey="tasks" stroke="hsl(var(--primary))" fill="url(#gT)" name="Задачи" strokeWidth={2} />
                      <Area type="monotone" dataKey="habits" stroke="#f97316" fill="url(#gH)" name="Привычки" strokeWidth={2} />
                      <Line type="monotone" dataKey="notes" stroke="#f59e0b" name="Заметки" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Активность ── */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Активность за неделю
                </CardTitle>
                <CardDescription>Последние 7 дней</CardDescription>
              </CardHeader>
              <CardContent>
                {weekActivity && (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={weekActivity}>
                      <defs>
                        <linearGradient id="aTasks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="aNotes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="aHabits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px' }} />
                      <Legend />
                      <Area type="monotone" dataKey="tasks" stroke="hsl(var(--primary))" fill="url(#aTasks)" name="Задачи" strokeWidth={2} />
                      <Area type="monotone" dataKey="notes" stroke="#f59e0b" fill="url(#aNotes)" name="Заметки" strokeWidth={2} />
                      <Area type="monotone" dataKey="habits" stroke="#f97316" fill="url(#aHabits)" name="Привычки" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Активность за месяц
                </CardTitle>
                <CardDescription>Последние 30 дней</CardDescription>
              </CardHeader>
              <CardContent>
                {monthActivity && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="tasks" stroke="hsl(var(--primary))" name="Задачи" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="notes" stroke="#f59e0b" name="Заметки" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="habits" stroke="#f97316" name="Привычки" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Интеграции ── */}
          <TabsContent value="integrations" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Подключённые сервисы</h3>
              <p className="text-sm text-muted-foreground mb-4">Управляйте интеграциями с внешними сервисами</p>
            </div>
            <GoogleCalendarCard />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ВКонтакте</CardTitle>
                <CardDescription>Импорт избранных сообщений как задач и заметок</CardDescription>
              </CardHeader>
              <CardContent>
                <VkConnect />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Настройки ── */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-5 w-5 text-primary" />
                    Личные данные
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <Avatar className="h-14 w-14 flex-shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {displayName[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{(profile as any)?.email || ""}</p>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-3 w-3 mr-1" />Сменить фото
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="username" className="text-sm">Имя пользователя</Label>
                      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ваше имя" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="timezone" className="text-sm">Часовой пояс</Label>
                      <select
                        id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md mt-1 text-sm"
                      >
                        <option value="GMT+3">GMT+3 (Москва)</option>
                        <option value="GMT+0">GMT+0 (UTC)</option>
                        <option value="GMT-5">GMT-5 (Нью-Йорк)</option>
                        <option value="GMT+1">GMT+1 (Берлин)</option>
                        <option value="GMT+5">GMT+5 (Екатеринбург)</option>
                        <option value="GMT+7">GMT+7 (Красноярск)</option>
                        <option value="GMT+8">GMT+8 (Иркутск)</option>
                      </select>
                    </div>
                    <Button
                      onClick={() => updateProfile.mutate({ username, timezone })}
                      className="w-full"
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Сохранить изменения
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Статистика
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Задач выполнено", value: stats?.tasksCompleted || 0, total: stats?.totalTasks, color: "bg-blue-500", pct: completionRate },
                    { label: "Заметок создано", value: stats?.notesCreated || 0, color: "bg-amber-500" },
                    { label: "Событий в календаре", value: stats?.calendarEvents || 0, color: "bg-emerald-500" },
                    { label: "Привычек активно", value: stats?.habitsTracked || 0, color: "bg-purple-500" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-1.5 h-10 rounded-full ${s.color} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-muted-foreground truncate">{s.label}</span>
                          <span className="font-semibold flex-shrink-0 ml-2">
                            {s.value}{s.total !== undefined ? `/${s.total}` : ""}
                          </span>
                        </div>
                        {s.pct !== undefined && <Progress value={s.pct} className="h-1.5" />}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
