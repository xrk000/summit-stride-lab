import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  FolderKanban,
  Pencil,
  Trash2,
  Search,
  X,
  ListTodo,
  Info,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useTags } from "@/hooks/useTags";
import { useAllProjectTags } from "@/hooks/useAllProjectTags";
import { TaskTagSelector } from "@/components/TaskTagSelector";
import { TaskPickerModal } from "@/components/TaskPickerModal";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

// Вспомогательная функция для эмодзи проекта
const getProjectEmoji = (name: string) => {
  const first = name.trim().charAt(0).toLowerCase();
  if (/[а-яё]/.test(first)) return "📁";
  if (/[a-z]/.test(first)) return "📄";
  return "📌";
};

type SortOption = "name" | "createdAt" | "progress" | "status";
type StatusFilter = "all" | "planning" | "active" | "completed";

export default function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---------- Состояния ----------
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("createdAt");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Для выбора задач
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedProjectTagIds, setSelectedProjectTagIds] = useState<string[]>([]);
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // ---------- Данные ----------
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const { tasks, createTask } = useTasks();
  const { tags, addTagToEntity, removeTagFromEntity, getEntityTags } = useTags();
  const { data: projectTagsMap } = useAllProjectTags();

  // Прогресс проектов
  const { data: allProjectTasks } = useQuery({
    queryKey: ["allProjectTasksWithTasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks")
        .select("project_id, tasks(id, completed)");
      if (error) throw error;
      return data as { project_id: string; tasks: { id: string; completed: boolean } }[];
    },
  });

  const projectProgress = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    if (!allProjectTasks) return map;
    for (const pt of allProjectTasks) {
      const stats = map.get(pt.project_id) || { total: 0, completed: 0 };
      stats.total += 1;
      if (pt.tasks?.completed) stats.completed += 1;
      map.set(pt.project_id, stats);
    }
    return map;
  }, [allProjectTasks]);

  // Загрузка связей для редактирования
  const { projectTasks, addTaskToProject, removeTaskFromProject } = useProjectTasks(editingProject?.id || undefined);

  // Синхронизация выбранных задач при редактировании
  useEffect(() => {
    if (editingProject && projectTasks) {
      setSelectedTaskIds(projectTasks.map((t: any) => t.id));
    } else if (!editingProject) {
      setSelectedTaskIds([]);
    }
  }, [editingProject, projectTasks]);

  // Фильтрация и сортировка (без тегов)
  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    // Сортировка
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "createdAt":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "progress": {
          const progA = projectProgress.get(a.id)?.completed ?? 0;
          const progB = projectProgress.get(b.id)?.completed ?? 0;
          return progB - progA;
        }
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        default:
          return 0;
      }
    });
    return result;
  }, [projects, searchQuery, statusFilter, sortBy, projectProgress]);

  // ---------- Работа с проектом ----------
  const syncProjectTasks = async (projectId: string) => {
    const currentTaskIds = (projectTasks || []).map((t: any) => t.id);
    const toRemove = currentTaskIds.filter((id) => !selectedTaskIds.includes(id));
    const toAdd = selectedTaskIds.filter((id) => !currentTaskIds.includes(id));
    for (const id of toRemove) await removeTaskFromProject({ projectId, taskId: id });
    for (const id of toAdd) await addTaskToProject({ projectId, taskId: id });
  };

  const syncProjectTags = async (projectId: string) => {
    const currentTags = (await getEntityTags("project", projectId)) || [];
    const currentIds = currentTags.map((t: any) => t.id);
    const toRemove = currentIds.filter((id) => !selectedProjectTagIds.includes(id));
    const toAdd = selectedProjectTagIds.filter((id) => !currentIds.includes(id));
    for (const id of toRemove) removeTagFromEntity({ entityType: "project", entityId: projectId, tagId: id });
    for (const id of toAdd) addTagToEntity({ entityType: "project", entityId: projectId, tagId: id });
    queryClient.invalidateQueries({ queryKey: ["allProjectTags"] });
  };

  const resetDialogState = () => {
    setSelectedTaskIds([]);
    setSelectedProjectTagIds([]);
    setIsCreatingNewTask(false);
    setNewTaskTitle("");
  };

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;

    if (editingProject) {
      // Обновление
      updateProject({ id: editingProject.id, name, description, status });
      await syncProjectTasks(editingProject.id);
      await syncProjectTags(editingProject.id);
      setEditingProject(null);
    } else {
      // Создание
      try {
        const newProject = await createProject.mutateAsync({
          name,
          description,
          status,
        });
        if (newProject) {
          // Добавляем задачи
          for (const taskId of selectedTaskIds) {
            await addTaskToProject({ projectId: newProject.id, taskId });
          }
          // Добавляем теги
          for (const tagId of selectedProjectTagIds) {
            addTagToEntity({ entityType: "project", entityId: newProject.id, tagId });
          }
        }
      } catch (error) {
        console.error("Ошибка создания проекта", error);
      }
    }
    setIsDialogOpen(false);
    resetDialogState();
  };

  const handleEditProject = async (project: any) => {
    setEditingProject(project);
    // Загружаем теги (задачи загрузятся через useEffect)
    const entityTags = await getEntityTags("project", project.id);
    setSelectedProjectTagIds(entityTags.map((t: any) => t.id));
    setIsDialogOpen(true);
  };

  const handleDeleteProject = (projectId: string) => setDeletingProjectId(projectId);
  const confirmDelete = () => {
    if (deletingProjectId) deleteProject(deletingProjectId);
    setDeletingProjectId(null);
  };

  const handleCreateNewTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const newTask = await createTask.mutateAsync({
        title: newTaskTitle,
        description: null,
        priority: null,
        completed: false,
        due_date: null,
        completed_at: null,
      });
      if (newTask && editingProject) {
        await addTaskToProject({ projectId: editingProject.id, taskId: newTask.id });
        setSelectedTaskIds((prev) => [...prev, newTask.id]);
      } else if (newTask) {
        setSelectedTaskIds((prev) => [...prev, newTask.id]);
      }
    } catch (error) {
      console.error("Ошибка создания задачи", error);
    }
    setNewTaskTitle("");
    setIsCreatingNewTask(false);
  };

  if (isLoading)
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Загрузка проектов...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Проекты
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredProjects.length} из {projects.length} проектов
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingProject(null);
              resetDialogState();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="shadow-md gap-2">
              <Plus className="h-4 w-4" />
              Новый проект
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Редактировать проект" : "Создать проект"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProject} className="space-y-5">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input name="name" defaultValue={editingProject?.name} required />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea name="description" defaultValue={editingProject?.description || ""} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select name="status" defaultValue={editingProject?.status || "active"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Планирование</SelectItem>
                    <SelectItem value="active">Активный</SelectItem>
                    <SelectItem value="completed">Завершён</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Блок задач с кнопкой открытия пикера */}
              <div className="space-y-2">
                <Label>Задачи проекта</Label>
                <div className="border rounded-lg p-3">
                  {selectedTaskIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Нет выбранных задач</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTaskIds.map((taskId) => {
                        const task = tasks.find((t) => t.id === taskId);
                        return (
                          <Badge key={taskId} variant="secondary" className="gap-1 pr-1">
                            {task?.title || taskId}
                            <X
                              className="h-3 w-3 cursor-pointer ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsTaskPickerOpen(true)}
                  >
                    <Plus className="h-3 w-3 mr-2" /> Выбрать задачи
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Теги проекта</Label>
                <TaskTagSelector
                  selectedTagIds={selectedProjectTagIds}
                  onTagsChange={setSelectedProjectTagIds}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingProject ? "Сохранить изменения" : "Создать проект"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Поиск и фильтры (без тегов) */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск проектов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Сортировка:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">По дате создания</SelectItem>
                <SelectItem value="name">По названию</SelectItem>
                <SelectItem value="progress">По прогрессу</SelectItem>
                <SelectItem value="status">По статусу</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Статус:</span>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="planning">Планирование</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="completed">Завершённые</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Сетка проектов */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-30" />
              Проекты не найдены
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => {
            const stats = projectProgress.get(project.id) || { total: 0, completed: 0 };
            const percent = stats.total === 0 ? 0 : (stats.completed / stats.total) * 100;
            const projectTags = projectTagsMap?.get(project.id) || [];
            const emoji = getProjectEmoji(project.name);

            return (
              <Card
                key={project.id}
                className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl">{emoji}</span>
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditProject(project)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      variant={
                        project.status === "completed"
                          ? "default"
                          : project.status === "active"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {project.status === "planning"
                        ? "📐 Планирование"
                        : project.status === "active"
                          ? "🚀 Активный"
                          : "✅ Завершён"}
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1">
                      <ListTodo className="h-3 w-3" />
                      {stats.completed}/{stats.total} задач
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  )}

                  {stats.total > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span>Выполнение</span>
                        <span className="font-medium">{Math.round(percent)}%</span>
                      </div>
                      <Progress value={percent} className="h-1.5" />
                    </div>
                  )}

                  {projectTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {projectTags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {projectTags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{projectTags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1"
                    onClick={() => setSelectedProject(project)}
                  >
                    <Info className="h-3.5 w-3.5" />
                    Подробнее
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Диалог просмотра проекта (без вкладки Теги) */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{getProjectEmoji(selectedProject?.name || "")}</span>
              {selectedProject?.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="gap-2">
                <Info className="h-4 w-4" /> Инфо
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <ListTodo className="h-4 w-4" /> Задачи
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 pt-4">
              <div>
                <Label>Описание</Label>
                <p className="text-sm mt-1">{selectedProject?.description || "Нет описания"}</p>
              </div>
              <div>
                <Label>Статус</Label>
                <Badge variant="outline" className="mt-1">
                  {selectedProject?.status === "planning"
                    ? "Планирование"
                    : selectedProject?.status === "active"
                      ? "Активный"
                      : "Завершён"}
                </Badge>
              </div>
              <div>
                <Label>Дата создания</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedProject?.created_at && format(parseISO(selectedProject.created_at), "d MMMM yyyy", { locale: ru })}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="pt-4 space-y-3">
              {selectedProject && <ProjectTasksList projectId={selectedProject.id} navigate={navigate} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Модалка выбора задач */}
      <TaskPickerModal
        open={isTaskPickerOpen}
        onOpenChange={setIsTaskPickerOpen}
        selectedTaskIds={selectedTaskIds}
        onSelectedTasksChange={setSelectedTaskIds}
      />

      {/* Диалог удаления */}
      <AlertDialog open={!!deletingProjectId} onOpenChange={() => setDeletingProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Проект и все связи с задачами будут удалены. Задачи останутся в системе.
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

// Компонент списка задач проекта с переходом на страницу задач
function ProjectTasksList({ projectId, navigate }: { projectId: string; navigate: any }) {
  const { projectTasks } = useProjectTasks(projectId);
  const { toggleTask } = useTasks();

  const handleTaskClick = (taskId: string) => {
    navigate("/tasks", { state: { selectedTaskId: taskId } });
  };

  if (!projectTasks || projectTasks.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет прикреплённых задач</p>;
  }

  return (
    <div className="space-y-2">
      {projectTasks.map((task: any) => (
        <div
          key={task.id}
          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => handleTaskClick(task.id)}
        >
          <Checkbox
            checked={task.completed}
            onCheckedChange={(e) => {
              e.stopPropagation();
              toggleTask(task.id);
            }}
          />
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground truncate">{task.description}</p>
            )}
          </div>
          {task.priority && (
            <Badge
              variant={
                task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"
              }
              className="text-xs"
            >
              {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}