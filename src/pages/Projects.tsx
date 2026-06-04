import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, FolderKanban, Pencil, Trash2, Search, X, ListTodo, Info, CheckCheck, Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useTags } from "@/hooks/useTags";
import { useAllProjectTags } from "@/hooks/useAllProjectTags";
import { TaskTagSelector } from "@/components/TaskTagSelector";
import { TaskPickerModal } from "@/components/TaskPickerModal";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("createdAt");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedProjectTagIds, setSelectedProjectTagIds] = useState<string[]>([]);
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const { tasks, createTask } = useTasks();
  const { tags, addTagToEntity, removeTagFromEntity, getEntityTags } = useTags();
  const { data: projectTagsMap } = useAllProjectTags();

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

  const { projectTasks, addTaskToProject, removeTaskFromProject } = useProjectTasks(editingProject?.id || undefined);

  useEffect(() => {
    if (editingProject && projectTasks) {
      setSelectedTaskIds(projectTasks.map((t: any) => t.id));
    } else if (!editingProject) {
      setSelectedTaskIds([]);
    }
  }, [editingProject, projectTasks]);

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
      updateProject({ id: editingProject.id, name, description, status });
      await syncProjectTasks(editingProject.id);
      await syncProjectTags(editingProject.id);
      setEditingProject(null);
    } else {
      try {
        const newProject = await createProject.mutateAsync({ name, description, status });
        if (newProject) {
          for (const taskId of selectedTaskIds) {
            await addTaskToProject({ projectId: newProject.id, taskId });
          }
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

  const activeProjects = projects.filter(p => p.status === "active").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;

  const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `Все (${projects.length})` },
    { value: "planning", label: "Планирование" },
    { value: "active", label: "Активные" },
    { value: "completed", label: "Завершённые" },
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Загрузка проектов...</span>
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
              <FolderKanban className="h-4 w-4" />
              Управление проектами
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white">Проекты</h1>
            <p className="text-white/40 text-xs mt-2">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: ru })}
            </p>
          </div>

          {/* Статистика */}
          <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
            {[
              { label: "Всего", value: projects.length, icon: FolderKanban, color: "text-blue-400" },
              { label: "Активных", value: activeProjects, icon: ListTodo, color: "text-green-400" },
              { label: "Завершено", value: completedProjects, icon: CheckCheck, color: "text-emerald-400" },
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
              Новый проект
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ФИЛЬТРЫ
      ═══════════════════════════════════════════ */}
      <div className="flex flex-col gap-3">
        {/* Строка поиска + сортировка */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск проектов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/40 border-border/60"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground hidden sm:inline">Сортировка:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[170px] bg-muted/40 border-border/60">
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
        </div>

        {/* Фильтр по статусу */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border/60 w-fit">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                statusFilter === f.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          СЕТКА ПРОЕКТОВ
      ═══════════════════════════════════════════ */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div>
            <p className="font-semibold">
              {searchQuery || statusFilter !== "all" ? "Проекты не найдены" : "Проектов пока нет"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || statusFilter !== "all" ? "Попробуйте изменить фильтры" : "Создайте свой первый проект"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const stats = projectProgress.get(project.id) || { total: 0, completed: 0 };
            const percent = stats.total === 0 ? 0 : (stats.completed / stats.total) * 100;
            const projectTags = projectTagsMap?.get(project.id) || [];
            const emoji = getProjectEmoji(project.name);

            return (
              <div
                key={project.id}
                className={cn(
                  "group flex flex-col p-5 rounded-xl border border-border/50 bg-card transition-all hover:shadow-sm hover:border-border",
                  project.status === "active" && "border-l-2 border-l-green-500",
                  project.status === "planning" && "border-l-2 border-l-amber-500",
                  project.status === "completed" && "border-l-2 border-l-blue-500"
                )}
              >
                {/* Заголовок карточки */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl flex-shrink-0">{emoji}</span>
                    <h3 className="font-semibold text-base truncate">{project.name}</h3>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditProject(project)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteProject(project.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Статус + задачи */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" className="text-xs">
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

                {/* Описание */}
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                )}

                {/* Прогресс */}
                {stats.total > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Выполнение</span>
                      <span className="font-semibold">{Math.round(percent)}%</span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>
                )}

                {/* Теги */}
                {projectTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {projectTags.slice(0, 3).map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs px-1.5">
                        {tag.name}
                      </Badge>
                    ))}
                    {projectTags.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{projectTags.length - 3}</Badge>
                    )}
                  </div>
                )}

                {/* Кнопка подробнее */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 mt-auto"
                  onClick={() => setSelectedProject(project)}
                >
                  <Info className="h-3.5 w-3.5" />
                  Подробнее
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Диалог просмотра проекта */}
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
                  {selectedProject?.created_at &&
                    format(parseISO(selectedProject.created_at), "d MMMM yyyy", { locale: ru })}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="pt-4 space-y-3">
              {selectedProject && <ProjectTasksList projectId={selectedProject.id} navigate={navigate} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Диалог создания / редактирования */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingProject(null); resetDialogState(); }
        }}
      >
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Планирование</SelectItem>
                  <SelectItem value="active">Активный</SelectItem>
                  <SelectItem value="completed">Завершён</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Задачи проекта</Label>
              <div className="border border-border/60 rounded-xl p-3">
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
                  type="button" variant="outline" size="sm" className="w-full"
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

      {/* Модалка выбора задач */}
      <TaskPickerModal
        open={isTaskPickerOpen}
        onOpenChange={setIsTaskPickerOpen}
        selectedTaskIds={selectedTaskIds}
        onSelectedTasksChange={setSelectedTaskIds}
      />

      {/* Подтверждение удаления */}
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

function ProjectTasksList({ projectId, navigate }: { projectId: string; navigate: any }) {
  const { projectTasks } = useProjectTasks(projectId);
  const { toggleTask } = useTasks();

  const handleTaskClick = (taskId: string) => {
    navigate("/tasks", { state: { selectedTaskId: taskId } });
  };

  if (!projectTasks || projectTasks.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <ListTodo className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">Нет прикреплённых задач</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projectTasks.map((task: any) => (
        <div
          key={task.id}
          className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
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
              variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}
              className="text-xs shrink-0"
            >
              {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
