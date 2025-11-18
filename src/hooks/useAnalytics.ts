import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, subWeeks, format, startOfDay, endOfDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export const useAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Получаем все данные параллельно
      const [
        { data: tasks },
        { data: projects },
        { data: habits },
        { data: habitEntries },
        { data: calendarEvents },
      ] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("projects").select("id, name, status").eq("user_id", user.id),
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("habit_entries").select("*").eq("user_id", user.id),
        supabase.from("calendar_events").select("*").eq("user_id", user.id),
      ]);

      // Получаем задачи по проектам
      const { data: projectTasks } = await supabase
        .from("project_tasks")
        .select("project_id, task_id, tasks(*)");

      // Группируем задачи по проектам
      const projectTasksMap = new Map<string, any[]>();
      projectTasks?.forEach((pt) => {
        if (pt.tasks) {
          const existing = projectTasksMap.get(pt.project_id) || [];
          projectTasksMap.set(pt.project_id, [...existing, pt.tasks]);
        }
      });

      // 1. Данные по проектам - количество задач на проект
      const projectData = projects?.map(project => {
        const projectTasksList = projectTasksMap.get(project.id) || [];
        const completedTasks = projectTasksList.filter((t: any) => t.completed).length;
        return {
          name: project.name,
          totalTasks: projectTasksList.length,
          completedTasks,
          activeTasks: projectTasksList.length - completedTasks,
        };
      }).filter(p => p.totalTasks > 0) || [];

      // 2. Выполнение задач по неделям (последние 4 недели)
      const weeklyTaskData = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = startOfWeek(subWeeks(new Date(), i), { locale: ru });
        const weekEnd = endOfWeek(weekStart, { locale: ru });
        
        const weekTasks = tasks?.filter(task => {
          const taskDate = task.completed_at ? new Date(task.completed_at) : new Date(task.created_at);
          return taskDate >= weekStart && taskDate <= weekEnd;
        }) || [];

        const completed = weekTasks.filter(t => t.completed).length;
        
        weeklyTaskData.unshift({
          week: format(weekStart, "d MMM", { locale: ru }),
          completed,
          active: weekTasks.length - completed,
          total: weekTasks.length,
        });
      }

      // 3. Прогресс привычек за последнюю неделю
      const weekStart = startOfWeek(new Date(), { locale: ru });
      const weekEnd = endOfWeek(new Date(), { locale: ru });
      
      const habitProgressData = habits?.map(habit => {
        const habitEntriesForWeek = habitEntries?.filter(entry => 
          entry.habit_id === habit.id &&
          new Date(entry.date) >= weekStart &&
          new Date(entry.date) <= weekEnd &&
          entry.completed
        ) || [];
        
        const progress = Math.round((habitEntriesForWeek.length / 7) * 100);
        
        return {
          name: habit.name,
          value: progress,
          completedDays: habitEntriesForWeek.length,
        };
      }) || [];

      // 4. Общая продуктивность - соотношение выполненных/невыполненных задач
      const completedTasksCount = tasks?.filter(t => t.completed).length || 0;
      const totalTasksCount = tasks?.length || 0;
      const activeTasksCount = totalTasksCount - completedTasksCount;

      const productivityData = [
        { 
          name: "Выполнено", 
          value: completedTasksCount,
          percentage: totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0,
        },
        { 
          name: "В процессе", 
          value: activeTasksCount,
          percentage: totalTasksCount > 0 ? Math.round((activeTasksCount / totalTasksCount) * 100) : 0,
        },
      ];

      // 5. Активность по дням недели за последнюю неделю
      const dailyActivityData = [];
      const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        const dayStr = format(day, "yyyy-MM-dd");
        
        const dayTasks = tasks?.filter(t => {
          const taskDate = t.completed_at ? format(new Date(t.completed_at), "yyyy-MM-dd") : null;
          return taskDate === dayStr;
        }).length || 0;
        
        const dayEvents = calendarEvents?.filter(e => e.date === dayStr).length || 0;
        
        const dayHabits = habitEntries?.filter(e => 
          e.date === dayStr && e.completed
        ).length || 0;
        
        dailyActivityData.push({
          day: daysOfWeek[i],
          tasks: dayTasks,
          events: dayEvents,
          habits: dayHabits,
        });
      }

      // 6. Статистика по приоритетам задач
      const priorityData = [
        { name: "Высокий", value: tasks?.filter(t => t.priority === "high").length || 0 },
        { name: "Средний", value: tasks?.filter(t => t.priority === "medium").length || 0 },
        { name: "Низкий", value: tasks?.filter(t => t.priority === "low").length || 0 },
      ].filter(p => p.value > 0);

      return {
        projectData,
        weeklyTaskData,
        habitProgressData,
        productivityData,
        dailyActivityData,
        priorityData,
        stats: {
          totalTasks: totalTasksCount,
          completedTasks: completedTasksCount,
          completionRate: totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0,
          totalProjects: projects?.length || 0,
          activeProjects: projects?.filter(p => p.status === "active").length || 0,
          totalHabits: habits?.length || 0,
          totalEvents: calendarEvents?.length || 0,
        },
      };
    },
  });
};
