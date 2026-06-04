import { useRef, useState, useEffect } from "react";
import { Upload, File, X, Download, FileText, Image, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttachments, Attachment } from "@/hooks/useAttachments";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  entityType: 'task' | 'note';
  // null = режим создания (pending), string = режим редактирования/просмотра
  entityId: string | null;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
  // readOnly = только просмотр и скачивание (для view-диалога)
  readOnly?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || ""))
    return <Image className="h-4 w-4 text-blue-400 shrink-0" />;
  if (["pdf", "doc", "docx", "txt", "xls", "xlsx"].includes(ext || ""))
    return <FileText className="h-4 w-4 text-amber-400 shrink-0" />;
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export const FileUpload = ({
  entityType,
  entityId,
  pendingFiles = [],
  onPendingFilesChange,
  readOnly = false,
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAttachment, deleteAttachment, getEntityAttachments, getAttachmentUrl } = useAttachments();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!entityId) return;
    setLoadingList(true);
    getEntityAttachments(entityType, entityId)
      .then(setAttachments)
      .finally(() => setLoadingList(false));
  }, [entityId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);

    if (!entityId) {
      // Pending-режим: накапливаем локально
      onPendingFilesChange?.([...pendingFiles, ...arr]);
      return;
    }

    // Грузим сразу
    for (const file of arr) {
      setUploadingName(file.name);
      try {
        await new Promise<void>((resolve, reject) => {
          uploadAttachment(
            { file, entityType, entityId },
            { onSuccess: () => resolve(), onError: (e) => reject(e) }
          );
        });
        const updated = await getEntityAttachments(entityType, entityId);
        setAttachments(updated);
      } catch {
        // toast уже показан в хуке
      } finally {
        setUploadingName(null);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (attachment: Attachment) => {
    setDeletingId(attachment.id);
    try {
      await new Promise<void>((resolve, reject) => {
        deleteAttachment(attachment, { onSuccess: () => resolve(), onError: (e) => reject(e) });
      });
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    } finally {
      setDeletingId(null);
    }
  };

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

  const removePending = (index: number) => {
    onPendingFilesChange?.(pendingFiles.filter((_, i) => i !== index));
  };

  const hasContent = attachments.length > 0 || pendingFiles.length > 0;

  return (
    <div className="space-y-2">
      {/* Зона загрузки — скрыта в readOnly */}
      {!readOnly && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <Upload className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Нажмите или перетащите файлы сюда</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">до 50 МБ</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Список файлов */}
      {loadingList ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Загрузка вложений...
        </div>
      ) : hasContent ? (
        <div className="space-y-1.5">
          {/* Загруженные файлы */}
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/20 group">
              {getFileIcon(a.file_name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{a.file_name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(a.file_size)}</p>
              </div>
              <div className={cn(
                "flex items-center gap-1 shrink-0 transition-opacity",
                readOnly ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDownload(a)}
                  disabled={downloadingId === a.id}
                  title="Скачать"
                >
                  {downloadingId === a.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Download className="h-3.5 w-3.5" />}
                </Button>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(a)}
                    disabled={deletingId === a.id}
                    title="Удалить"
                  >
                    {deletingId === a.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <X className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Pending файлы (только при создании) */}
          {pendingFiles.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center gap-2 p-2 rounded-md border border-dashed bg-primary/5 group">
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
                onClick={() => removePending(i)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {uploadingName && (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загружаю {uploadingName}...
            </div>
          )}
        </div>
      ) : readOnly ? (
        <p className="text-sm text-muted-foreground">Нет вложений</p>
      ) : null}
    </div>
  );
};
