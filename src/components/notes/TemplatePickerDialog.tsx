import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNoteTemplates, type NoteTemplate } from "@/hooks/useNoteTemplates";
import { Loader2, FileText } from "lucide-react";
import { useState } from "react";

interface TemplatePickerDialogProps {
    open: boolean;
    onClose: () => void;
    onSelectTemplate: (data: { title: string; content: string }) => void;
}

export function TemplatePickerDialog({ open, onClose, onSelectTemplate }: TemplatePickerDialogProps) {
    const { templates, isLoading } = useNoteTemplates();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleSelect = (template: NoteTemplate) => {
        // Подстановка переменных
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const replaceVars = (str: string) =>
            str.replace(/{{date}}/g, dateStr).replace(/{{time}}/g, timeStr);

        const title = replaceVars(template.title);
        const content = template.content ? replaceVars(template.content) : "";

        onSelectTemplate({ title, content });
        setSelectedId(null);
        onClose();
    };

    const handleCreateFromScratch = () => {
        onSelectTemplate({ title: "", content: "" });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Выберите шаблон</DialogTitle>
                    <DialogDescription>
                        Используйте готовый шаблон или начните с пустой заметки
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-2">
                            {templates.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    У вас пока нет шаблонов. Сохраните заметку как шаблон, чтобы она появилась здесь.
                                </p>
                            ) : (
                                templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleSelect(template)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${selectedId === template.id
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50 hover:bg-accent/50"
                                            }`}
                                        onMouseEnter={() => setSelectedId(template.id)}
                                        onMouseLeave={() => setSelectedId(null)}
                                    >
                                        <div className="font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {template.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 truncate">
                                            {template.title}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                )}

                <div className="flex justify-between gap-2 mt-4">
                    <Button variant="outline" onClick={handleCreateFromScratch}>
                        Пустая заметка
                    </Button>
                    <Button onClick={() => onClose()}>Отмена</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}