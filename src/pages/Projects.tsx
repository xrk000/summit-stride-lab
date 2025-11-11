import { useState } from "react";
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
import { Plus, FolderKanban, Clock, CheckCircle2, AlertCircle, Pencil, Trash2, Search } from "lucide-react";

type Project = {
  id: number;
  name: string;
  description: string;
  status: "active" | "planning" | "completed";
  progress: number;
  totalTasks: number;
  completedTasks: number;
  deadline: string;
  timeSpent: string;
  priority: "high" | "medium" | "low";
  tags: string[];
  taskIds?: number[];
};

type Task = {
  id: number;
  title: string;
  priority: "high" | "medium" | "low";
  status: "active" | "completed";
  deadline: string;
};

export default function Projects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<Project | null>(null);

  // Моковые существующие задачи
  const [allTasks] = useState<Task[]>([
    { id: 1, title: "Написать отчет", priority: "high", status: "active", deadline: "2024-11-15" },
    { id: 2, title: "Обновить документацию", priority: "medium", status: "active", deadline: "2024-11-16" },
    { id: 3, title: "Код ревью", priority: "low", status: "completed", deadline: "2024-11-10" },
    { id: 4, title: "Купить продукты", priority: "medium", status: "active", deadline: "2024-11-15" },
  ]);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: "Дипломная работа",
      description: "Система управления продуктивностью",
      status: "active",
      progress: 45,
      totalTasks: 12,
      completedTasks: 5,
      deadline: "15 декабря 2024",
      timeSpent: "24ч 30м",
      priority: "high",
      tags: ["учеба", "разработка"],
      taskIds: [],
    },
    {
      id: 2,
      name: "Проект А",
      description: "Веб-приложение для клиента",
      status: "active",
      progress: 78,
      totalTasks: 18,
      completedTasks: 14,
      deadline: "20 ноября 2024",
      timeSpent: "42ч 15м",
      priority: "high",
      tags: ["работа", "frontend"],
      taskIds: [2],
    },
    {
      id: 3,
      name: "Личный сайт",
      description: "Портфолио разработчика",
      status: "planning",
      progress: 12,
      totalTasks: 8,
      completedTasks: 1,
      deadline: "1 января 2025",
      timeSpent: "5ч 45м",
      priority: "low",
      tags: ["личное", "portfolio"],
      taskIds: [],
    },
  ]);

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tags = (formData.get("tags") as string).split(",").map(t => t.trim()).filter(Boolean);
    
    if (editingProject) {
      setProjects(projects.map(project =>
        project.id === editingProject.id
          ? {
              ...project,
              name: formData.get("name") as string,
              description: formData.get("description") as string,
              deadline: formData.get("deadline") as string,
              priority: formData.get("priority") as "high" | "medium" | "low",
              tags,
            }
          : project
      ));
      setEditingProject(null);
    } else {
      const newProject: Project = {
        id: Math.max(0, ...projects.map(p => p.id)) + 1,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        status: "planning",
        progress: 0,
        totalTasks: 0,
        completedTasks: 0,
        deadline: formData.get("deadline") as string,
        timeSpent: "0ч 0м",
        priority: formData.get("priority") as "high" | "medium" | "low",
        tags,
      };
      setProjects([...projects, newProject]);
    }
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleDeleteProject = (projectId: number) => {
    setProjects(projects.filter(project => project.id !== projectId));
    setDeletingProjectId(null);
  };

  const handleAddExistingTask = (taskId: number) => {
    if (selectedProjectForTasks) {
      setProjects(projects.map(project => 
        project.id === selectedProjectForTasks.id
          ? { ...project, taskIds: [...(project.taskIds || []), taskId] }
          : project
      ));
      setIsAddTaskDialogOpen(false);
    }
  };

  const handleCreateNewTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // В реальном приложении здесь создавалась бы новая задача
    setIsCreateTaskDialogOpen(false);
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const getProjectTasks = (project: Project) => {
    return allTasks.filter(task => project.taskIds?.includes(task.id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Проекты</h1>
          <p className="text-muted-foreground mt-1">Управляйте крупными задачами</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProject(null);
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
                <Input id="name" name="name" defaultValue={editingProject?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" defaultValue={editingProject?.description} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Приоритет</Label>
                <Select name="priority" defaultValue={editingProject?.priority} required>
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
                <Input id="deadline" name="deadline" type="date" defaultValue={editingProject?.deadline} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Теги (через запятую)</Label>
                <Input 
                  id="tags" 
                  name="tags" 
                  defaultValue={editingProject?.tags.join(", ")}
                  placeholder="работа, разработка" 
                />
              </div>
              <Button type="submit" className="w-full">
                {editingProject ? "Сохранить" : "Создать проект"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Поиск проектов..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего проектов</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Активных</p>
                <p className="text-2xl font-bold">
                  {projects.filter((p) => p.status === "active").length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Срочных</p>
                <p className="text-2xl font-bold">
                  {projects.filter((p) => p.priority === "high").length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Время</p>
                <p className="text-2xl font-bold">72ч</p>
              </div>
              <Clock className="h-8 w-8 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <Badge
                      variant={
                        project.status === "active"
                          ? "default"
                          : project.status === "completed"
                          ? "outline"
                          : "secondary"
                      }
                      className={
                        project.status === "active"
                          ? "bg-success text-success-foreground"
                          : ""
                      }
                    >
                      {project.status === "active"
                        ? "Активный"
                        : project.status === "completed"
                        ? "Завершен"
                        : "Планирование"}
                    </Badge>
                    {project.priority === "high" && (
                      <Badge variant="destructive">Высокий приоритет</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Прогресс</span>
                  <span className="font-medium">
                    {project.completedTasks} / {project.totalTasks} задач
                  </span>
                </div>
                <Progress value={project.progress} className="h-2" />
                <div className="text-right text-sm font-medium text-primary">
                  {project.progress}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Затрачено времени</p>
                    <p className="font-medium">{project.timeSpent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Дедлайн</p>
                    <p className="font-medium">{project.deadline}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedProjectForTasks(project);
                    setIsAddTaskDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить задачу
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedProject(project)}
                >
                  Просмотр
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEditProject(project)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeletingProjectId(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Detail Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{selectedProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Описание</Label>
              <p className="text-sm mt-2">{selectedProject?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Статус</Label>
                <p className="text-sm mt-1">
                  {selectedProject?.status === "active" ? "Активный" : 
                   selectedProject?.status === "completed" ? "Завершен" : "Планирование"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Приоритет</Label>
                <p className="text-sm mt-1">
                  {selectedProject?.priority === "high" ? "Высокий" : 
                   selectedProject?.priority === "medium" ? "Средний" : "Низкий"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Дедлайн</Label>
                <p className="text-sm mt-1">{selectedProject?.deadline}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Затрачено времени</Label>
                <p className="text-sm mt-1">{selectedProject?.timeSpent}</p>
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold">Прогресс</Label>
              <div className="space-y-2 mt-2">
                <Progress value={selectedProject?.progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {selectedProject?.completedTasks} / {selectedProject?.totalTasks} задач ({selectedProject?.progress}%)
                </p>
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold">Теги</Label>
              <div className="flex gap-2 mt-2">
                {selectedProject?.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Задачи в проекте</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProjectForTasks(selectedProject);
                    setSelectedProject(null);
                    setIsAddTaskDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {selectedProject && getProjectTasks(selectedProject).length > 0 ? (
                  getProjectTasks(selectedProject).map((task) => (
                    <div 
                      key={task.id} 
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        // Открываем диалог с деталями задачи
                        const taskDetails = allTasks.find(t => t.id === task.id);
                        if (taskDetails) {
                          setSelectedTask(taskDetails);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{task.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Дедлайн: {task.deadline}</span>
                            <Badge 
                              variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"} 
                              className="text-xs h-5"
                            >
                              {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={task.status === "completed" ? "outline" : "default"} className="text-xs">
                          {task.status === "completed" ? "Выполнена" : "Активна"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Задач нет</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog - показываем детали задачи из проекта */}
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
            <div>
              <Label>Дедлайн</Label>
              <p className="text-sm mt-1">{selectedTask?.deadline}</p>
            </div>
            <div>
              <Label>Статус</Label>
              <p className="text-sm mt-1">{selectedTask?.status === "active" ? "Активна" : "Выполнена"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Existing Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить задачу в проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsAddTaskDialogOpen(false);
                  setIsCreateTaskDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Создать новую задачу
              </Button>
            </div>
            <div className="border-t pt-4">
              <Label>Выберите существующую задачу</Label>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {allTasks
                  .filter(task => !selectedProjectForTasks?.taskIds?.includes(task.id))
                  .map((task) => (
                    <div 
                      key={task.id} 
                      className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleAddExistingTask(task.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">Дедлайн: {task.deadline}</p>
                        </div>
                        <Badge variant={task.priority === "high" ? "destructive" : "outline"} className="text-xs">
                          {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Task Dialog */}
      <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать задачу в проекте "{selectedProjectForTasks?.name}"</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateNewTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Название задачи</Label>
              <Input id="taskTitle" name="taskTitle" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskPriority">Приоритет</Label>
              <Select name="taskPriority" defaultValue="medium" required>
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
              <Label htmlFor="taskDeadline">Дедлайн</Label>
              <Input id="taskDeadline" name="taskDeadline" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Описание</Label>
              <Textarea id="taskDescription" name="taskDescription" />
            </div>
            <Button type="submit" className="w-full">
              Создать задачу
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProjectId} onOpenChange={() => setDeletingProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот проект? Все связанные задачи и данные будут утеряны. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingProjectId && handleDeleteProject(deletingProjectId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
