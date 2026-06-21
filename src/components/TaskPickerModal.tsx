import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useAllTaskTags } from "@/hooks/useAllTaskTags";

interface TaskPickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTaskIds: string[];
    onSelectedTasksChange: (taskIds: string[]) => void;
}

export function TaskPickerModal({
    open,
    onOpenChange,
    selectedTaskIds,
    onSelectedTasksChange,
}: TaskPickerModalProps) {
    const [search, setSearch] = useState("");
    const { tasks, isLoading } = useTasks();
    const { data: taskTagsMap } = useAllTaskTags();

    const filteredTasks = tasks.filter((task) => {
        if (task.completed) return false;
        const matchesSearch =
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            (task.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchesTags =
            taskTagsMap
                ?.get(task.id)
                ?.some((tag) => tag.name.toLowerCase().includes(search.toLowerCase())) ?? false;
        return matchesSearch || matchesTags;
    });

    const toggleTask = (taskId: string) => {
        if (selectedTaskIds.includes(taskId)) {
            onSelectedTasksChange(selectedTaskIds.filter((id) => id !== taskId));
        } else {
            onSelectedTasksChange([...selectedTaskIds, taskId]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Выберите задачи для проекта</DialogTitle>
                </DialogHeader>
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск задач и тегов..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-2">
                    {isLoading && <p className="text-sm text-muted-foreground">Загрузка...</p>}
                    {!isLoading && filteredTasks.length === 0 && (
                        <p className="text-sm text-muted-foreground">Нет доступных задач</p>
                    )}
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleTask(task.id)}
                        >
                            <Checkbox
                                checked={selectedTaskIds.includes(task.id)}
                                className="pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{task.title}</p>
                                {task.description && (
                                    <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                                )}
                                {taskTagsMap?.get(task.id) && taskTagsMap.get(task.id)!.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                        {taskTagsMap.get(task.id)!.slice(0, 2).map((tag) => (
                                            <Badge key={tag.id} variant="outline" className="text-xs">
                                                {tag.name}
                                            </Badge>
                                        ))}
                                        {taskTagsMap.get(task.id)!.length > 2 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{taskTagsMap.get(task.id)!.length - 2}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                            {task.priority && (
                                <Badge
                                    variant={
                                        task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"
                                    }
                                    className="text-xs shrink-0"
                                >
                                    {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Отмена
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>Готово</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}