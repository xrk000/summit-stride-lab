import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

Deno.test("Google Calendar Sync - Deletion Test", async () => {
  const testUserId = "00000000-0000-0000-0000-000000000000"; // Mock or existing test user

  console.log("[TEST] Setting up stale event...");
  
  // 1. Ensure test integration exists
  await supabase.from("google_integrations").upsert({
    user_id: testUserId,
    provider_token: "mock_token",
    provider_refresh_token: "mock_refresh",
    expires_at: new Date(Date.now() + 3600000).toISOString()
  });

  // 2. Create a "stale" google event
  const staleEventId = "stale_event_123";
  await supabase.from("calendar_events").upsert({
    user_id: testUserId,
    title: "Stale Event",
    google_event_id: staleEventId,
    type: "google",
    source: "google",
    date: "2026-05-09"
  });

  console.log("[TEST] Running sync simulation (deletion phase)...");

  // Simulate the deletion logic from the edge function
  // Assume Google API returned events with IDs: ["active_event_456"]
  const activeEventIdsFromGoogle = ["active_event_456"];
  
  const { error: delErr, count: delCount } = await supabase
    .from("calendar_events")
    .delete()
    .eq("user_id", testUserId)
    .eq("type", "google")
    .not("google_event_id", "in", `(${activeEventIdsFromGoogle.join(',')})`);

  if (delErr) throw delErr;

  console.log(`[TEST] Deleted ${delCount} events.`);

  // 3. Verify the stale event is gone
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("google_event_id", staleEventId);

  if (events && events.length > 0) {
    throw new Error("Stale event was not deleted!");
  }

  console.log("[TEST] Success: Stale event removed.");

  // Cleanup
  await supabase.from("google_integrations").delete().eq("user_id", testUserId);
  await supabase.from("calendar_events").delete().eq("user_id", testUserId);
});
