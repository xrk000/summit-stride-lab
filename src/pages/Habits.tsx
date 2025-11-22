import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, CheckCircle2, Circle, Pencil, Trash2, Search, Calendar } from "lucide-react";
import { useHabits } from "@/hooks/useHabits";
import { useTags } from "@/hooks/useTags";
import { useHabitTags } from "@/hooks/useHabitTags";
import { useAllHabitTags } from "@/hooks/useAllHabitTags";
import { TagInput } from "@/components/TagInput";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, subWeeks, isToday, isFuture, startOfDay, parseISO, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";

export default function Habits() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { locale: ru }));
  const [selectedTags, setSelectedTags] = useState<Array<{ id: string; name: string }>>([]);

  const { habits, habitEntries, isLoading, createHabit, updateHabit, deleteHabit, toggleHabitEntry } = useHabits();
  const { tags, addTagToEntity, removeTagFromEntity } = useTags();
  const { data: habitTagsMap } = useAllHabitTags();

  const handleAddHabit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const habitData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      frequency: formData.get("frequency") as string,
    };

    if (editingHabit) {
      updateHabit({ id: editingHabit.id, ...habitData });
      
      // Обновляем теги
      const currentTags = habitTagsMap?.get(editingHabit.id) || [];
      const currentTagIds = currentTags.map(t => t.id);
      const newTagIds = selectedTags.map(t => t.id);
      
      // Удаляем теги, которые были сняты
      const tagsToRemove = currentTagIds.filter(id => !newTagIds.includes(id));
      tagsToRemove.forEach(tagId => {
        removeTagFromEntity({ entityType: 'habit', entityId: editingHabit.id, tagId });
      });
      
      // Добавляем новые теги
      const tagsToAdd = newTagIds.filter(id => !currentTagIds.includes(id));
      tagsToAdd.forEach(tagId => {
        addTagToEntity({ entityType: 'habit', entityId: editingHabit.id, tagId });
      });
      
      setEditingHabit(null);
    } else {
      // Создаем привычку, затем добавляем теги
      createHabit(habitData);
    }
    
    setSelectedTags([]);
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditHabit = (habit: any) => {
    setEditingHabit(habit);
    const habitTags = habitTagsMap?.get(habit.id) || [];
    setSelectedTags(habitTags);
    setIsDialogOpen(true);
  };

  const handleDeleteHabit = (habitId: string) => {
    setDeletingHabitId(habitId);
  };

  const confirmDelete = () => {
    if (deletingHabitId) {
      deleteHabit(deletingHabitId);
      setDeletingHabitId(null);
    }
  };

  const handleToggleHabit = (habitId: string, date: Date) => {
    // Не позволяем отмечать будущие даты
    if (isFuture(startOfDay(date))) {
      return;
    }
    toggleHabitEntry({ habitId, date: format(date, 'yyyy-MM-dd') });
  };

  const shouldShowHabitForDate = (habit: any, date: Date) => {
    if (!habit.frequency || habit.frequency === 'daily') return true;
    
    const habitCreatedAt = parseISO(habit.created_at);
    const daysDiff = differenceInDays(startOfDay(date), startOfDay(habitCreatedAt));
    
    if (habit.frequency === 'every_2_days') {
      return daysDiff % 2 === 0;
    } else if (habit.frequency === 'every_3_days') {
      return daysDiff % 3 === 0;
    }
    
    return true;
  };

  const isHabitCompleted = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = habitEntries.find(
      e => e.habit_id === habitId && e.date === dateStr
    );
    return entry?.completed || false;
  };

  const getHabitStreak = (habitId: string) => {
    const entries = habitEntries
      .filter(e => e.habit_id === habitId && e.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getWeekProgress = (habitId: string) => {
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    const completed = weekDates.filter(date => isHabitCompleted(habitId, date)).length;
    return (completed / 7) * 100;
  };

  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (habit.description && habit.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Поиск по тегам
    if (searchQuery.startsWith('#')) {
      const tagQuery = searchQuery.slice(1).toLowerCase();
      const habitTags = habitTagsMap?.get(habit.id) || [];
      return habitTags.some(tag => tag.name.toLowerCase().includes(tagQuery));
    }
    
    return matchesSearch;
  });

  const stats = {
    total: habits.length,
    completedToday: habits.filter(h => isHabitCompleted(h.id, new Date())).length,
    averageProgress: habits.length > 0 
      ? habits.reduce((sum, h) => sum + getWeekProgress(h.id), 0) / habits.length 
      : 0,
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Загрузка привычек...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Трекер привычек</h1>
          <p className="text-muted-foreground mt-1">Отслеживайте свой прогресс каждый день</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingHabit(null);
            setSelectedTags([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Новая привычка
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingHabit ? "Редактировать привычку" : "Новая привычка"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingHabit?.name}
                  placeholder="Например: Медитация"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingHabit?.description}
                  placeholder="Краткое описание привычки"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Периодичность</Label>
                <Select name="frequency" defaultValue={editingHabit?.frequency || "daily"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите периодичность" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Ежедневно</SelectItem>
                    <SelectItem value="every_2_days">Каждые 2 дня</SelectItem>
                    <SelectItem value="every_3_days">Каждые 3 дня</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Теги</Label>
                <TagInput
                  entityType="habit"
                  entityId={editingHabit?.id || null}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  isNewEntity={!editingHabit}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingHabit ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего привычек</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Выполнено сегодня</p>
                <p className="text-2xl font-bold">{stats.completedToday}/{stats.total}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Средний прогресс</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageProgress)}%</p>
              </div>
              <Calendar className="h-8 w-8 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
        >
          ← Предыдущая неделя
        </Button>
        <h3 className="font-semibold">
          {format(currentWeekStart, 'd MMM', { locale: ru })} - {format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: ru })}
        </h3>
        <Button
          variant="outline"
          onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
        >
          Следующая неделя →
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск привычек... (используйте # для поиска по тегам)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        {filteredHabits.map((habit) => {
          const streak = getHabitStreak(habit.id);
          const weekProgress = getWeekProgress(habit.id);
          const habitTags = habitTagsMap?.get(habit.id) || [];
          
          return (
            <Card key={habit.id} className="shadow-elegant">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      {habit.name}
                      {streak > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          🔥 {streak} дней
                        </Badge>
                      )}
                      {habit.frequency === 'every_2_days' && (
                        <Badge variant="outline">Каждые 2 дня</Badge>
                      )}
                      {habit.frequency === 'every_3_days' && (
                        <Badge variant="outline">Каждые 3 дня</Badge>
                      )}
                    </CardTitle>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
                    )}
                    {habitTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {habitTags.map(tag => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            #{tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditHabit(habit)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHabit(habit.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Week Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Прогресс недели</span>
                    <span className="font-medium">{Math.round(weekProgress)}%</span>
                  </div>
                  <Progress value={weekProgress} className="h-2" />
                </div>

                {/* Week Calendar */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((date, index) => {
                    const shouldShow = shouldShowHabitForDate(habit, date);
                    const completed = isHabitCompleted(habit.id, date);
                    const today = isToday(date);
                    const isFutureDate = isFuture(startOfDay(date));
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleToggleHabit(habit.id, date)}
                        disabled={isFutureDate || !shouldShow}
                        className={cn(
                          "aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all",
                          shouldShow && completed 
                            ? "bg-success/20 border-success" 
                            : shouldShow
                            ? "border-border hover:border-primary"
                            : "border-border/30 bg-muted/30",
                          today && shouldShow && "ring-2 ring-primary ring-offset-2",
                          (isFutureDate || !shouldShow) && "opacity-40 cursor-not-allowed hover:border-border"
                        )}
                      >
                        <span className="text-xs font-medium mb-1">
                          {format(date, 'EEE', { locale: ru })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(date, 'd')}
                        </span>
                        {shouldShow && completed ? (
                          <CheckCircle2 className="h-5 w-5 text-success mt-1" />
                        ) : shouldShow ? (
                          <Circle className="h-5 w-5 text-muted-foreground mt-1" />
                        ) : (
                          <div className="h-5 w-5 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingHabitId} onOpenChange={() => setDeletingHabitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить привычку?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Привычка и все связанные записи будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}