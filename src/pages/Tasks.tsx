import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Filter, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: number;
  title: string;
  project: string;
  priority: "high" | "medium" | "low";
  status: "active" | "completed";
  deadline: string;
  description?: string;
};

export default function Tasks() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Написать отчет", project: "Работа", priority: "high", status: "active", deadline: "Сегодня", description: "Подготовить квартальный отчет" },
    { id: 2, title: "Обновить документацию", project: "Проект А", priority: "medium", status: "active", deadline: "Завтра", description: "Обновить README и API документацию" },
    { id: 3, title: "Код ревью", project: "Работа", priority: "low", status: "completed", deadline: "Вчера", description: "Проверить PR от коллеги" },
    { id: 4, title: "Купить продукты", project: "Личное", priority: "medium", status: "active", deadline: "Сегодня", description: "Молоко, хлеб, яйца" },
  ]);

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingTask) {
      setTasks(tasks.map(task =>
        task.id === editingTask.id
          ? {
              ...task,
              title: formData.get("title") as string,
              project: formData.get("project") as string,
              priority: formData.get("priority") as "high" | "medium" | "low",
              deadline: formData.get("deadline") as string,
              description: formData.get("description") as string,
            }
          : task
      ));
      setEditingTask(null);
    } else {
      const newTask: Task = {
        id: Math.max(0, ...tasks.map(t => t.id)) + 1,
        title: formData.get("title") as string,
        project: formData.get("project") as string,
        priority: formData.get("priority") as "high" | "medium" | "low",
        status: "active",
        deadline: formData.get("deadline") as string,
        description: formData.get("description") as string,
      };
      setTasks([...tasks, newTask]);
    }
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    setDeletingTaskId(null);
  };

  const toggleTaskStatus = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === "active" ? "completed" : "active" as "active" | "completed" }
        : task
    ));
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Задачи</h1>
          <p className="text-muted-foreground mt-1">Управляйте своими задачами и проектами</p>
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
                <Input id="title" name="title" defaultValue={editingTask?.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Проект</Label>
                <Input id="project" name="project" defaultValue={editingTask?.project} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Приоритет</Label>
                <Select name="priority" defaultValue={editingTask?.priority} required>
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
                <Input id="deadline" name="deadline" type="date" defaultValue={editingTask?.deadline} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" defaultValue={editingTask?.description} />
              </div>
              <Button type="submit" className="w-full">
                {editingTask ? "Сохранить" : "Добавить"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск задач..." className="pl-9" />
        </div>
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
            Выполненные
          </Button>
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className={cn(
              "shadow-md hover:shadow-lg transition-all",
              task.status === "completed" && "opacity-60"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => toggleTaskStatus(task.id)}
                    className="h-5 w-5 rounded border-border cursor-pointer"
                  />
                  <div className="flex-1">
                    <h3
                      className={cn(
                        "font-semibold text-lg",
                        task.status === "completed" && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {task.project}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{task.deadline}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingTaskId(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTask(task)}
                  >
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Проект</Label>
              <p className="text-sm mt-1">{selectedTask?.project}</p>
            </div>
            <div>
              <Label>Приоритет</Label>
              <p className="text-sm mt-1">
                {selectedTask?.priority === "high" ? "Высокий" : selectedTask?.priority === "medium" ? "Средний" : "Низкий"}
              </p>
            </div>
            <div>
              <Label>Дедлайн</Label>
              <p className="text-sm mt-1">{selectedTask?.deadline}</p>
            </div>
            <div>
              <Label>Описание</Label>
              <p className="text-sm mt-1">{selectedTask?.description || "Нет описания"}</p>
            </div>
            <div>
              <Label>Статус</Label>
              <p className="text-sm mt-1">{selectedTask?.status === "active" ? "Активна" : "Выполнена"}</p>
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
              Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.
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
