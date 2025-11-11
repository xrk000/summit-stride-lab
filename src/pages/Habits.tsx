import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, TrendingUp, Calendar, Check, Pencil, Trash2, Search } from "lucide-react";

type Habit = {
  id: number;
  name: string;
  description: string;
  streak: number;
  goal: number;
  completedToday: boolean;
  weekProgress: boolean[];
  category: string;
};

export default function Habits() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [habits, setHabits] = useState<Habit[]>([
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
  ]);

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const handleAddHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingHabit) {
      setHabits(habits.map(habit =>
        habit.id === editingHabit.id
          ? {
              ...habit,
              name: formData.get("name") as string,
              description: formData.get("description") as string,
              goal: parseInt(formData.get("goal") as string),
              category: formData.get("category") as string,
            }
          : habit
      ));
      setEditingHabit(null);
    } else {
      const newHabit: Habit = {
        id: Math.max(0, ...habits.map(h => h.id)) + 1,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        streak: 0,
        goal: parseInt(formData.get("goal") as string),
        completedToday: false,
        weekProgress: [false, false, false, false, false, false, false],
        category: formData.get("category") as string,
      };
      setHabits([...habits, newHabit]);
    }
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsDialogOpen(true);
  };

  const handleDeleteHabit = (habitId: number) => {
    setHabits(habits.filter(habit => habit.id !== habitId));
    setDeletingHabitId(null);
  };

  const toggleHabitCompletion = (habitId: number) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const newCompleted = !habit.completedToday;
        const newStreak = newCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);
        const newWeekProgress = [...habit.weekProgress];
        newWeekProgress[6] = newCompleted; // Today is Sunday (last day)
        return {
          ...habit,
          completedToday: newCompleted,
          streak: newStreak,
          weekProgress: newWeekProgress,
        };
      }
      return habit;
    }));
  };

  const filteredHabits = habits.filter((habit) => {
    if (!searchQuery) return true;
    return habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      habit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      habit.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Привычки</h1>
          <p className="text-muted-foreground mt-1">Отслеживайте свой прогресс</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingHabit(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Новая привычка
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingHabit ? "Редактировать привычку" : "Новая привычка"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input id="name" name="name" defaultValue={editingHabit?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" defaultValue={editingHabit?.description} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select name="category" defaultValue={editingHabit?.category} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Здоровье">Здоровье</SelectItem>
                    <SelectItem value="Развитие">Развитие</SelectItem>
                    <SelectItem value="Продуктивность">Продуктивность</SelectItem>
                    <SelectItem value="Другое">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Цель (дней)</Label>
                <Input 
                  id="goal" 
                  name="goal" 
                  type="number" 
                  min="1" 
                  defaultValue={editingHabit?.goal || "30"} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full">
                {editingHabit ? "Сохранить" : "Добавить"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Поиск привычек..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
        {filteredHabits.map((habit) => (
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
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-2xl font-bold">
                        🔥 {habit.streak}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">дней подряд</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditHabit(habit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingHabitId(habit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                  <Button 
                    className="w-full bg-primary" 
                    size="lg"
                    onClick={() => toggleHabitCompletion(habit.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Отметить как выполненное
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingHabitId} onOpenChange={() => setDeletingHabitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить привычку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить эту привычку? Весь прогресс будет утерян. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingHabitId && handleDeleteHabit(deletingHabitId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
