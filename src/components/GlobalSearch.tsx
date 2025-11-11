import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Calendar, CheckSquare, StickyNote, TrendingUp, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  type: "event" | "task" | "note" | "habit" | "project";
  title: string;
  description?: string;
  tags?: string[];
  route: string;
  metadata?: string;
};

// Моковые данные для демонстрации
const mockData: SearchResult[] = [
  // События
  { id: "e1", type: "event", title: "Утренняя планерка", description: "09:00 - Встреча", tags: [], route: "/calendar", metadata: "Сегодня" },
  { id: "e2", type: "event", title: "Презентация проекта", description: "14:00 - Задача", tags: [], route: "/calendar", metadata: "Сегодня" },
  { id: "e3", type: "event", title: "Тренировка", description: "19:00 - Привычка", tags: [], route: "/calendar", metadata: "Сегодня" },
  
  // Задачи
  { id: "t1", type: "task", title: "Написать отчет", description: "Подготовить квартальный отчет", tags: ["работа"], route: "/tasks", metadata: "Высокий приоритет" },
  { id: "t2", type: "task", title: "Обновить документацию", description: "Обновить README и API документацию", tags: ["проект-а", "разработка"], route: "/tasks", metadata: "Средний приоритет" },
  { id: "t3", type: "task", title: "Код ревью", description: "Проверить PR от коллеги", tags: ["работа", "код"], route: "/tasks", metadata: "Низкий приоритет" },
  { id: "t4", type: "task", title: "Купить продукты", description: "Молоко, хлеб, яйца", tags: ["личное"], route: "/tasks", metadata: "Средний приоритет" },
  
  // Заметки
  { id: "n1", type: "note", title: "Конспект: Веб-разработка", description: "React компоненты, хуки, state management...", tags: ["учеба", "программирование"], route: "/notes", metadata: "456 слов" },
  { id: "n2", type: "note", title: "Продукты на неделю", description: "Молоко, хлеб, яйца, овощи...", tags: ["личное", "покупки"], route: "/notes", metadata: "42 слова" },
  { id: "n3", type: "note", title: "Идеи для дипломного проекта", description: "Система управления продуктивностью с интеграциями...", tags: ["работа", "идеи", "проект"], route: "/notes", metadata: "234 слова" },
  
  // Привычки
  { id: "h1", type: "habit", title: "Медитация", description: "10 минут каждое утро", tags: ["здоровье"], route: "/habits", metadata: "7 дней подряд" },
  { id: "h2", type: "habit", title: "Чтение", description: "30 страниц в день", tags: ["развитие"], route: "/habits", metadata: "14 дней подряд" },
  { id: "h3", type: "habit", title: "Тренировка", description: "1 час спорта", tags: ["здоровье"], route: "/habits", metadata: "3 дня подряд" },
  { id: "h4", type: "habit", title: "Изучение языка", description: "Duolingo урок", tags: ["развитие"], route: "/habits", metadata: "21 день подряд" },
  
  // Проекты
  { id: "p1", type: "project", title: "Дипломная работа", description: "Система управления продуктивностью", tags: ["учеба", "разработка"], route: "/projects", metadata: "45% выполнено" },
  { id: "p2", type: "project", title: "Проект А", description: "Веб-приложение для клиента", tags: ["работа", "frontend"], route: "/projects", metadata: "78% выполнено" },
  { id: "p3", type: "project", title: "Личный сайт", description: "Портфолио разработчика", tags: ["личное", "portfolio"], route: "/projects", metadata: "12% выполнено" },
];

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

  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) return [];

    return mockData.filter((item) => {
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

      // Поиск по тегам
      if (item.tags?.some(tag => tag.toLowerCase().includes(query))) {
        return true;
      }

      return false;
    });
  }, [searchQuery, selectedType]);

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
                    key={result.id}
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
