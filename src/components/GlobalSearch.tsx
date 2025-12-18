import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Calendar, CheckSquare, StickyNote, TrendingUp, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useNotes } from "@/hooks/useNotes";
import { useHabits } from "@/hooks/useHabits";
import { useProjects } from "@/hooks/useProjects";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAllTaskTags } from "@/hooks/useAllTaskTags";
import { useAllHabitTags } from "@/hooks/useAllHabitTags";
import { useAllEventTags } from "@/hooks/useAllEventTags";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type SearchResult = {
  id: string;
  type: "event" | "task" | "note" | "habit" | "project";
  title: string;
  description?: string;
  tags?: string[];
  route: string;
  metadata?: string;
};

const typeConfig = {
  event: { icon: Calendar, label: "Событие", color: "bg-primary/10 text-primary border-primary/20" },
  task: { icon: CheckSquare, label: "Задача", color: "bg-warning/10 text-warning border-warning/20" },
  note: { icon: StickyNote, label: "Заметка", color: "bg-accent/10 text-accent border-accent/20" },
  habit: { icon: TrendingUp, label: "Привычка", color: "bg-success/10 text-success border-success/20" },
  project: { icon: FolderKanban, label: "Проект", color: "bg-secondary/10 text-secondary border-secondary/20" },
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const navigate = useNavigate();

  // Получаем данные из БД
  const { tasks } = useTasks();
  const { notes } = useNotes();
  const { habits } = useHabits();
  const { projects } = useProjects();
  const { events } = useCalendarEvents();

  // Получаем теги
  const { data: taskTagsMap } = useAllTaskTags();
  const { data: habitTagsMap } = useAllHabitTags();
  const { data: eventTagsMap } = useAllEventTags();

  // Теги для заметок
  const { data: noteTagsMap } = useQuery({
    queryKey: ["allNoteTags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("note_tags")
        .select(`
          note_id,
          tags (id, name)
        `);
      if (error) throw error;
      
      const map = new Map<string, { id: string; name: string }[]>();
      data?.forEach((item: any) => {
        if (!map.has(item.note_id)) {
          map.set(item.note_id, []);
        }
        if (item.tags) {
          map.get(item.note_id)!.push(item.tags);
        }
      });
      return map;
    },
  });

  // Теги для проектов
  const { data: projectTagsMap } = useQuery({
    queryKey: ["allProjectTags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tags")
        .select(`
          project_id,
          tags (id, name)
        `);
      if (error) throw error;
      
      const map = new Map<string, { id: string; name: string }[]>();
      data?.forEach((item: any) => {
        if (!map.has(item.project_id)) {
          map.set(item.project_id, []);
        }
        if (item.tags) {
          map.get(item.project_id)!.push(item.tags);
        }
      });
      return map;
    },
  });

  // Собираем все данные в единый массив
  const allData = useMemo((): SearchResult[] => {
    const results: SearchResult[] = [];

    // Задачи
    tasks.forEach(task => {
      const tags = taskTagsMap?.get(task.id)?.map(t => t.name) || [];
      results.push({
        id: task.id,
        type: "task",
        title: task.title,
        description: task.description || undefined,
        tags,
        route: "/tasks",
        metadata: task.priority ? `${task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"} приоритет` : undefined,
      });
    });

    // Заметки
    notes.forEach(note => {
      const tags = noteTagsMap?.get(note.id)?.map(t => t.name) || [];
      results.push({
        id: note.id,
        type: "note",
        title: note.title,
        description: note.content || undefined,
        tags,
        route: "/notes",
      });
    });

    // Привычки
    habits.forEach(habit => {
      const tags = habitTagsMap?.get(habit.id)?.map(t => t.name) || [];
      results.push({
        id: habit.id,
        type: "habit",
        title: habit.name,
        description: habit.description || undefined,
        tags,
        route: "/habits",
        metadata: habit.frequency || undefined,
      });
    });

    // Проекты
    projects.forEach(project => {
      const tags = projectTagsMap?.get(project.id)?.map(t => t.name) || [];
      results.push({
        id: project.id,
        type: "project",
        title: project.name,
        description: project.description || undefined,
        tags,
        route: "/projects",
        metadata: project.status || undefined,
      });
    });

    // События календаря
    events.forEach(event => {
      const tags = eventTagsMap?.get(event.id)?.map(t => t.name) || [];
      results.push({
        id: event.id,
        type: "event",
        title: event.title,
        description: event.description || undefined,
        tags,
        route: "/calendar",
        metadata: event.time || undefined,
      });
    });

    return results;
  }, [tasks, notes, habits, projects, events, taskTagsMap, noteTagsMap, habitTagsMap, projectTagsMap, eventTagsMap]);

  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) return [];

    return allData.filter((item) => {
      // Фильтр по типу
      if (selectedType !== "all" && item.type !== selectedType) {
        return false;
      }

      // Поиск по названию
      if (item.title.toLowerCase().includes(query)) {
        return true;
      }

      // Поиск по описанию
      if (item.description?.toLowerCase().includes(query)) {
        return true;
      }

      // Поиск по тегам (с # или без)
      const tagQuery = query.startsWith('#') ? query.slice(1) : query;
      if (item.tags?.some(tag => tag.toLowerCase().includes(tagQuery))) {
        return true;
      }

      return false;
    });
  }, [searchQuery, selectedType, allData]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.route);
    onOpenChange(false);
    setSearchQuery("");
  };

  const typeFilters = [
    { value: "all", label: "Все" },
    { value: "task", label: "Задачи" },
    { value: "note", label: "Заметки" },
    { value: "project", label: "Проекты" },
    { value: "habit", label: "Привычки" },
    { value: "event", label: "События" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Глобальный поиск</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-4 space-y-4">
          {/* Поле поиска */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названиям, описаниям и тегам..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Фильтры по типу */}
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map((filter) => (
              <Badge
                key={filter.value}
                variant={selectedType === filter.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedType(filter.value)}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Результаты поиска */}
        <ScrollArea className="max-h-[400px] px-6 pb-6">
          {searchQuery && filteredResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ничего не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить запрос или фильтры</p>
            </div>
          )}

          {searchQuery && filteredResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Найдено результатов: {filteredResults.length}
              </p>
              
              {filteredResults.map((result) => {
                const config = typeConfig[result.type];
                const Icon = config.icon;
                
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{result.title}</h3>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {config.label}
                          </Badge>
                        </div>
                        
                        {result.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {result.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {result.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {result.metadata && (
                            <span className="text-xs text-muted-foreground">
                              • {result.metadata}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Начните вводить для поиска</p>
              <p className="text-sm mt-1">
                Поиск работает по названиям, описаниям и тегам
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
