import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

        const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
        const { data: { user }, error: userErr } = await userClient.auth.getUser();
        if (userErr || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { ical_url } = await req.json() ?? {};
        if (!ical_url || typeof ical_url !== "string") {
            return new Response(JSON.stringify({ error: "Ссылка iCal обязательна" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Простая проверка, что это похоже на ссылку Яндекс iCal
        if (!ical_url.includes("calendar.yandex") || !ical_url.startsWith("https://")) {
            return new Response(JSON.stringify({ error: "Это не похоже на ссылку Яндекс Календаря (https://calendar.yandex.ru/...)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const admin = createClient(supabaseUrl, serviceKey);
        const { error } = await admin
            .from("yandex_integrations")
            .upsert({ user_id: user.id, ical_url }, { onConflict: "user_id" });
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
        console.error("save-yandex-credentials error", e);
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});