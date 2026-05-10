import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    const { provider_token, provider_refresh_token, expires_in, target_user_id } = body ?? {};

    console.log(`[FIX] Saving tokens. Target user: ${target_user_id || userId}. Refresh token provided: ${!!provider_refresh_token}`);

    if (!provider_token) {
      console.error(`[FIX] Missing provider_token`);
      return new Response(JSON.stringify({ error: "Missing provider_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = expires_in
      ? new Date(Date.now() + Number(expires_in) * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    const admin = createClient(supabaseUrl, serviceKey);

    // If target_user_id is provided, we use it (this handles the case where OAuth session switched)
    const finalUserId = target_user_id || userId;

    // Check if we already have a refresh token
    const { data: existing } = await admin
      .from("google_integrations")
      .select("provider_refresh_token")
      .eq("user_id", finalUserId)
      .maybeSingle();

    if (!provider_refresh_token && !existing?.provider_refresh_token) {
      console.warn(`[FIX] No refresh token available for user ${finalUserId}. Future syncs may fail after 1 hour.`);
    }

    // Don't overwrite existing refresh_token with null (Google only returns it on first consent)
    const upsertPayload: Record<string, unknown> = {
      user_id: finalUserId,
      provider_token,
      expires_at: expiresAt,
    };
    if (provider_refresh_token) {
      upsertPayload.provider_refresh_token = provider_refresh_token;
    }

    const { error } = await admin
      .from("google_integrations")
      .upsert(upsertPayload, { onConflict: "user_id" });

    if (error) {
      console.error(`[FIX] Database error saving tokens for ${finalUserId}:`, error);
      throw error;
    }

    console.log(`[FIX] Tokens saved successfully for user ${finalUserId}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("save-google-tokens error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
