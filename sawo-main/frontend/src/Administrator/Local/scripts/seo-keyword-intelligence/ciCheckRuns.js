// ciCheckRuns.js
// Shared helper so each of the three SEO Keyword Intelligence scripts
// records its own outcome to `ci_check_runs`, the same table every other
// GitHub Actions workflow in this repo writes to (see
// docs/🔵 CMS/CMS-CI-STATUS.md) — /admin/ci-status already reads and
// displays every row there, so these three new jobs show up with zero
// CMS-side change. Workflows call this from a Node step (not a separate
// curl step like the simpler workflows) because these jobs need to report
// a descriptive message (quota exhausted, N rows synced, auth error) that
// job.status alone can't express.
import { createClient } from "@supabase/supabase-js";

export async function recordCheckRun(workflowName, status, message) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(`[${workflowName}] Skipping ci_check_runs write — missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY`);
    return;
  }

  const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null;

  const supabase = createClient(url, key);
  const { error } = await supabase.from("ci_check_runs").insert({
    workflow: workflowName,
    status,
    run_url: runUrl,
    ...(message ? { message } : {}),
  });

  if (error) {
    // ci_check_runs may not have a `message` column (it wasn't part of the
    // original CMS-CI-STATUS.md design) — retry without it rather than
    // losing the status record entirely.
    if (message) {
      const retry = await supabase.from("ci_check_runs").insert({ workflow: workflowName, status, run_url: runUrl });
      if (retry.error) console.error(`[${workflowName}] Failed to record check run:`, retry.error.message);
    } else {
      console.error(`[${workflowName}] Failed to record check run:`, error.message);
    }
  }
}
