# Inline Editing System (DORMANT)

A WordPress-style in-place content editor built July 2026, currently **disabled** —
nothing imports this folder, so none of it ships in the bundle.

What it does when enabled: logged-in admins (role editor/admin/superadmin) get a
fixed admin bar on every public page with an "Edit Page" toggle; text becomes
click-to-edit and images/cards get "Edit content" / "Replace image" panels.
Saves go to the same Supabase `site_content` rows ContentCMS uses, then
auto-publish through the existing `/api/sync-site-content` GitHub sync.

## To re-enable

1. In `src/layouts/MainLayout.jsx`, wrap the layout in the provider:
   ```jsx
   import { EditProvider } from "../inline-edit/EditProvider";
   // ...
   return <EditProvider> ...existing layout... </EditProvider>;
   ```
2. Wire pages by wrapping content in `EditableText` / `EditableImage` /
   `EditableCard` (one consolidated panel per card) with the page's current
   content as the default children. Add each page's route to `pageIds.js`.
3. Supabase needs an anon INSERT policy on `site_content` for first-time page
   rows (UPDATE policy suffices for existing rows).

## Files

- `EditProvider.jsx` — context + session gate + lazy-loads the admin chunk
- `EditableText.jsx` / `EditableImage.jsx` / `EditableCard.jsx` — wrappers
- `AdminEditSystem.jsx` / `AdminBar.jsx` — admin-only lazy chunk
- `ItemEditPanel.jsx` / `ImageReplaceDialog.jsx` — edit modals
- `saveAndPublish.js` — Supabase save + GitHub publish
- `sanitizeHtml.js`, `pathUtils.js`, `uploadImage.js`, `useElementRect.js`,
  `adminSession.js`, `pageIds.js` — supporting utilities
