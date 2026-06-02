import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface NoteTemplate {
    id: string;
    user_id: string;
    name: string;
    title: string;
    content: string | null;
    created_at: string;
}

export const useNoteTemplates = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Получить все шаблоны пользователя
    const { data: templates, isLoading } = useQuery({
        queryKey: ["note-templates"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("note_templates")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as NoteTemplate[];
        },
    });

    // Создать шаблон
    const createTemplate = useMutation({
        mutationFn: async (template: Omit<NoteTemplate, "id" | "user_id" | "created_at">) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("note_templates")
                .insert({ ...template, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["note-templates"] });
            toast({ title: "Шаблон сохранён", description: "Теперь вы можете использовать его при создании заметок" });
        },
        onError: (error) => {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        },
    });

    // Обновить шаблон
    const updateTemplate = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<NoteTemplate> & { id: string }) => {
            const { data, error } = await supabase
                .from("note_templates")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["note-templates"] });
            toast({ title: "Шаблон обновлён" });
        },
        onError: (error) => {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        },
    });

    // Удалить шаблон
    const deleteTemplate = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("note_templates").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["note-templates"] });
            toast({ title: "Шаблон удалён" });
        },
        onError: (error) => {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        },
    });

    return {
        templates: templates || [],
        isLoading,
        createTemplate,
        updateTemplate,
        deleteTemplate,
    };
};