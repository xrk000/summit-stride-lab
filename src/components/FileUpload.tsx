import { useRef, useState, useEffect } from "react";
import { Upload, File, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttachments } from "@/hooks/useAttachments";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
  entityType: 'task' | 'note';
  entityId: string;
}

export const FileUpload = ({ entityType, entityId }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAttachment, deleteAttachment, getEntityAttachments, getAttachmentUrl } = useAttachments();
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAttachments();
  }, [entityId]);

  const loadAttachments = async () => {
    const data = await getEntityAttachments(entityType, entityId);
    setAttachments(data);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    uploadAttachment({ file, entityType, entityId });
    setTimeout(() => {
      loadAttachments();
      setUploading(false);
    }, 1000);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (attachment: any) => {
    const url = await getAttachmentUrl(attachment.file_path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDelete = async (attachment: any) => {
    deleteAttachment(attachment);
    setTimeout(() => loadAttachments(), 500);
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? "Загрузка..." : "Прикрепить файл"}
      </Button>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <span className="text-sm">{attachment.file_name}</span>
                <span className="text-xs text-muted-foreground">
                  ({Math.round(attachment.file_size / 1024)} KB)
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attachment)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
