import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WeekEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: CalendarEvent[];
}

export default function WeekEventsDialog({ open, onOpenChange, events }: WeekEventsDialogProps) {
  const navigate = useNavigate();

  const handleEventClick = (eventId: string) => {
    navigate(`/calendar?eventId=${eventId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>События этой недели</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет событий на эту неделю</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('ru-RU', { weekday: 'long', month: 'long', day: 'numeric' })}
                      {event.time && `, ${event.time}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
