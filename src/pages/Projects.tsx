import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, FolderKanban, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function Projects() {
  const projects = [
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
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Проекты</h1>
          <p className="text-muted-foreground mt-1">Управляйте крупными задачами</p>
        </div>
        <Button className="bg-primary">
          <Plus className="h-4 w-4 mr-2" />
          Новый проект
        </Button>
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
        {projects.map((project) => (
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
                <Button variant="outline" className="flex-1">
                  Просмотр задач
                </Button>
                <Button variant="outline" className="flex-1">
                  Статистика
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
