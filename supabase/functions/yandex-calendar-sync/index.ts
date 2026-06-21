import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function unfoldLines(ics: string): string {
    return ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function parseDtValue(value: string): { date: string; time: string | null } {
    const v = value.trim().replace("Z", "");
    if (v.length === 8) {
        return { date: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, time: null };
    }
    return {
        date: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`,
        time: `${v.slice(9, 11)}:${v.slice(11, 13)}`,
    };
}

interface ParsedEvent {
    uid: string;
    title: string;
    description: string | null;
    date: string;
    time: string | null;
}

function parseIcs(icsText: string): ParsedEvent[] {
    const unfolded = unfoldLines(icsText);
    const lines = unfolded.split(/\r?\n/);
    const events: ParsedEvent[] = [];
    let inEvent = false;
    let props: Record<string, string> = {};

    for (const line of lines) {
        if (line === "BEGIN:VEVENT") { inEvent = true; props = {}; continue; }
        if (line === "END:VEVENT") {
            inEvent = false;
            if (props.UID && props.DTSTART) {
                const { date, time } = parseDtValue(props.DTSTART);
                const desc = [props.DESCRIPTION, props.LOCATION]
                    .map(s => s?.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\/g, ""))
                    .filter(Boolean).join("\n\n") || null;
                events.push({
                    uid: props.UID,
                    title: (props.SUMMARY || "(без названия)").replace(/\\,/g, ",").replace(/\\/g, ""),
                    description: desc,
                    date,
                    time,
                });
            }
            continue;
        }
        if (!inEvent) continue;
        const colonIdx = line.indexOf(":");
        if (colonIdx === -1) continue;
        const baseKey = line.substring(0, colonIdx).split(";")[0].toUpperCase();
        props[baseKey] = line.substring(colonIdx + 1);
    }
    return events;
}

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

        const admin = createClient(supabaseUrl, serviceKey);

        const { data: integration, error: intErr } = await admin
            .from("yandex_integrations")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (intErr) throw intErr;
        if (!integration) {
            return new Response(JSON.stringify({ error: "Яндекс Календарь не подключён" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (!integration.ical_url) {
            return new Response(JSON.stringify({ error: "iCal URL не указан" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        console.log("Fetching iCal from Yandex:", integration.ical_url);

        let icsResp: Response;
        try {
            icsResp = await fetch(integration.ical_url, {
                headers: { "User-Agent": "Mozilla/5.0" },
            });
        } catch (fetchErr) {
            console.error("Network error reaching Yandex:", fetchErr);
            return new Response(JSON.stringify({ error: `Не удалось соединиться с Яндексом: ${fetchErr instanceof Error ? fetchErr.message : "сетевая ошибка"}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        console.log("Yandex responded with status:", icsResp.status);

        if (!icsResp.ok) {
            const bodyPreview = (await icsResp.text()).slice(0, 200);
            console.error("Yandex non-OK response:", icsResp.status, bodyPreview);
            return new Response(JSON.stringify({ error: `Яндекс вернул код ${icsResp.status}. Проверьте ссылку iCal.` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const icsText = await icsResp.text();
        const events = parseIcs(icsText);
        console.log(`Parsed ${events.length} events from iCal`);

        let imported = 0;
        let skipped = 0;
        for (const ev of events) {
            // Проверяем, не отредактировано ли событие локально
            const { data: existing } = await admin
                .from("calendar_events")
                .select("id, is_modified")
                .eq("user_id", user.id)
                .eq("yandex_event_uid", ev.uid)
                .maybeSingle();

            if (existing?.is_modified) {
                skipped++;
                continue;
            }

            const { error: upErr } = await admin.from("calendar_events").upsert(
                { user_id: user.id, title: ev.title, description: ev.description, date: ev.date, time: ev.time, type: "yandex", source: "yandex", yandex_event_uid: ev.uid },
                { onConflict: "user_id,yandex_event_uid" }
            );
            if (!upErr) imported++;
            else console.error("upsert error", upErr);
        }

        await admin.from("yandex_integrations").update({ last_sync_at: new Date().toISOString() }).eq("user_id", user.id);

        return new Response(JSON.stringify({ success: true, imported, skipped, total: events.length }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
        console.error("yandex-calendar-sync error", e);
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});