import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Attachment {
  id: string;
  entity_type: 'task' | 'note';
  entity_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  user_id: string;
  created_at: string;
}

export const useAttachments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadAttachment = useMutation({
    mutationFn: async ({ 
      file, 
      entityType, 
      entityId 
    }: { 
      file: File; 
      entityType: 'task' | 'note'; 
      entityId: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("attachments")
        .insert([{
          entity_type: entityType,
          entity_id: entityId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      toast({
        title: "Файл загружен",
        description: "Файл успешно прикреплен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachment: Attachment) => {
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      const { error } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      toast({
        title: "Файл удален",
        description: "Файл успешно удален",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getEntityAttachments = async (entityType: 'task' | 'note', entityId: string) => {
    const { data, error } = await supabase
      .from("attachments")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);

    if (error) throw error;
    return data as Attachment[];
  };

  const getAttachmentUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('attachments')
      .createSignedUrl(filePath, 3600);

    return data?.signedUrl;
  };

  return {
    uploadAttachment: uploadAttachment.mutate,
    deleteAttachment: deleteAttachment.mutate,
    getEntityAttachments,
    getAttachmentUrl,
  };
};
