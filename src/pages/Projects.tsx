import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, FolderKanban, Clock, CheckCircle2, AlertCircle, Pencil, Trash2, Search, X, ArrowRight } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function Projects() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<any>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const { tasks, createTask } = useTasks();
  const { projectTasks, addTaskToProject, removeTaskFromProject } = useProjectTasks(selectedProjectForTasks?.id || undefined);

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingProject) {
      updateProject({
        id: editingProject.id,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        status: formData.get("status") as string,
      });
      
      // Обновляем задачи проекта
      handleUpdateProjectTasks(editingProject.id);
      
      setEditingProject(null);
    } else {
      createProject({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        status: formData.get("status") as string,
      });
    }
    setIsDialogOpen(false);
    setSelectedTaskIds([]);
    e.currentTarget.reset();
  };

  const handleUpdateProjectTasks = async (projectId: string) => {
    // Удаляем задачи, которые были убраны
    const currentTaskIds = projectTasks.map((t: any) => t.id);
    const tasksToRemove = currentTaskIds.filter((id: string) => !selectedTaskIds.includes(id));
    
    for (const taskId of tasksToRemove) {
      removeTaskFromProject({ projectId, taskId });
    }
    
    // Добавляем новые задачи
    const tasksToAdd = selectedTaskIds.filter(id => !currentTaskIds.includes(id));
    for (const taskId of tasksToAdd) {
      addTaskToProject({ projectId, taskId });
    }
  };

  const handleCreateNewTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    createTask({
      title: newTaskTitle,
      description: null,
      priority: null,
      completed: false,
      due_date: null,
      completed_at: null,
    });
    
    setNewTaskTitle("");
    setIsCreatingNewTask(false);
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setSelectedProjectForTasks(project);
    setIsDialogOpen(true);
  };

  const handleDeleteProject = (projectId: string) => {
    setDeletingProjectId(projectId);
  };

  const confirmDelete = () => {
    if (deletingProjectId !== null) {
      deleteProject(deletingProjectId);
      setDeletingProjectId(null);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const availableTasks = tasks.filter(task => !task.completed);

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Загрузка проектов...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Проекты</h1>
          <p className="text-muted-foreground mt-1">
            Всего проектов: {projects.length}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProject(null);
            setSelectedTaskIds([]);
            setSelectedProjectForTasks(null);
          } else if (editingProject) {
            // При открытии диалога редактирования загружаем задачи проекта
            setSelectedProjectForTasks(editingProject);
            // Устанавливаем выбранные задачи из текущего проекта
            if (projectTasks && projectTasks.length > 0) {
              setSelectedTaskIds(projectTasks.map((t: any) => t.id));
            }
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Новый проект
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? "Редактировать проект" : "Новый проект"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingProject?.name}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingProject?.description || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select name="status" defaultValue={editingProject?.status || "active"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Планирование</SelectItem>
                    <SelectItem value="active">Активный</SelectItem>
                    <SelectItem value="completed">Завершен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Задачи */}
              <div className="space-y-2">
                <Label>Задачи проекта</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {availableTasks.map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            setSelectedTaskIds(prev =>
                              checked
                                ? [...prev, task.id]
                                : prev.filter(id => id !== task.id)
                            );
                          }}
                        />
                        <label
                          htmlFor={`task-${task.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {task.title}
                        </label>
                      </div>
                    );
                  })}
                  
                  {/* Создание новой задачи */}
                  {isCreatingNewTask ? (
                    <div className="flex gap-2 pt-2 border-t">
                      <Input
                        placeholder="Название новой задачи"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateNewTask();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleCreateNewTask}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsCreatingNewTask(false);
                          setNewTaskTitle("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setIsCreatingNewTask(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Создать новую задачу
                    </Button>
                  )}
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                {editingProject ? "Сохранить" : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск проектов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              Проекты не найдены
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                    <Badge variant={
                      project.status === 'completed' ? 'default' :
                      project.status === 'active' ? 'secondary' :
                      'outline'
                    }>
                      {project.status === 'planning' ? 'Планирование' :
                       project.status === 'active' ? 'Активный' :
                       'Завершен'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditProject(project)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedProject(project);
                      setSelectedProjectForTasks(project);
                    }}
                  >
                    Подробнее
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Project Details Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Описание</Label>
              <p className="text-sm mt-1">{selectedProject?.description || "Нет описания"}</p>
            </div>
            <div>
              <Label>Статус</Label>
              <p className="text-sm mt-1">
                {selectedProject?.status === 'planning' ? 'Планирование' :
                 selectedProject?.status === 'active' ? 'Активный' :
                 'Завершен'}
              </p>
            </div>
            
            {/* Прикрепленные задачи */}
            <div>
              <Label>Прикрепленные задачи</Label>
              {selectedProject && (
                <div className="mt-2 space-y-2">
                  {(() => {
                    const tasks = projectTasks || [];
                    if (tasks.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">Нет прикрепленных задач</p>
                      );
                    }
                    return tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedProject(null);
                          navigate('/tasks');
                        }}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
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
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task to Project Dialog - УДАЛЕНО, функционал перенесен в основной диалог */}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProjectId} onOpenChange={() => setDeletingProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Проект будет удален навсегда.
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
