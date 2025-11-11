import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, CheckSquare, TrendingUp, Clock, Target, Award } from "lucide-react";

// Моковые данные для диаграмм
const projectTimeData = [
  { name: "Дипломная работа", hours: 24.5, tasks: 12 },
  { name: "Проект А", hours: 42.25, tasks: 18 },
  { name: "Личный сайт", hours: 5.75, tasks: 8 },
];

const taskCompletionData = [
  { week: "Нед 1", completed: 12, active: 8 },
  { week: "Нед 2", completed: 15, active: 10 },
  { week: "Нед 3", completed: 18, active: 7 },
  { week: "Нед 4", completed: 22, active: 12 },
];

const habitProgressData = [
  { day: "Пн", meditation: 1, reading: 1, workout: 0, language: 1 },
  { day: "Вт", meditation: 1, reading: 1, workout: 1, language: 1 },
  { day: "Ср", meditation: 1, reading: 1, workout: 1, language: 1 },
  { day: "Чт", meditation: 1, reading: 1, workout: 1, language: 1 },
  { day: "Пт", meditation: 1, reading: 1, workout: 0, language: 1 },
  { day: "Сб", meditation: 1, reading: 1, workout: 0, language: 1 },
  { day: "Вс", meditation: 1, reading: 1, workout: 0, language: 0 },
];

const productivityData = [
  { name: "Выполнено", value: 73, color: "hsl(var(--success))" },
  { name: "В процессе", value: 27, color: "hsl(var(--primary))" },
];

const dailyActivityData = [
  { hour: "9:00", tasks: 2, events: 1 },
  { hour: "10:00", tasks: 3, events: 0 },
  { hour: "11:00", tasks: 1, events: 1 },
  { hour: "12:00", tasks: 0, events: 0 },
  { hour: "13:00", tasks: 1, events: 0 },
  { hour: "14:00", tasks: 4, events: 2 },
  { hour: "15:00", tasks: 2, events: 1 },
  { hour: "16:00", tasks: 3, events: 0 },
  { hour: "17:00", tasks: 1, events: 1 },
  { hour: "18:00", tasks: 0, events: 0 },
];

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  accent: "hsl(var(--accent))",
  destructive: "hsl(var(--destructive))",
};

export default function Analytics() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Статистика и Аналитика</h1>
        <p className="text-muted-foreground mt-1">Анализ вашей продуктивности и прогресса</p>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего времени</p>
                <p className="text-2xl font-bold">72.5ч</p>
                <p className="text-xs text-success mt-1">↑ 12% за неделю</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Задачи выполнены</p>
                <p className="text-2xl font-bold">67/92</p>
                <p className="text-xs text-success mt-1">73% успешность</p>
              </div>
              <CheckSquare className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Средняя серия</p>
                <p className="text-2xl font-bold">11 дней</p>
                <p className="text-xs text-warning mt-1">Привычки</p>
              </div>
              <TrendingUp className="h-8 w-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Активных проектов</p>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-accent mt-1">из 3 всего</p>
              </div>
              <Target className="h-8 w-8 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Табы с разными видами статистики */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Проекты</TabsTrigger>
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
          <TabsTrigger value="habits">Привычки</TabsTrigger>
        </TabsList>

        {/* Статистика проектов */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-display">Время по проектам</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="hours" fill={COLORS.primary} name="Часы" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-display">Распределение задач</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectTimeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="tasks"
                    >
                      {projectTimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Статистика задач */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-display">Выполнение задач по неделям</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={taskCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke={COLORS.success} strokeWidth={2} name="Выполнено" />
                    <Line type="monotone" dataKey="active" stroke={COLORS.primary} strokeWidth={2} name="Активные" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-display">Продуктивность</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productivityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-display">Активность по часам</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="tasks" fill={COLORS.primary} name="Задачи" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="events" fill={COLORS.accent} name="События" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Статистика привычек */}
        <TabsContent value="habits" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-display">Прогресс привычек за неделю</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={habitProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="meditation" stackId="a" fill={COLORS.primary} name="Медитация" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="reading" stackId="a" fill={COLORS.success} name="Чтение" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="workout" stackId="a" fill={COLORS.warning} name="Тренировка" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="language" stackId="a" fill={COLORS.accent} name="Язык" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">🧘</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Медитация</p>
                      <p className="text-xl font-bold">7 дней</p>
                      <p className="text-xs text-success">🔥 Серия</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Чтение</p>
                      <p className="text-xl font-bold">14 дней</p>
                      <p className="text-xs text-success">🔥 Серия</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                      <span className="text-2xl">💪</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Тренировка</p>
                      <p className="text-xl font-bold">3 дня</p>
                      <p className="text-xs text-muted-foreground">Серия</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-2xl">🌍</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Язык</p>
                      <p className="text-xl font-bold">21 день</p>
                      <p className="text-xs text-success">🔥 Серия</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Достижения */}
      <Card className="shadow-elegant border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-display">
            <Award className="h-6 w-6 text-primary" />
            Достижения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gradient-primary text-white">
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-semibold">100 задач</p>
              <p className="text-xs opacity-80">Выполнено</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-4xl mb-2">⚡</div>
              <p className="font-semibold">30 дней</p>
              <p className="text-xs text-muted-foreground">Серия</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-4xl mb-2">🎯</div>
              <p className="font-semibold">5 проектов</p>
              <p className="text-xs text-muted-foreground">Завершено</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-4xl mb-2">📈</div>
              <p className="font-semibold">200 часов</p>
              <p className="text-xs text-muted-foreground">Продуктивности</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
