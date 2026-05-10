import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string) {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID/SECRET not configured in edge function secrets",
    );
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
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(); // Start of last month
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString(); // End of next month

    const { data: integration, error: intErr } = await admin
      .from("google_integrations")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (intErr) throw intErr;
    if (!integration) {
      return new Response(
        JSON.stringify({ error: "Google Calendar не подключен" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let accessToken: string = integration.provider_token;
    const expiresAt = integration.expires_at
      ? new Date(integration.expires_at).getTime()
      : 0;

    // Refresh if expired or close to expiry
    if (Date.now() > expiresAt - 300_000) { // Refresh 5 minutes before expiry
      console.log(`[FIX] Token for user ${userId} is expiring soon, refreshing...`);
      if (!integration.provider_refresh_token) {
        console.error(`[FIX] Missing refresh token for user ${userId}`);
        return new Response(
          JSON.stringify({
            error:
              "Refresh token отсутствует. Переподключите Google Calendar (нужен повторный consent).",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const refreshed = await refreshAccessToken(
        integration.provider_refresh_token,
      );
      accessToken = refreshed.access_token;
      const newExpiresAt = new Date(
        Date.now() + refreshed.expires_in * 1000,
      ).toISOString();
      await admin
        .from("google_integrations")
        .update({ provider_token: accessToken, expires_at: newExpiresAt })
        .eq("user_id", userId);
      console.log(`[FIX] Token refreshed successfully for user ${userId}`);
    }

    console.log(`[FIX] Fetching events for user ${userId} between ${timeMin} and ${timeMax}`);
    const allEvents: any[] = [];
    let pageToken: string | undefined = undefined;
    let pages = 0;

    do {
      const url = new URL(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      );
      url.searchParams.set("timeMin", timeMin);
      url.searchParams.set("timeMax", timeMax);
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");
      url.searchParams.set("maxResults", "2500"); // Max allowed by Google
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const r = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) {
        const txt = await r.text();
        console.error(`[FIX] Google API error for user ${userId}:`, txt);
        throw new Error(`Google Calendar API error ${r.status}: ${txt}`);
      }
      const json = await r.json();
      if (json.items) allEvents.push(...json.items);
      pageToken = json.nextPageToken;
      pages++;
    } while (pageToken && pages < 5); // Increased maxResults, so 5 pages = 12500 events

    console.log(`[FIX] Fetched ${allEvents.length} events from Google for user ${userId}`);

    const googleEventIds = allEvents.map(ev => ev.id);
    let imported = 0;
    for (const ev of allEvents) {
      if (ev.status === "cancelled") continue;

      const startDateTime = ev.start?.dateTime || ev.start?.date;
      if (!startDateTime) continue;

      let date: string;
      let time: string | null = null;
      if (ev.start?.dateTime) {
        // Use full ISO string to avoid local timezone issues during split
        const localStr = ev.start.dateTime.substring(0, 16); // "2026-05-09T01:00"
        date = localStr.split("T")[0];
        time = localStr.split("T")[1];
      } else {
        date = ev.start.date;
      }

      const description = [ev.description, ev.location]
        .filter(Boolean)
        .join("\n\n") || null;

      const { error: upErr } = await admin
        .from("calendar_events")
        .upsert(
          {
            user_id: userId,
            title: ev.summary || "(без названия)",
            description,
            date,
            time,
            type: "google",
            google_event_id: ev.id,
            source: "google",
          },
          { onConflict: "user_id,google_event_id" },
        );
      if (!upErr) imported++;
      else console.error(`[FIX] Upsert error for event ${ev.id}:`, upErr);
    }

    // REMOVE DELETED EVENTS: delete local google events that are NOT in the fetched list
    console.log(`[FIX] Cleaning up deleted events for user ${userId}`);
    const { error: delErr, count: delCount } = await admin
      .from("calendar_events")
      .delete()
      .eq("user_id", userId)
      .eq("type", "google")
      .not("google_event_id", "in", `(${googleEventIds.join(',')})`);

    if (delErr) {
      console.error(`[FIX] Cleanup error for user ${userId}:`, delErr);
    } else {
      console.log(`[FIX] Removed ${delCount || 0} stale events for user ${userId}`);
    }

    await admin
      .from("google_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        deleted: delCount || 0,
        total: allEvents.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("google-calendar-sync error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
