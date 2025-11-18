import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, CheckSquare, TrendingUp, Clock, Target, Award } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  accent: "hsl(var(--accent))",
  destructive: "hsl(var(--destructive))",
};

export default function Analytics() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Статистика и Аналитика</h1>
          <p className="text-muted-foreground mt-1">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Статистика и Аналитика</h1>
          <p className="text-muted-foreground mt-1">Нет данных для отображения</p>
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-muted-foreground">Всего задач</p>
                <p className="text-2xl font-bold">{analytics.stats.totalTasks}</p>
                <p className="text-xs text-muted-foreground mt-1">В системе</p>
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
                <p className="text-2xl font-bold">{analytics.stats.completedTasks}/{analytics.stats.totalTasks}</p>
                <p className="text-xs text-success mt-1">{analytics.stats.completionRate}% успешность</p>
              </div>
              <CheckSquare className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Привычки</p>
                <p className="text-2xl font-bold">{analytics.stats.totalHabits}</p>
                <p className="text-xs text-warning mt-1">Отслеживается</p>
              </div>
              <Target className="h-8 w-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Активные проекты</p>
                <p className="text-2xl font-bold">{analytics.stats.activeProjects}</p>
                <p className="text-xs text-primary mt-1">Всего: {analytics.stats.totalProjects}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
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
                <CardTitle className="text-lg font-display">Задачи по проектам</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.projectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.projectData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Legend />
                      <Bar dataKey="totalTasks" fill={COLORS.primary} name="Всего задач" />
                      <Bar dataKey="completedTasks" fill={COLORS.success} name="Выполнено" />
                      <Bar dataKey="activeTasks" fill={COLORS.accent} name="В процессе" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Нет данных по проектам с задачами
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-display">Распределение задач</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {analytics.projectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.projectData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, totalTasks }) => `${name}: ${totalTasks}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="totalTasks"
                      >
                        {analytics.projectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Нет данных по проектам с задачами
                  </div>
                )}
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
                  <LineChart data={analytics.weeklyTaskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke={COLORS.success} strokeWidth={2} name="Выполнено" />
                    <Line type="monotone" dataKey="active" stroke={COLORS.warning} strokeWidth={2} name="Активные" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-display">Общая продуктивность</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {analytics.productivityData[0].value > 0 || analytics.productivityData[1].value > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.productivityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={100}
                        fill={COLORS.primary}
                        dataKey="value"
                      >
                        {analytics.productivityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.success : COLORS.primary} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Нет задач для анализа
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {analytics.priorityData.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-display">Распределение по приоритетам</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="value" fill={COLORS.primary} name="Задач" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Статистика привычек */}
        <TabsContent value="habits" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-display">Прогресс привычек (последняя неделя)</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.habitProgressData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.habitProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill={COLORS.primary} name="Прогресс %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Нет данных по привычкам
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-display">Активность по дням недели</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="tasks" fill={COLORS.primary} name="Задачи" />
                  <Bar dataKey="events" fill={COLORS.accent} name="События" />
                  <Bar dataKey="habits" fill={COLORS.success} name="Привычки" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Достижения */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Всего задач выполнено</p>
              <p className="text-2xl font-bold">{analytics.stats.completedTasks}</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Коэффициент выполнения</p>
              <p className="text-2xl font-bold">{analytics.stats.completionRate}%</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">События в календаре</p>
              <p className="text-2xl font-bold">{analytics.stats.totalEvents}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
