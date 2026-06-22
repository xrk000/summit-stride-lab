import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Tag {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

const ALL_ENTITY_TAGS_QUERY_KEY: Record<string, string> = {
  task: "allTaskTags",
  habit: "allHabitTags",
  project: "allProjectTags",
  calendar_event: "allEventTags",
};

export const useTags = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateAllEntityTags = (entityType: string) => {
    const key = ALL_ENTITY_TAGS_QUERY_KEY[entityType];
    if (key) queryClient.invalidateQueries({ queryKey: [key] });
  };

  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Tag[];
    },
  });

  const createTag = useMutation({
    mutationFn: async (name: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tags")
        .insert([{ name, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["allTaskTags"] });
      queryClient.invalidateQueries({ queryKey: ["taskTags"] });
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("tags")
        .update({ name })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["allTaskTags"] });
      queryClient.invalidateQueries({ queryKey: ["taskTags"] });
      toast({
        title: "Тег обновлён",
        description: "Название тега изменено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addTagToEntity = useMutation({
    mutationFn: async ({ entityType, entityId, tagId }: {
      entityType: 'task' | 'note' | 'habit' | 'project' | 'calendar_event';
      entityId: string;
      tagId: string;
    }) => {
      if (entityType === 'task') {
        const { error } = await supabase.from('task_tags').insert([{ task_id: entityId, tag_id: tagId }]);
        if (error) throw error;
      } else if (entityType === 'note') {
        const { error } = await supabase.from('note_tags').insert([{ note_id: entityId, tag_id: tagId }]);
        if (error) throw error;
      } else if (entityType === 'habit') {
        const { error } = await supabase.from('habit_tags').insert([{ habit_id: entityId, tag_id: tagId }]);
        if (error) throw error;
      } else if (entityType === 'project') {
        const { error } = await supabase.from('project_tags').insert([{ project_id: entityId, tag_id: tagId }]);
        if (error) throw error;
      } else if (entityType === 'calendar_event') {
        const { error } = await supabase.from('calendar_event_tags').insert([{ event_id: entityId, tag_id: tagId }]);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: [`${variables.entityType}s`] });
      invalidateAllEntityTags(variables.entityType);
    },
  });

  const removeTagFromEntity = useMutation({
    mutationFn: async ({ entityType, entityId, tagId }: {
      entityType: 'task' | 'note' | 'habit' | 'project' | 'calendar_event';
      entityId: string;
      tagId: string;
    }) => {
      if (entityType === 'task') {
        const { error } = await supabase.from('task_tags').delete().eq('task_id', entityId).eq('tag_id', tagId);
        if (error) throw error;
      } else if (entityType === 'note') {
        const { error } = await supabase.from('note_tags').delete().eq('note_id', entityId).eq('tag_id', tagId);
        if (error) throw error;
      } else if (entityType === 'habit') {
        const { error } = await supabase.from('habit_tags').delete().eq('habit_id', entityId).eq('tag_id', tagId);
        if (error) throw error;
      } else if (entityType === 'project') {
        const { error } = await supabase.from('project_tags').delete().eq('project_id', entityId).eq('tag_id', tagId);
        if (error) throw error;
      } else if (entityType === 'calendar_event') {
        const { error } = await supabase.from('calendar_event_tags').delete().eq('event_id', entityId).eq('tag_id', tagId);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: [`${variables.entityType}s`] });
      invalidateAllEntityTags(variables.entityType);
    },
  });

  const getEntityTags = async (entityType: 'task' | 'note' | 'habit' | 'project' | 'calendar_event', entityId: string) => {
    let data: any;

    if (entityType === 'task') {
      const result = await supabase.from('task_tags').select(`tag_id, tags(*)`).eq('task_id', entityId);
      data = result.data;
    } else if (entityType === 'note') {
      const result = await supabase.from('note_tags').select(`tag_id, tags(*)`).eq('note_id', entityId);
      data = result.data;
    } else if (entityType === 'habit') {
      const result = await supabase.from('habit_tags').select(`tag_id, tags(*)`).eq('habit_id', entityId);
      data = result.data;
    } else if (entityType === 'project') {
      const result = await supabase.from('project_tags').select(`tag_id, tags(*)`).eq('project_id', entityId);
      data = result.data;
    } else if (entityType === 'calendar_event') {
      const result = await supabase.from('calendar_event_tags').select(`tag_id, tags(*)`).eq('event_id', entityId);
      data = result.data;
    }

    return data ? data.map((item: any) => item.tags) : [];
  };

  return {
    tags: tags || [],
    isLoading,
    createTag: createTag.mutate,
    updateTag: updateTag.mutate,
    deleteTag: deleteTag.mutate,
    addTagToEntity: addTagToEntity.mutate,
    removeTagFromEntity: removeTagFromEntity.mutate,
    getEntityTags,
  };
};