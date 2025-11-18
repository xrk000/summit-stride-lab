import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, ChevronRight, Pencil, Trash2, Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTasks, Task } from "@/hooks/useTasks";
import { useTaskTags } from "@/hooks/useTaskTags";
import { useAllTaskTags } from "@/hooks/useAllTaskTags";
import { TaskTagSelector } from "@/components/TaskTagSelector";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export default function Tasks() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const { tasks, isLoading, createTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { data: editingTaskTags } = useTaskTags(editingTask?.id || null);
  const { data: taskTagsMap } = useAllTaskTags();

  // Загружаем теги при редактировании задачи
  useEffect(() => {
    if (editingTask && editingTaskTags) {
      setSelectedTagIds(editingTaskTags.map(tag => tag.id));
    } else {
      setSelectedTagIds([]);
    }
  }, [editingTask, editingTaskTags]);

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingTask) {
      updateTask({
        id: editingTask.id,
        title: formData.get("title") as string,
        priority: formData.get("priority") as string,
        due_date: formData.get("deadline") as string,
        description: formData.get("description") as string,
        tagIds: selectedTagIds,
      });
      setEditingTask(null);
    } else {
      createTask({
        title: formData.get("title") as string,
        priority: formData.get("priority") as string,
        due_date: formData.get("deadline") as string,
        description: formData.get("description") as string,
        completed: false,
        completed_at: null,
        tagIds: selectedTagIds,
      });
    }
    setIsDialogOpen(false);
    setSelectedTagIds([]);
    e.currentTarget.reset();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId);
  };

  const confirmDelete = () => {
    if (deletingTaskId !== null) {
      deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = 
      filter === "all" || 
      (filter === "completed" && task.completed) ||
      (filter === "active" && !task.completed);
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDate = !filterDate || (task.due_date && 
      format(parseISO(task.due_date), "yyyy-MM-dd") === format(filterDate, "yyyy-MM-dd"));
    return matchesFilter && matchesSearch && matchesDate;
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Загрузка задач...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Задачи</h1>
          <p className="text-muted-foreground mt-1">
            Всего задач: {tasks.length}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTask(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Новая задача
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={editingTask?.title}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Приоритет</Label>
                <Select name="priority" defaultValue={editingTask?.priority || "medium"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="low">Низкий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Дедлайн</Label>
                <Input 
                  id="deadline" 
                  name="deadline" 
                  type="date" 
                  defaultValue={editingTask?.due_date || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingTask?.description || ""}
                />
              </div>
              <TaskTagSelector 
                selectedTagIds={selectedTagIds}
                onTagsChange={setSelectedTagIds}
              />
              <Button type="submit" className="w-full">
                {editingTask ? "Сохранить" : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск задач..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {filterDate && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Фильтр по дате</h4>
                {filterDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterDate(undefined)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Сбросить
                  </Button>
                )}
              </div>
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={setFilterDate}
                className="pointer-events-auto"
              />
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Все
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
          >
            Активные
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
          >
            Завершенные
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Задачи не найдены
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className={cn(
              "hover:shadow-md transition-shadow",
              task.completed && "opacity-60"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed || false}
                      onChange={() => toggleTask(task.id)}
                      className="mt-1 h-5 w-5 rounded border-border cursor-pointer"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className={cn(
                          "font-semibold text-lg",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                        {task.priority && (
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      {task.due_date && (
                        <p className="text-sm text-muted-foreground">
                          Дедлайн: {format(parseISO(task.due_date), "dd MMMM yyyy", { locale: ru })}
                        </p>
                      )}
                      {taskTagsMap?.get(task.id) && taskTagsMap.get(task.id)!.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {taskTagsMap.get(task.id)!.map(tag => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTask(task)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedTask(task)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Приоритет</Label>
              <p className="text-sm mt-1">
                {selectedTask?.priority === "high" ? "Высокий" : selectedTask?.priority === "medium" ? "Средний" : "Низкий"}
              </p>
            </div>
            {selectedTask?.due_date && (
              <div>
                <Label>Дедлайн</Label>
                <p className="text-sm mt-1">
                  {format(parseISO(selectedTask.due_date), "dd MMMM yyyy", { locale: ru })}
                </p>
              </div>
            )}
            <div>
              <Label>Описание</Label>
              <p className="text-sm mt-1">{selectedTask?.description || "Нет описания"}</p>
            </div>
            <div>
              <Label>Статус</Label>
              <p className="text-sm mt-1">{selectedTask?.completed ? "Завершена" : "Активна"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTaskId} onOpenChange={() => setDeletingTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Задача будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
