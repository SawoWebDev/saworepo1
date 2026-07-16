// src/inline-edit/saveAndPublish.js
//
// Save: for each dirty section, re-fetch the row fresh, deep-merge the
// pending patch on top (narrowing the race window vs. two editors saving at
// once), sanitize any *_html fields, and upsert — same shape ContentCMS
// writes, so both tools stay consistent on the same rows.
//
// Publish: reuses the existing backend sync endpoint (same one ContentCMS's
// "Sync to GitHub" button calls) so visitors on the default GitHub data
// source actually see the change, not just the admin who saved it.

import { supabase, logActivity } from "../Administrator/supabase";
import { getDataSource } from "../local-storage/dataSource";
import { clearSiteContentCache, refreshSiteContent } from "../local-storage/cacheReader";
import { deepMerge } from "./pathUtils";
import { sanitizeHtml } from "./sanitizeHtml";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function sanitizeHtmlFields(node) {
  if (Array.isArray(node)) return node.map(sanitizeHtmlFields);
  if (node && typeof node === "object") {
    const out = {};
    for (const [key, val] of Object.entries(node)) {
      out[key] = key.endsWith("_html") && typeof val === "string" ? sanitizeHtml(val) : sanitizeHtmlFields(val);
    }
    return out;
  }
  return node;
}

export async function saveSections({ pageId, pending, username, userId }) {
  const sections = Object.keys(pending);
  for (const section of sections) {
    const { data: freshRow, error: fetchError } = await supabase
      .from("site_content")
      .select("id, data")
      .eq("page", pageId)
      .eq("section", section)
      .maybeSingle();
    if (fetchError) throw new Error(`${section}: ${fetchError.message}`);

    const merged = sanitizeHtmlFields(deepMerge(freshRow?.data || {}, pending[section]));

    // Deliberately UPDATE when the row already exists instead of always
    // upserting: `INSERT ... ON CONFLICT DO UPDATE` requires satisfying the
    // table's INSERT policy even when the conflict resolves to an update, so
    // on a site_content table that only has an UPDATE policy (no INSERT
    // policy for anon — the common case, since rows are normally pre-seeded
    // via a migration) an upsert fails RLS for a row that already exists.
    // A plain UPDATE only needs the UPDATE policy and sidesteps that.
    let writeError;
    let rowId = freshRow?.id;
    if (freshRow) {
      ({ error: writeError } = await supabase
        .from("site_content")
        .update({ data: merged, updated_by: username })
        .eq("page", pageId)
        .eq("section", section));
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("site_content")
        .insert({ page: pageId, section, data: merged, updated_by: username })
        .select("id")
        .single();
      writeError = insertError;
      rowId = inserted?.id;
    }
    if (writeError) {
      const hint = freshRow
        ? ""
        : ` (no existing row for "${pageId}/${section}" — the anon role needs an INSERT policy on site_content to create it; see Supabase Dashboard → Table Editor → site_content → Policies)`;
      throw new Error(`${section}: ${writeError.message}${hint}`);
    }

    // entity_id is a uuid column — pass the row's real id (not the
    // "page/section" string, which fails the column's type check) and keep
    // the human-readable label in entity_name instead.
    await logActivity({
      action: "update",
      entity: "site_content",
      entity_id: rowId || null,
      entity_name: `${pageId} › ${section}`,
      username,
      user_id: userId,
    });
  }
  return sections;
}

export function publishToGitHub(onEvent) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/sync-site-content`, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let hadError = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n");
          buf = parts.pop();
          for (const part of parts) {
            if (!part.trim()) continue;
            try {
              const ev = JSON.parse(part);
              onEvent?.(ev);
              if (ev.phase === "error") hadError = true;
            } catch { /* ignore malformed line */ }
          }
        }
        if (hadError) throw new Error("Sync reported an error — see log");
        resolve();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

// Save all dirty sections, then publish if (and only if) the site is
// currently serving visitors from the GitHub snapshot — on the "supabase"
// data source, saving already is publishing.
export async function saveAndPublish({ pageId, pending, username, userId, onPublishEvent }) {
  const savedSections = await saveSections({ pageId, pending, username, userId });
  clearSiteContentCache();

  const source = await getDataSource();
  if (source === "supabase") {
    await refreshSiteContent();
    return { savedSections, published: false, source };
  }

  try {
    await publishToGitHub(onPublishEvent);
    return { savedSections, published: true, source };
  } catch (err) {
    return { savedSections, published: false, source, publishError: err.message };
  }
}
