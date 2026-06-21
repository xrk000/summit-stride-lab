import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Карта цветов Google Calendar
const COLOR_MAP: Record<string, string> = {
  "1": "#7986cb", "2": "#33b679", "3": "#8e24aa", "4": "#e67c73",
  "5": "#f6c026", "6": "#f5511d", "7": "#039be5", "8": "#616161",
  "9": "#3f51b5", "10": "#0b8043", "11": "#d60000",
};

async function refreshAccessToken(refreshToken: string) {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID/SECRET not configured");
  }
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to refresh Google token: ${resp.status} ${txt}`);
  }
  return resp.json() as Promise<{ access_token: string; expires_in: number }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    const { data: integration, error: intErr } = await admin
      .from("google_integrations")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (intErr) throw intErr;
    if (!integration) {
      return new Response(
        JSON.stringify({ error: "Google Calendar не подключен" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let accessToken: string = integration.provider_token;
    const expiresAt = integration.expires_at
      ? new Date(integration.expires_at).getTime()
      : 0;

    if (Date.now() > expiresAt - 300_000) {
      console.log(`Token expiring for user ${userId}, refreshing...`);
      if (!integration.provider_refresh_token) {
        return new Response(
          JSON.stringify({ error: "Refresh token отсутствует. Переподключите Google Calendar." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const refreshed = await refreshAccessToken(integration.provider_refresh_token);
      accessToken = refreshed.access_token;
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await admin
        .from("google_integrations")
        .update({ provider_token: accessToken, expires_at: newExpiresAt })
        .eq("user_id", userId);
      console.log(`Token refreshed for user ${userId}`);
    }

    console.log(`Fetching events for user ${userId}`);
    const allEvents: any[] = [];
    let pageToken: string | undefined = undefined;
    let pages = 0;

    do {
      const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
      url.searchParams.set("timeMin", timeMin);
      url.searchParams.set("timeMax", timeMax);
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");
      url.searchParams.set("maxResults", "2500");
      url.searchParams.set("conferenceDataVersion", "1");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const r = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Google Calendar API error ${r.status}: ${txt}`);
      }
      const json = await r.json();
      if (json.items) allEvents.push(...json.items);
      pageToken = json.nextPageToken;
      pages++;
    } while (pageToken && pages < 5);

    console.log(`Fetched ${allEvents.length} events for user ${userId}`);

    const googleEventIds = allEvents.map(ev => ev.id);
    let imported = 0;
    let skipped = 0;

    for (const ev of allEvents) {
      if (ev.status === "cancelled") continue;

      const startDateTime = ev.start?.dateTime || ev.start?.date;
      if (!startDateTime) continue;

      let date: string;
      let time: string | null = null;

      if (ev.start?.dateTime) {
        const localStr = ev.start.dateTime.substring(0, 16);
        date = localStr.split("T")[0];
        time = localStr.split("T")[1];
      } else {
        date = ev.start.date;
      }

      let end_time: string | null = null;
      if (ev.end?.dateTime) {
        end_time = ev.end.dateTime.substring(0, 16).split("T")[1];
      }

      const meet_link: string | null =
        ev.conferenceData?.entryPoints?.find(
          (ep: any) => ep.entryPointType === "video"
        )?.uri || null;

      const color: string | null = ev.colorId
        ? (COLOR_MAP[ev.colorId] || null)
        : null;

      const is_recurring: boolean = !!(ev.recurrence || ev.recurringEventId);

      // ── Проверяем, не отредактировано ли событие локально ────────────
      const { data: existing } = await admin
        .from("calendar_events")
        .select("id, is_modified")
        .eq("user_id", userId)
        .eq("google_event_id", ev.id)
        .maybeSingle();

      if (existing?.is_modified) {
        skipped++;
        continue;
      }

      // ── Upsert ──────────────────────────────────────────────────────
      const { error: upErr } = await admin
        .from("calendar_events")
        .upsert(
          {
            user_id: userId,
            title: ev.summary || "(без названия)",
            description: ev.description || null,
            location: ev.location || null,
            date,
            time,
            end_time,
            meet_link,
            color,
            is_recurring,
            type: "google",
            google_event_id: ev.id,
            source: "google",
          },
          { onConflict: "user_id,google_event_id" },
        );

      if (!upErr) {
        imported++;
      } else {
        console.error(`Upsert error for event ${ev.id}:`, upErr);
      }
    }

    // Удаляем google-события которых больше нет в Google, КРОМЕ отредактированных
    console.log(`Cleaning up deleted events for user ${userId}`);
    const { error: delErr, count: delCount } = await admin
      .from("calendar_events")
      .delete()
      .eq("user_id", userId)
      .eq("source", "google")
      .eq("is_modified", false)
      .not("google_event_id", "in", `(${googleEventIds.join(",")})`);

    if (delErr) {
      console.error(`Cleanup error:`, delErr);
    } else {
      console.log(`Removed ${delCount || 0} stale events`);
    }

    await admin
      .from("google_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        skipped,
        deleted: delCount || 0,
        total: allEvents.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("google-calendar-sync error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});