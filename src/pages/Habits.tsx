import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Calendar, Check } from "lucide-react";

export default function Habits() {
  const habits = [
    {
      id: 1,
      name: "Медитация",
      description: "10 минут каждое утро",
      streak: 7,
      goal: 30,
      completedToday: true,
      weekProgress: [true, true, true, true, true, true, true],
      category: "Здоровье",
    },
    {
      id: 2,
      name: "Чтение",
      description: "30 страниц в день",
      streak: 14,
      goal: 100,
      completedToday: true,
      weekProgress: [true, true, true, true, true, true, true],
      category: "Развитие",
    },
    {
      id: 3,
      name: "Тренировка",
      description: "1 час спорта",
      streak: 3,
      goal: 30,
      completedToday: false,
      weekProgress: [true, false, true, true, false, false, false],
      category: "Здоровье",
    },
    {
      id: 4,
      name: "Изучение языка",
      description: "Duolingo урок",
      streak: 21,
      goal: 100,
      completedToday: false,
      weekProgress: [true, true, true, true, true, true, false],
      category: "Развитие",
    },
  ];

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Привычки</h1>
          <p className="text-muted-foreground mt-1">Отслеживайте свой прогресс</p>
        </div>
        <Button className="bg-primary">
          <Plus className="h-4 w-4 mr-2" />
          Новая привычка
        </Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Активных привычек</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{habits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">2 выполнено сегодня</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Средняя серия</CardTitle>
            <Calendar className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">11 дней</div>
            <p className="text-xs text-muted-foreground mt-1">Продолжайте в том же духе!</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Успешность</CardTitle>
            <div className="text-2xl">🎯</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">73%</div>
            <p className="text-xs text-muted-foreground mt-1">На этой неделе</p>
          </CardContent>
        </Card>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        {habits.map((habit) => (
          <Card key={habit.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{habit.name}</h3>
                      {habit.completedToday && (
                        <Badge className="bg-success text-success-foreground">
                          <Check className="h-3 w-3 mr-1" />
                          Выполнено
                        </Badge>
                      )}
                      <Badge variant="outline">{habit.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{habit.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-2xl font-bold">
                      🔥 {habit.streak}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">дней подряд</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Прогресс к цели</span>
                    <span className="font-medium">
                      {habit.streak} / {habit.goal} дней
                    </span>
                  </div>
                  <Progress value={(habit.streak / habit.goal) * 100} className="h-2" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Последние 7 дней</p>
                  <div className="flex gap-2">
                    {weekDays.map((day, index) => (
                      <div key={day} className="flex-1 text-center">
                        <div className="text-xs text-muted-foreground mb-1">{day}</div>
                        <div
                          className={`
                            aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                            ${
                              habit.weekProgress[index]
                                ? "bg-success text-success-foreground"
                                : "bg-muted text-muted-foreground"
                            }
                          `}
                        >
                          {habit.weekProgress[index] ? "✓" : "−"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!habit.completedToday && (
                  <Button className="w-full bg-primary" size="lg">
                    <Check className="h-4 w-4 mr-2" />
                    Отметить как выполненное
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
