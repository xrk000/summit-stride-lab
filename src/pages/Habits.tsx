import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, CheckCircle2, Circle, Pencil, Trash2, Search, Flame, Loader2 } from "lucide-react";
import { useHabits, type Habit } from "@/hooks/useHabits";
import { useTags } from "@/hooks/useTags";
import { useAllHabitTags } from "@/hooks/useAllHabitTags";
import { TagInput } from "@/components/TagInput";
import { cn } from "@/lib/utils";
import { isHabitDueOnDate } from "@/lib/habitUtils";
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

      const currentTags = habitTagsMap?.get(editingHabit.id) || [];
      const currentTagIds = currentTags.map(t => t.id);
      const newTagIds = selectedTags.map(t => t.id);

      const tagsToRemove = currentTagIds.filter(id => !newTagIds.includes(id));
      tagsToRemove.forEach(tagId => {
        removeTagFromEntity({ entityType: 'habit', entityId: editingHabit.id, tagId });
      });

      const tagsToAdd = newTagIds.filter(id => !currentTagIds.includes(id));
      tagsToAdd.forEach(tagId => {
        addTagToEntity({ entityType: 'habit', entityId: editingHabit.id, tagId });
      });

      setEditingHabit(null);
    } else {
      const tagIds = selectedTags.map(t => t.id);
      createHabit({ ...habitData, tagIds });
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
    if (isFuture(startOfDay(date))) return;
    toggleHabitEntry({ habitId, date: format(date, 'yyyy-MM-dd') });
  };

  const shouldShowHabitForDate = isHabitDueOnDate;

  const isHabitCompleted = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = habitEntries.find(e => e.habit_id === habitId && e.date === dateStr);
    return entry?.completed || false;
  };

  const getHabitStreak = (habitId: string) => {
    const entries = habitEntries
      .filter(e => e.habit_id === habitId && e.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentStreakDate = new Date();

    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      const diffDays = Math.floor((currentStreakDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getWeekProgress = (habit: Habit) => {
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    const scheduledDays = weekDates.filter(date => shouldShowHabitForDate(habit, date));
    if (scheduledDays.length === 0) return 0;
    const completedDays = scheduledDays.filter(date => isHabitCompleted(habit.id, date));
    return (completedDays.length / scheduledDays.length) * 100;
  };

  const filteredHabits = habits.filter(habit => {
    const searchLower = searchQuery.toLowerCase();
    const habitTags = habitTagsMap?.get(habit.id) || [];
    const matchesName = habit.name.toLowerCase().includes(searchLower);
    const matchesDescription = habit.description && habit.description.toLowerCase().includes(searchLower);
    const searchTag = searchQuery.startsWith('#') ? searchLower.slice(1) : searchLower;
    const matchesTags = habitTags.some(tag => tag.name.toLowerCase().includes(searchTag));
    return matchesName || matchesDescription || matchesTags;
  });

  const stats = {
    total: habits.length,
    completedToday: habits.filter(h => isHabitCompleted(h.id, new Date())).length,
    averageProgress: habits.length > 0
      ? habits.reduce((sum, h) => sum + getWeekProgress(h), 0) / habits.length
      : 0,
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Загрузка привычек...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-primary/80 to-slate-900 p-8 min-h-[160px]">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Заголовок */}
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <Flame className="h-4 w-4" />
              Ежедневные привычки
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white">Привычки</h1>
            <p className="text-white/40 text-xs mt-2">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: ru })}
            </p>
          </div>

          {/* Статистика */}
          <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
            {[
              { label: "Всего привычек", value: stats.total, icon: TrendingUp, color: "text-blue-400" },
              { label: "Сегодня", value: `${stats.completedToday}/${stats.total}`, icon: CheckCircle2, color: "text-green-400" },
              { label: "Прогресс недели", value: `${Math.round(stats.averageProgress)}%`, icon: Flame, color: "text-orange-400" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <s.icon className={cn("h-5 w-5 flex-shrink-0", s.color)} />
                <div>
                  <p className="text-white/40 text-xs leading-none">{s.label}</p>
                  <p className="text-white font-bold text-2xl leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Кнопка */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border transition-all text-sm font-medium bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30 text-blue-300"
            >
              <Plus className="h-4 w-4" />
              Новая привычка
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          НАВИГАЦИЯ ПО НЕДЕЛЯМ + ПОИСК
      ═══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Неделя */}
        <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/40 border border-border/60 shrink-0">
          <Button
            variant="ghost" size="sm"
            className="h-8 px-3 text-sm"
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          >
            ←
          </Button>
          <span className="text-sm font-medium px-2 min-w-[180px] text-center">
            {format(currentWeekStart, 'd MMM', { locale: ru })} — {format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: ru })}
          </span>
          <Button
            variant="ghost" size="sm"
            className="h-8 px-3 text-sm"
            onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
          >
            →
          </Button>
        </div>

        {/* Поиск */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск привычек... (# для поиска по тегам)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/40 border-border/60"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          СПИСОК ПРИВЫЧЕК
      ═══════════════════════════════════════════ */}
      {filteredHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Flame className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div>
            <p className="font-semibold">
              {searchQuery ? "Привычки не найдены" : "Привычек пока нет"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Попробуйте изменить запрос" : "Создайте свою первую привычку"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHabits.map((habit) => {
            const streak = getHabitStreak(habit.id);
            const weekProgress = getWeekProgress(habit);
            const habitTags = habitTagsMap?.get(habit.id) || [];

            return (
              <div
                key={habit.id}
                className="group flex flex-col p-5 rounded-xl border border-border/50 bg-card transition-all hover:border-border hover:shadow-sm"
              >
                {/* Заголовок */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold break-all">{habit.name}</h3>
                      {streak > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          🔥 {streak} дней
                        </Badge>
                      )}
                      {habit.frequency === 'every_2_days' && (
                        <Badge variant="outline" className="text-xs">Каждые 2 дня</Badge>
                      )}
                      {habit.frequency === 'every_3_days' && (
                        <Badge variant="outline" className="text-xs">Каждые 3 дня</Badge>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 break-words">{habit.description}</p>
                    )}
                    {habitTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {habitTags.map(tag => (
                          <Badge key={tag.id} variant="secondary" className="text-xs px-1.5">
                            #{tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditHabit(habit)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteHabit(habit.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Прогресс недели */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Прогресс недели</span>
                    <span className="font-semibold">{Math.round(weekProgress)}%</span>
                  </div>
                  <Progress value={weekProgress} className="h-1.5" />
                </div>

                {/* Сетка дней */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((date, index) => {
                    const shouldShow = shouldShowHabitForDate(habit, date);
                    const completed = isHabitCompleted(habit.id, date);
                    const todayDate = isToday(date);
                    const isFutureDate = isFuture(startOfDay(date));

                    return (
                      <button
                        key={index}
                        onClick={() => handleToggleHabit(habit.id, date)}
                        disabled={isFutureDate || !shouldShow}
                        className={cn(
                          "aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all",
                          shouldShow && completed
                            ? "bg-green-500/15 border-green-500/50"
                            : shouldShow && !isFutureDate
                              ? "border-border/50 hover:border-primary/60 hover:bg-muted/40"
                              : "border-border/20 bg-muted/20",
                          todayDate && shouldShow && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                          (isFutureDate || !shouldShow) && "opacity-30 cursor-not-allowed"
                        )}
                      >
                        <span className={cn("text-xs font-medium leading-none", completed && shouldShow ? "text-green-600 dark:text-green-400" : "")}>
                          {format(date, 'EEEEE', { locale: ru })}
                        </span>
                        <span className="text-xs text-muted-foreground leading-none">
                          {format(date, 'd')}
                        </span>
                        {shouldShow && completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : shouldShow ? (
                          <Circle className="h-4 w-4 text-muted-foreground/50 mt-0.5" />
                        ) : (
                          <div className="h-4 w-4 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Диалог создания / редактирования */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) { setEditingHabit(null); setSelectedTags([]); }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHabit ? "Редактировать привычку" : "Новая привычка"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddHabit} className="space-y-4">
            <div>
              <Label htmlFor="name">Название</Label>
              <Input
                id="name" name="name"
                defaultValue={editingHabit?.name}
                placeholder="Например: Медитация"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description" name="description"
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

      {/* Подтверждение удаления */}
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
