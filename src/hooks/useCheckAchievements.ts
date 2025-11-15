import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCheckAchievements = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-achievements', {
        body: {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      
      if (data.newAchievements && data.newAchievements.length > 0) {
        toast({
          title: "🎉 Новое достижение!",
          description: data.message,
        });
      }
    },
    onError: (error) => {
      console.error('Error checking achievements:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось проверить достижения",
        variant: "destructive",
      });
    },
  });
};
