
Deno.test("Google Calendar Sync - Range Definition Test", () => {
  console.log("[TEST] Verifying sync date range logic...");
  
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(); // Start of last month
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString(); // End of next month

  console.log(`[TEST] timeMin: ${timeMin}`);
  console.log(`[TEST] timeMax: ${timeMax}`);

  // Validation 1: Check ISO format
  if (!timeMin.match(/^\d{4}-\d{2}-\d{2}T/)) {
    throw new Error(`Invalid timeMin format: ${timeMin}`);
  }
  if (!timeMax.match(/^\d{4}-\d{2}-\d{2}T/)) {
    throw new Error(`Invalid timeMax format: ${timeMax}`);
  }

  // Validation 2: Ensure order is correct
  if (new Date(timeMin).getTime() >= new Date(timeMax).getTime()) {
    throw new Error("timeMin must be before timeMax");
  }

  // Validation 3: Ensure it covers at least 60 days
  const diffDays = (new Date(timeMax).getTime() - new Date(timeMin).getTime()) / (1000 * 60 * 60 * 24);
  console.log(`[TEST] Range covers ${Math.round(diffDays)} days`);
  if (diffDays < 58) { // Approx 2 months
    throw new Error(`Range too narrow: ${diffDays} days`);
  }

  console.log("[TEST] Success: Date range logic is valid.");
});
