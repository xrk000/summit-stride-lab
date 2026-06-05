import { differenceInDays, parseISO, startOfDay } from "date-fns";

interface HabitLike {
  frequency: string | null;
  created_at: string;
}

export function isHabitDueOnDate(habit: HabitLike, date: Date): boolean {
  if (!habit.frequency || habit.frequency === 'daily') return true;
  const daysDiff = differenceInDays(startOfDay(date), startOfDay(parseISO(habit.created_at)));
  if (habit.frequency === 'every_2_days') return daysDiff % 2 === 0;
  if (habit.frequency === 'every_3_days') return daysDiff % 3 === 0;
  return true;
}
