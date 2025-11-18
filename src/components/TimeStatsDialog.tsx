import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckSquare, Calendar } from "lucide-react";

interface TimeStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasksCompleted: number;
  eventsToday: number;
}

export default function TimeStatsDialog({ open, onOpenChange, tasksCompleted, eventsToday }: TimeStatsDialogProps) {
  // Рассчитываем приблизительное продуктивное время на основе выполненных задач и событий
  const productiveHours = Math.round((tasksCompleted * 0.5 + eventsToday * 1) * 10) / 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Статистика времени на сегодня</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Продуктивное время</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{productiveHours}ч</div>
              <p className="text-xs text-muted-foreground mt-1">
                Оценка на основе выполненных задач и событий
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Задачи</CardTitle>
              <CheckSquare className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksCompleted}</div>
              <p className="text-xs text-muted-foreground mt-1">Выполнено сегодня</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">События</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventsToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Событий сегодня</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
