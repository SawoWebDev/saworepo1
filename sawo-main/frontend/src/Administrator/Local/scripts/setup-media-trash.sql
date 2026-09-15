-- ============================================================
-- SAWO: Media Trash — Supabase Setup
-- Adds soft-delete tracking to media_upload_log so replacing/removing an
-- image in the CMS (Products.jsx, SaunaRoomsCMS.jsx) marks it trashed
-- instead of the app immediately, permanently deleting it from R2. A
-- trashed image can be restored (see Trash.jsx's Media section) any time
-- before it auto-purges, mirroring exactly how products/sauna_rooms
-- already work (is_deleted/deleted_at + a 30-day daily purge job) — this
-- is the same pattern, just for individual media files instead of whole
-- rows. See mediaUpload.js's trashMediaUrls/restoreMediaLogRow for the
-- app-side half of this.
--
-- Nothing here touches R2 itself. Marking a row trashed/restored is a
-- plain table write (the client already does this directly, same anon key
-- the existing Cloudflare Function already uses to write this same table —
-- see mediaUpload.js's comment). Only two things ever actually delete the
-- R2 object: the admin clicking "Delete Forever" in Trash.jsx (calls the
-- existing DELETE endpoint in functions/api/media-upload.js), and the
-- scheduled purge job below, which calls that exact same endpoint on a
-- schedule via pg_net — reusing the live production endpoint and its
-- existing auth check rather than adding a new one.
-- ============================================================

-- ── 1. New columns ─────────────────────────────────────────────────────
-- trashed_at:  set the moment an image stops being the active file for its
--              slot (replaced or removed) — NULL means "currently in use,
--              not trash."
-- restored_at: set if an admin restores a trashed row. A row can be
--              trashed again later (re-replaced after being restored) —
--              trashMediaUrls() resets this back to NULL when that happens,
--              so "is this actively in the trash right now" is always
--              `trashed_at IS NOT NULL AND restored_at IS NULL AND
--              deleted_at IS NULL` (deleted_at already existed — it means
--              "actually gone from R2 forever," set only by a real purge).
ALTER TABLE media_upload_log
  ADD COLUMN IF NOT EXISTS trashed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz;

CREATE INDEX IF NOT EXISTS media_upload_log_active_trash_idx
  ON media_upload_log (trashed_at)
  WHERE trashed_at IS NOT NULL AND restored_at IS NULL AND deleted_at IS NULL;

-- ── 2. Scheduled purge (30 days, daily) ────────────────────────────────
-- Requires the pg_net extension, already enabled in this project for the
-- neon_sync_notify trigger (see docs/NEON_BACKUP_PLAN.md) — reused here,
-- not a new dependency.
--
-- pg_net can't call the Cloudflare Function's DELETE endpoint as "nobody"
-- — that endpoint requires a real admin/superadmin userId (the same
-- requireUploader() check every interactive delete already goes through;
-- see functions/api/media-upload.js). Rather than invent a second, weaker
-- auth path just for this scheduled job, it acts as one specific real
-- admin account. Replace the placeholder below with that account's own
-- users.id before running this file:
--   SELECT id, username, role FROM users WHERE role IN ('admin','superadmin') LIMIT 5;
-- Any admin/superadmin works — this only identifies WHO the scheduled
-- purge is attributed to in media_upload_log/activity logs, same as any
-- other delete.
DO $$
DECLARE
  purge_actor_id uuid := '00000000-0000-0000-0000-000000000000'; -- ← replace me
BEGIN
  IF purge_actor_id = '00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'setup-media-trash.sql: replace purge_actor_id with a real admin/superadmin users.id before running this block.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION purge_expired_media_trash() RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  purge_actor_id uuid := '00000000-0000-0000-0000-000000000000'; -- ← same id as above
  row_ RECORD;
BEGIN
  FOR row_ IN
    SELECT id, key
    FROM media_upload_log
    WHERE trashed_at IS NOT NULL
      AND restored_at IS NULL
      AND deleted_at IS NULL
      AND trashed_at < now() - interval '30 days'
  LOOP
    -- No URL-encoding needed: keys are built only from SLUG_RE/ROLE_RE-
    -- validated segments (see functions/api/media-upload.js) — lowercase
    -- letters, digits, hyphens, "/", and "." only, all query-string-safe
    -- as-is.
    PERFORM net.http_delete(
      url := 'https://saworepo1.pages.dev/api/media-upload?key=' || row_.key || '&userId=' || purge_actor_id::text
    );
    -- Fire-and-forget: pg_net requests are async, so this doesn't wait for
    -- (or need) the response — onRequestDelete on the other end sets
    -- deleted_at itself once it actually runs. Not set here to avoid
    -- marking a row "deleted" before the R2 delete has genuinely happened.
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'purge-expired-media-trash',
  '0 3 * * *', -- daily at 03:00 UTC, same slot pattern as the products/rooms purge job
  $$ SELECT purge_expired_media_trash(); $$
);

-- ============================================================
-- VERIFICATION
-- ============================================================
-- 1. Columns exist:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'media_upload_log' AND column_name IN ('trashed_at','restored_at');
--
-- 2. See what the purge job would currently act on (should be empty right
--    after setup, since nothing's been trashed 30+ days yet):
--   SELECT id, key, slug, role, trashed_at FROM media_upload_log
--   WHERE trashed_at IS NOT NULL AND restored_at IS NULL AND deleted_at IS NULL
--     AND trashed_at < now() - interval '30 days';
--
-- 3. Confirm the cron job registered:
--   SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'purge-expired-media-trash';
--
-- 4. Manually trigger one purge pass to confirm pg_net/the endpoint call
--    actually works (safe to run any time — it only ever touches rows
--    already 30+ days trashed, which won't exist until this feature has
--    been live a while):
--   SELECT purge_expired_media_trash();
--   -- then, a few seconds later, check net._http_response for the result:
--   SELECT status_code, content FROM net._http_response ORDER BY id DESC LIMIT 5;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- SELECT cron.unschedule('purge-expired-media-trash');
-- DROP FUNCTION IF EXISTS purge_expired_media_trash();
-- DROP INDEX IF EXISTS media_upload_log_active_trash_idx;
-- ALTER TABLE media_upload_log DROP COLUMN IF EXISTS trashed_at, DROP COLUMN IF EXISTS restored_at;
