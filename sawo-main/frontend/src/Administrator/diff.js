// src/Administrator/diff.js
//
// Shared field-level diffing for revision history. Used by both
// Products.jsx and SaunaRoomsCMS.jsx (each has its own EMPTY_FORM/field
// list) plus Logs.jsx for rendering — kept here instead of duplicated so the
// three call sites can never drift on what "changed" means for a given
// field shape.

// Long HTML fields get stored as excerpts, not full bodies — a single
// revision row would otherwise balloon past 100KB over a product's lifetime.
export function excerptOf(html) {
  const text = (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return { len: text.length, excerpt: text.length > 300 ? `${text.slice(0, 300)}...` : text };
}

// Field-level before/after diff between two form snapshots. `fieldKeys` is
// the caller's EMPTY_FORM key list; `longTextFields` get excerpted,
// `setArrayFields` (image/file lists) are recorded as added/removed rather
// than two full array dumps. Returns only the fields that actually changed.
export function diffFormFields(before, after, fieldKeys, { longTextFields = new Set(), setArrayFields = new Set() } = {}) {
  const changes = {};
  for (const k of fieldKeys) {
    const bv = before[k], av = after[k];
    if (longTextFields.has(k)) {
      if ((bv || "") === (av || "")) continue;
      changes[k] = { before: excerptOf(bv), after: excerptOf(av) };
    } else if (setArrayFields.has(k)) {
      const bArr = Array.isArray(bv) ? bv : [];
      const aArr = Array.isArray(av) ? av : [];
      if (JSON.stringify(bArr) === JSON.stringify(aArr)) continue;
      const bSet = new Set(bArr), aSet = new Set(aArr);
      changes[k] = {
        added: aArr.filter(x => !bSet.has(x)),
        removed: bArr.filter(x => !aSet.has(x)),
      };
    } else if (Array.isArray(bv) && Array.isArray(av)) {
      if (JSON.stringify(bv) !== JSON.stringify(av)) changes[k] = { before: bv, after: av };
    } else if (typeof bv === "object" && bv !== null && typeof av === "object" && av !== null) {
      if (JSON.stringify(bv) !== JSON.stringify(av)) changes[k] = { before: bv, after: av };
    } else if (bv !== av) {
      changes[k] = { before: bv ?? null, after: av ?? null };
    }
  }
  return changes;
}
