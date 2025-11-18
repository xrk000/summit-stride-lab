import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Task } from "@/hooks/useTasks";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TodayTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

export default function TodayTasksDialog({ open, onOpenChange, tasks, onToggleTask }: TodayTasksDialogProps) {
  const navigate = useNavigate();

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks?taskId=${taskId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Задачи на сегодня</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-4">
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет задач на сегодня</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors",
                    task.completed && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed || false}
                      onChange={() => onToggleTask(task.id)}
                      className="h-5 w-5 rounded border-border cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                    </div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
