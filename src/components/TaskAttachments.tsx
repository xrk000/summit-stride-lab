import { useEffect, useState, useRef } from "react";
import { Paperclip, Upload, Trash2, Download, FileText, Image, File, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAttachments, Attachment } from "@/hooks/useAttachments";
import { cn } from "@/lib/utils";

interface TaskAttachmentsProps {
    // taskId: null = режим создания (файлы ещё не загружены)
    // taskId: string = режим редактирования (файлы грузятся сразу)
    taskId: string | null;
    // pendingFiles используется только при создании задачи
    pendingFiles: File[];
    onPendingFilesChange: (files: File[]) => void;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileIcon(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
        return <Image className="h-4 w-4 text-blue-400" />;
    }
    if (["pdf", "doc", "docx", "txt", "xls", "xlsx"].includes(ext || "")) {
        return <FileText className="h-4 w-4 text-amber-400" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
}

export const TaskAttachments = ({
    taskId,
    pendingFiles,
    onPendingFilesChange,
}: TaskAttachmentsProps) => {
    const { uploadAttachment, deleteAttachment, getEntityAttachments, getAttachmentUrl } = useAttachments();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loadingAttachments, setLoadingAttachments] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Загружаем существующие вложения при редактировании
    useEffect(() => {
        if (!taskId) return;
        setLoadingAttachments(true);
        getEntityAttachments("task", taskId)
            .then(setAttachments)
            .finally(() => setLoadingAttachments(false));
    }, [taskId]);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const fileArray = Array.from(files);

        if (!taskId) {
            // Режим создания — накапливаем pending
            onPendingFilesChange([...pendingFiles, ...fileArray]);
            return;
        }

        // Режим редактирования — грузим сразу
        for (const file of fileArray) {
            const tempId = `uploading-${Date.now()}-${file.name}`;
            setUploadingId(tempId);
            try {
                await new Promise<void>((resolve, reject) => {
                    uploadAttachment(
                        { file, entityType: "task", entityId: taskId },
                        {
                            onSuccess: () => resolve(),
                            onError: (e) => reject(e),
                        }
                    );
                });
                // Обновляем список
                const updated = await getEntityAttachments("task", taskId);
                setAttachments(updated);
            } catch {
                // ошибка уже показана через toast в хуке
            } finally {
                setUploadingId(null);
            }
        }
    };

    const handleDelete = async (attachment: Attachment) => {
        setDeletingId(attachment.id);
        try {
            await new Promise<void>((resolve, reject) => {
                deleteAttachment(attachment, {
                    onSuccess: () => resolve(),
                    onError: (e) => reject(e),
                });
            });
            setAttachments(prev => prev.filter(a => a.id !== attachment.id));
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = async (attachment: Attachment) => {
        const url = await getAttachmentUrl(attachment.file_path);
        if (!url) return;
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.file_name;
        a.target = "_blank";
        a.click();
    };

    const removePending = (index: number) => {
        onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
    };

    // Drag & drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const hasContent = attachments.length > 0 || pendingFiles.length > 0;

    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Вложения
            </Label>

            {/* Зона перетаскивания */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                    isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Upload className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                    Нажмите или перетащите файлы сюда
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">до 50 МБ</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
            </div>

            {/* Список вложений / pending файлов */}
            {(loadingAttachments) ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка вложений...
                </div>
            ) : hasContent ? (
                <div className="space-y-1.5">
                    {/* Уже загруженные (при редактировании) */}
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center gap-2 p-2 rounded-md border bg-muted/20 group"
                        >
                            {getFileIcon(attachment.file_name)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{attachment.file_name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleDownload(attachment)}
                                    title="Скачать"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(attachment)}
                                    disabled={deletingId === attachment.id}
                                    title="Удалить"
                                >
                                    {deletingId === attachment.id
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Pending файлы (при создании) */}
                    {pendingFiles.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-2 p-2 rounded-md border border-dashed bg-primary/5 group"
                        >
                            {getFileIcon(file.name)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)} · будет загружен после создания
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removePending(index)}
                                title="Убрать"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}

                    {/* Индикатор загрузки при upload */}
                    {uploadingId && (
                        <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Загружаю файл...
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};
