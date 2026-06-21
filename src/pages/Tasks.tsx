import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Plus, Search, ChevronRight, Pencil, Trash2, Filter, X,
  Paperclip, Download, FileText, Image, File, Loader2,
  CheckSquare, CheckCheck, AlertTriangle, Clock, ListTodo
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTasks, Task } from "@/hooks/useTasks";
import { useTaskTags } from "@/hooks/useTaskTags";
import { useAllTaskTags } from "@/hooks/useAllTaskTags";
import { useProjects } from "@/hooks/useProjects";
import { useAllTaskProjects } from "@/hooks/useAllTaskProjects";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAllTaskEvents } from "@/hooks/useAllTaskEvents";
import { FolderKanban, CalendarDays } from "lucide-react";
import { TaskTagSelector } from "@/components/TaskTagSelector";
import { TaskAttachments } from "@/components/TaskAttachments";
import { useAttachments, Attachment } from "@/hooks/useAttachments";
import { format, parseISO, isPast, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import { useLocation, useNavigate } from "react-router-dom";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
    return <Image className="h-4 w-4 text-blue-400 shrink-0" />;
  }
  if (["pdf", "doc", "docx", "txt", "xls", "xlsx"].includes(ext || "")) {
    return <FileText className="h-4 w-4 text-amber-400 shrink-0" />;
  }
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function AttachmentViewList({ taskId }: { taskId: string }) {
  const { getEntityAttachments, getAttachmentUrl } = useAttachments();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    getEntityAttachments("task", taskId)
      .then(setAttachments)
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleDownload = async (attachment: Attachment) => {
    setDownloadingId(attachment.id);
    try {
      const url = await getAttachmentUrl(attachment.file_path);
      if (!url) return;
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      a.target = "_blank";
      a.click();
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Загрузка...
      </div>
    );
  }

  if (attachments.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет вложений</p>;
  }

  return (
    <div className="space-y-1.5">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/20">
          {getFileIcon(attachment.file_name)}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{attachment.file_name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
          </div>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 shrink-0"
            onClick={() => handleDownload(attachment)}
            disabled={downloadingId === attachment.id}
            title="Скачать"
          >
            {downloadingId === attachment.id
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function Tasks() {
  const navigate = useNavigate();
  const location = useLocation();

  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventSearch, setEventSearch] = useState("");
  const [isEventComboOpen, setIsEventComboOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const { tasks, isLoading, createTask, createTaskAsync, updateTask, deleteTask, toggleTask } = useTasks();
  const { uploadAttachment } = useAttachments();
  const { data: editingTaskTags } = useTaskTags(editingTask?.id || null);
  const { data: taskTagsMap } = useAllTaskTags();
  const { projects } = useProjects();
  const { data: taskProjectsMap } = useAllTaskProjects();
  const { events } = useCalendarEvents();
  const { data: taskEventsMap } = useAllTaskEvents();

  useEffect(() => {
    const state = location.state as { selectedTaskId?: string };
    if (state?.selectedTaskId) {
      const task = tasks.find(t => t.id === state.selectedTaskId);
      if (task) setSelectedTask(task);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, tasks, navigate, location.pathname]);

  useEffect(() => {
    if (editingTask && editingTaskTags) {
      setSelectedTagIds(editingTaskTags.map(tag => tag.id));
    } else {
      setSelectedTagIds([]);
    }
  }, [editingTask, editingTaskTags]);

  useEffect(() => {
    if (editingTask && taskProjectsMap) {
      setSelectedProjectId(taskProjectsMap.get(editingTask.id) ?? null);
    } else if (!editingTask) {
      setSelectedProjectId(null);
    }
  }, [editingTask, taskProjectsMap]);

  useEffect(() => {
    if (editingTask && taskEventsMap) {
      setSelectedEventId(taskEventsMap.get(editingTask.id) ?? null);
    } else if (!editingTask) {
      setSelectedEventId(null);
    }
  }, [editingTask, taskEventsMap]);

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingTask) return;
    setIsSubmittingTask(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (editingTask) {
        updateTask({
          id: editingTask.id,
          title: formData.get("title") as string,
          priority: formData.get("priority") as string,
          due_date: formData.get("deadline") as string,
          description: formData.get("description") as string,
          tagIds: selectedTagIds,
          projectId: selectedProjectId,
          eventId: selectedEventId,
        });
        setEditingTask(null);
      } else {
        try {
          const newTask = await createTaskAsync({
            title: formData.get("title") as string,
            priority: formData.get("priority") as string,
            due_date: formData.get("deadline") as string,
            description: formData.get("description") as string,
            completed: false,
            completed_at: null,
            tagIds: selectedTagIds,
            projectId: selectedProjectId,
            eventId: selectedEventId,
          });
          if (pendingFiles.length > 0 && newTask) {
            for (const file of pendingFiles) {
              uploadAttachment({ file, entityType: "task", entityId: newTask.id });
            }
          }
        } catch {
          return;
        }
      }
      setIsDialogOpen(false);
      setSelectedTagIds([]);
      setSelectedProjectId(null);
      setSelectedEventId(null);
      setPendingFiles([]);
      e.currentTarget.reset();
    } finally {
      setIsSubmittingTask(false);
    }
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

    let matchesTags = false;
    if (taskTagsMap && searchQuery) {
      const taskTags = taskTagsMap.get(task.id) || [];
      matchesTags = taskTags.some(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const matchesDate = !filterDate || (task.due_date &&
      format(parseISO(task.due_date), "yyyy-MM-dd") === format(filterDate, "yyyy-MM-dd"));
    return matchesFilter && (matchesSearch || matchesTags) && matchesDate;
  });

  const activeTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const overdueTasks = tasks.filter(t =>
    !t.completed && t.due_date &&
    isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
  ).length;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Загрузка задач...</span>
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
              <CheckSquare className="h-4 w-4" />
              Управление задачами
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">Задачи</h1>
            <p className="text-white/40 text-xs mt-2">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: ru })}
            </p>
          </div>

          {/* Статистика */}
          <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
            {[
              { label: "Всего", value: tasks.length, icon: ListTodo, color: "text-blue-400" },
              { label: "Активных", value: activeTasks, icon: Clock, color: "text-amber-400" },
              { label: "Выполнено", value: completedTasks, icon: CheckCheck, color: "text-green-400" },
              { label: "Просрочено", value: overdueTasks, icon: AlertTriangle, color: "text-red-400" },
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
              Новая задача
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ФИЛЬТРЫ
      ═══════════════════════════════════════════ */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск задач и тегов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/40 border-border/60"
          />
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="bg-muted/40 border-border/60 relative shrink-0">
              <Filter className="h-4 w-4" />
              {filterDate && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Фильтр по дате</h4>
                {filterDate && (
                  <Button variant="ghost" size="sm" onClick={() => setFilterDate(undefined)}>
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

        <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border/60 shrink-0">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                filter === f
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all"
                ? `Все (${tasks.length})`
                : f === "active"
                  ? `Активные (${activeTasks})`
                  : `Завершённые (${completedTasks})`}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          СПИСОК ЗАДАЧ
      ═══════════════════════════════════════════ */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-semibold">Задачи не найдены</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || filterDate ? "Попробуйте изменить фильтры" : "Создайте свою первую задачу"}
              </p>
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue = !task.completed && task.due_date &&
              isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
            const isDueToday = !task.completed && task.due_date && isToday(parseISO(task.due_date));

            return (
              <div
                key={task.id}
                className={cn(
                  "group flex items-start gap-3 p-4 rounded-xl border transition-all",
                  task.completed
                    ? "opacity-50 border-border/40 bg-muted/20"
                    : cn(
                      "hover:shadow-sm",
                      task.priority === "high" && "bg-red-500/5 border-border/50 border-l-2 border-l-red-500",
                      task.priority === "medium" && "bg-amber-500/5 border-border/50 border-l-2 border-l-amber-500",
                      task.priority === "low" && "bg-green-500/5 border-border/50 border-l-2 border-l-green-500",
                      !task.priority && "border-border/50 bg-card"
                    )
                )}
              >
                {/* Чекбокс */}
                <input
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={() => toggleTask(task.id)}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded"
                />

                {/* Контент */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      "font-semibold text-sm truncate flex-1 min-w-0",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                    {task.priority && (
                      <Badge
                        variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}
                        className="text-xs shrink-0 h-5 px-1.5"
                      >
                        {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                      </Badge>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 break-all">{task.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {task.due_date && (
                      <span className={cn(
                        "text-xs flex items-center gap-1",
                        isOverdue ? "text-red-500" : isDueToday ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        <Clock className="h-3 w-3" />
                        {isOverdue ? "Просрочено: " : isDueToday ? "Сегодня: " : ""}
                        {format(parseISO(task.due_date), "d MMM yyyy", { locale: ru })}
                      </span>
                    )}
                    {(() => {
                      const evId = taskEventsMap?.get(task.id);
                      const ev = evId ? events.find(e => e.id === evId) : null;
                      return ev ? (
                        <span className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400 min-w-0">
                          <CalendarDays className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {format(parseISO(ev.date), "d MMM", { locale: ru })}
                            {ev.time ? ` · ${ev.time}` : ""} · {ev.title}
                          </span>
                        </span>
                      ) : null;
                    })()}
                    {taskTagsMap?.get(task.id)?.map(tag => (
                      <Badge key={tag.id} variant="outline" className="text-xs px-1.5 h-5 py-0">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditTask(task)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedTask(task)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Диалог создания / редактирования */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) { setEditingTask(null); setPendingFiles([]); setSelectedProjectId(null); setSelectedEventId(null); setEventSearch(""); setIsEventComboOpen(false); }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" name="title" defaultValue={editingTask?.title} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select name="priority" defaultValue={editingTask?.priority || "medium"}>
                <SelectTrigger><SelectValue placeholder="Выберите приоритет" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="low">Низкий</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Дедлайн</Label>
              <Input id="deadline" name="deadline" type="date" defaultValue={editingTask?.due_date || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" defaultValue={editingTask?.description || ""} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                Проект
              </Label>
              <Select
                value={selectedProjectId ?? "none"}
                onValueChange={v => setSelectedProjectId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без проекта" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Без проекта</span>
                  </SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Связанное событие
              </Label>
              <Popover open={isEventComboOpen} onOpenChange={setIsEventComboOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full flex items-center justify-between gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm ring-offset-background",
                      "hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      !selectedEventId && "text-muted-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {selectedEventId ? (() => {
                        const ev = events.find(e => e.id === selectedEventId);
                        return ev ? (
                          <>
                            <span className="text-muted-foreground text-xs flex-shrink-0">
                              {format(parseISO(ev.date), "d MMM", { locale: ru })}
                              {ev.time ? ` · ${ev.time}` : ""}
                            </span>
                            <span className="truncate">{ev.title}</span>
                          </>
                        ) : "Без события";
                      })() : "Без события"}
                    </span>
                    <Search className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="p-2 border-b border-border/50">
                    <Input
                      placeholder="Поиск события..."
                      value={eventSearch}
                      onChange={e => setEventSearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto p-1">
                    <button
                      type="button"
                      onClick={() => { setSelectedEventId(null); setIsEventComboOpen(false); setEventSearch(""); }}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors",
                        !selectedEventId ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60"
                      )}
                    >
                      Без события
                    </button>
                    {[...events]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .filter(ev => ev.title.toLowerCase().includes(eventSearch.toLowerCase()))
                      .map(ev => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => { setSelectedEventId(ev.id); setIsEventComboOpen(false); setEventSearch(""); }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-left transition-colors",
                            selectedEventId === ev.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground"
                          )}
                        >
                          <span className="text-muted-foreground text-xs flex-shrink-0">
                            {format(parseISO(ev.date), "d MMM", { locale: ru })}
                            {ev.time ? ` · ${ev.time}` : ""}
                          </span>
                          <span className="flex-1 truncate">{ev.title}</span>
                        </button>
                      ))}
                    {events.filter(ev => ev.title.toLowerCase().includes(eventSearch.toLowerCase())).length === 0 && eventSearch && (
                      <p className="text-xs text-muted-foreground text-center py-3">Нет совпадений</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <TaskTagSelector selectedTagIds={selectedTagIds} onTagsChange={setSelectedTagIds} />
            <TaskAttachments taskId={editingTask?.id || null} pendingFiles={pendingFiles} onPendingFilesChange={setPendingFiles} />
            <Button type="submit" className="w-full" disabled={isSubmittingTask}>{editingTask ? "Сохранить" : "Создать"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Детали задачи */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="break-all pr-6">{selectedTask?.title}</DialogTitle>
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
              <div className="mt-2 text-sm whitespace-pre-wrap break-words bg-muted/30 rounded-xl p-4 overflow-hidden leading-relaxed">
                {selectedTask?.description || "Нет описания"}
              </div>
            </div>
            <div>
              <Label>Статус</Label>
              <p className="text-sm mt-1">{selectedTask?.completed ? "Завершена" : "Активна"}</p>
            </div>
            {(() => {
              const evId = selectedTask && taskEventsMap?.get(selectedTask.id);
              const ev = evId ? events.find(e => e.id === evId) : null;
              return ev ? (
                <div>
                  <Label className="flex items-center gap-1.5 mb-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Связанное событие
                  </Label>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(ev.date), "d MMMM yyyy", { locale: ru })}
                        {ev.time ? ` · ${ev.time}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
            <div>
              <Label className="flex items-center gap-1.5 mb-2">
                <Paperclip className="h-3.5 w-3.5" />
                Вложения
              </Label>
              {selectedTask && <AttachmentViewList taskId={selectedTask.id} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
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
