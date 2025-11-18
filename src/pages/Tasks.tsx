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
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useTags } from "@/hooks/useTags";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { TagInput } from "@/components/TagInput";
import { FilterSort } from "@/components/FilterSort";
import { FileUpload } from "@/components/FileUpload";
import { format } from "date-fns";

export default function Tasks() {
  const { tasks, isLoading, createTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { getEntityTags } = useTags();
  const { preferences, updatePreferences } = useUserPreferences();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [taskTags, setTaskTags] = useState<Record<string, any[]>>({});
  
  const taskPrefs = preferences.tasks || {};
  const sortBy = taskPrefs.sortBy || "created_at_desc";
  const filterBy = taskPrefs.filterBy || "all";
  const selectedTags = taskPrefs.selectedTags || [];

  useEffect(() => {
    loadTaskTags();
  }, [tasks]);

  const loadTaskTags = async () => {
    const tags: Record<string, any[]> = {};
    for (const task of tasks) {
      tags[task.id] = await getEntityTags('task', task.id);
    }
    setTaskTags(tags);
  };

  const handleSortChange = (value: string) => {
    updatePreferences({
      ...preferences,
      tasks: { ...taskPrefs, sortBy: value }
    });
  };

  const handleFilterChange = (value: string) => {
    updatePreferences({
      ...preferences,
      tasks: { ...taskPrefs, filterBy: value }
    });
  };

  const handleTagsChange = (tags: string[]) => {
    updatePreferences({
      ...preferences,
      tasks: { ...taskPrefs, selectedTags: tags }
    });
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const taskData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      priority: formData.get("priority") as string || null,
      due_date: formData.get("due_date") as string || null,
      completed: false,
      completed_at: null,
    };

    if (editingTask) {
      updateTask({ id: editingTask.id, ...taskData });
      setEditingTask(null);
    } else {
      createTask(taskData);
    }
    
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
    setDeletingTaskId(null);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  const sortTasks = (tasksToSort: any[]) => {
    const sorted = [...tasksToSort];
    switch (sortBy) {
      case "created_at_desc":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "created_at_asc":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "due_date_asc":
        return sorted.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
      case "due_date_desc":
        return sorted.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
        });
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return sorted.sort((a, b) => {
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
          return aPriority - bPriority;
        });
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };

  const filterTasks = (tasksToFilter: any[]) => {
    let filtered = tasksToFilter;

    if (filterBy === "active") {
      filtered = filtered.filter(task => !task.completed);
    } else if (filterBy === "completed") {
      filtered = filtered.filter(task => task.completed);
    } else if (filterBy === "overdue") {
      filtered = filtered.filter(task => 
        !task.completed && task.due_date && new Date(task.due_date) < new Date()
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(task => {
        const tags = taskTags[task.id] || [];
        return selectedTags.some(tagId => tags.some(tag => tag.id === tagId));
      });
    }

    return filtered;
  };

  const filteredAndSortedTasks = sortTasks(filterTasks(tasks));

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Задачи</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTask(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить задачу
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingTask?.description || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Приоритет</Label>
                  <Select name="priority" defaultValue={editingTask?.priority || "medium"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Дедлайн</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    defaultValue={editingTask?.due_date || ""}
                  />
                </div>
              </div>
              {editingTask && (
                <>
                  <div className="space-y-2">
                    <Label>Теги</Label>
                    <TagInput
                      entityType="task"
                      entityId={editingTask.id}
                      selectedTags={taskTags[editingTask.id] || []}
                      onTagsChange={loadTaskTags}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Файлы</Label>
                    <FileUpload entityType="task" entityId={editingTask.id} />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingTask(null);
                }}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingTask ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <FilterSort
        sortBy={sortBy}
        onSortChange={handleSortChange}
        filterBy={filterBy}
        onFilterChange={handleFilterChange}
        selectedTags={selectedTags}
        onTagsChange={handleTagsChange}
        sortOptions={[
          { value: "created_at_desc", label: "Дата создания (новые)" },
          { value: "created_at_asc", label: "Дата создания (старые)" },
          { value: "due_date_asc", label: "Дедлайн (ближайшие)" },
          { value: "due_date_desc", label: "Дедлайн (дальние)" },
          { value: "priority", label: "Приоритет" },
          { value: "title", label: "Название" },
        ]}
        filterOptions={[
          { value: "all", label: "Все" },
          { value: "active", label: "Активные" },
          { value: "completed", label: "Завершенные" },
          { value: "overdue", label: "Просроченные" },
        ]}
      />

      <div className="grid gap-4">
        {filteredAndSortedTasks.map((task) => (
          <Card key={task.id} className={cn(
            "transition-all hover:shadow-md",
            task.completed && "opacity-60"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() => toggleTask(task.id)}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center",
                    task.completed ? "bg-primary border-primary" : "border-muted-foreground"
                  )}>
                    {task.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </Button>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold",
                        task.completed && "line-through"
                      )}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingTaskId(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center text-sm">
                    {task.priority && (
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                      </Badge>
                    )}
                    {task.due_date && (
                      <Badge variant="outline">
                        {format(new Date(task.due_date), "dd.MM.yyyy")}
                      </Badge>
                    )}
                    {taskTags[task.id]?.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAndSortedTasks.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Задачи не найдены
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deletingTaskId} onOpenChange={(open) => !open && setDeletingTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Задача будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingTaskId && handleDeleteTask(deletingTaskId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
