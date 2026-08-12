# Retired — no longer deployed

**As of 2026-08-03**, this backend is retired. It ran on Render solely to:

1. Sync product/room images from Supabase Storage into the `saworepo2` GitHub repo
   (`syncApi.js`, the `/api/sync`, `/api/update-local-files`, `/api/sync-sauna-rooms`,
   `/api/update-local-sauna-rooms` endpoints) — this existed only to dodge Supabase
   Storage egress fees by serving images from GitHub raw instead. That's no longer
   needed: all product/room images and PDFs now live in Cloudflare R2 (bucket
   `sawo-media`, served at `/media/*` via a Pages Function in the frontend project),
   which has zero egress cost regardless of traffic.
2. Analytics tracking (`/api/track/pageview`, `/api/track/duration`) — duplicated by
   equivalent Cloudflare Pages Functions already live at the same paths in the
   frontend project (`functions/api/track/*`), so this copy was redundant too.

The admin CMS's data-source setting is now permanently `"supabase"` (live reads) —
see `Administrator/Settings.jsx`. The "GitHub" and "Json File" data source options,
and the "Sync" button that called this backend's endpoints, have been removed from
the admin UI.

**This code is kept for reference, not deleted.** The actual Render service should
be suspended/deleted from the Render dashboard directly — that's not something
that can be done from this repo. See `docs/go-live/archive/R2-MIGRATION-PLAN.md` for
the full migration record.

> **⚠️ The R2-migration claims below are disputed.** `docs/project/PENDING-TASKS.md`
> ("Stale doc corrections") states the R2 bucket was checked live on 2026-08-10 and
> found **empty** — contradicting the "migration completed" narrative here. Nothing
> was actually lost (`saworepo2` deletion is separately confirmed), but don't treat
> the paragraph below as an accurate description of current storage state; check
> `docs/project/PENDING-TASKS.md` first.

**2026-08-06 update:** `saworepo2` (the GitHub images repo this backend synced into)
has now been deleted outright, after a file-by-file verification against the R2
migration manifest confirmed nothing still in use would be lost — see
`docs/go-live/archive/STORAGE-CURRENT.txt` section 4A. `syncApi.js`, `sync.js`,
`sync-sauna-rooms.js`, and `upload-accessories.js` (in
`frontend/src/Administrator/Local/scripts/`) will now fail if ever invoked, since
their `saworepo2/images` source no longer exists on disk. They were left as-is
during that cleanup — retiring/rewriting them is still this same deferred
Render-backend-retirement task, not done yet.
