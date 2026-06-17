import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAllProjectTags = () => {
    return useQuery({
        queryKey: ["allProjectTags"],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) return new Map();

            const { data, error } = await supabase
                .from("project_tags")
                .select("project_id, tags(*)")
                .eq("tags.user_id", user.id);

            if (error) throw error;

            const map = new Map<string, any[]>();
            data?.forEach((pt: any) => {
                const tags = map.get(pt.project_id) || [];
                tags.push(pt.tags);
                map.set(pt.project_id, tags);
            });
            return map;
        },
    });
};