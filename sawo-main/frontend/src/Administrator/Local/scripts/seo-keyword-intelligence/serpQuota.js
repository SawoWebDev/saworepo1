// serpQuota.js
// Enforces the user-configured monthly SerpApi search budget
// (SERPAPI_MONTHLY_LIMIT, default 130 — a safety margin under the real
// 200/month plan limit) using the `seo_serp_usage` table as a running
// counter. This is enforced HERE, in code, rather than trusted to the cron
// cadence alone, so a manual `workflow_dispatch` re-run or a larger tracked
// list can't silently blow through the plan.
const DEFAULT_MONTHLY_LIMIT = 130;

function currentYearMonth() {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

export async function getRemainingQuota(supabase) {
  const limit = parseInt(process.env.SERPAPI_MONTHLY_LIMIT || String(DEFAULT_MONTHLY_LIMIT), 10);
  const yearMonth = currentYearMonth();

  const { data, error } = await supabase.from("seo_serp_usage").select("searches_used").eq("year_month", yearMonth).maybeSingle();
  if (error) throw error;

  const used = data?.searches_used || 0;
  return { limit, used, remaining: Math.max(0, limit - used), yearMonth };
}

/** Atomically-enough increment (read-then-write is fine here: this script runs single-threaded, one instance at a time via cron). */
export async function recordSearchUsed(supabase, yearMonth, count = 1) {
  const { data, error: selectError } = await supabase.from("seo_serp_usage").select("searches_used").eq("year_month", yearMonth).maybeSingle();
  if (selectError) throw selectError;

  const nextUsed = (data?.searches_used || 0) + count;
  const { error: upsertError } = await supabase
    .from("seo_serp_usage")
    .upsert({ year_month: yearMonth, searches_used: nextUsed, updated_at: new Date().toISOString() });
  if (upsertError) throw upsertError;

  return nextUsed;
}
