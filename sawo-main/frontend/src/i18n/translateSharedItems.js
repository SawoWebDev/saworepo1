// src/i18n/translateSharedItems.js
//
// For a shared React component that takes `items = DEFAULT_ITEMS` (plain
// English data from a *.jsx/*.js data file) and is reused by more than one
// page — one page rendering the default content, another passing its own
// entirely different content as an override.
//
// The naive way to decide "should I translate this?" is `items ===
// DEFAULT_ITEMS`, and the naive way to look up which translation key an
// item maps to is its index in `items`. Both silently break the moment any
// caller passes a DERIVED array instead of the literal default — most
// commonly DEFAULT_ITEMS.filter(...), which is a completely ordinary thing
// to write and gives no error, warning, or type mismatch. filter() returns
// a new array (fails the `===` check, so translation is skipped entirely)
// and shifts indexes for anything after a removed element (so even a
// same-length .map()/reorder maps content to the wrong key). This exact bug
// shipped once already: SaunaRooms.jsx passes
// `SRD_PANELS.filter(p => p.pill !== "Infrared")` to SaunaRoomDetails, which
// silently rendered the untranslated English panels — see git history
// 2026-08-25 for the fix.
//
// The only check that survives filtering/reordering is per-item identity:
// does THIS item (by reference) still exist somewhere in DEFAULT_ITEMS, and
// if so, at what index *there* (not in the possibly-shorter `items` array)?
// That's what this helper does, so every shared-component translation in
// this codebase goes through one correct implementation instead of each
// component re-deriving (and risking mis-deriving) its own.

/**
 * @param {Array} items          The prop actually passed to the component —
 *                                may be DEFAULT_ITEMS itself, a filtered/
 *                                mapped/reordered derivation of it (same
 *                                object references, different array), or a
 *                                caller's entirely different override array.
 * @param {Array} defaultItems   The literal default (imported data constant)
 *                                this component's default param points to.
 * @param {Array<string|undefined>} keysByIndex
 *                                keysByIndex[i] is the i18n key for
 *                                defaultItems[i] ("" or undefined = no
 *                                translation exists for that entry, e.g. a
 *                                default item that's intentionally still
 *                                English).
 * @param {(item: any, key: string) => any} translateOne
 *                                Given one item and its resolved key,
 *                                returns the translated replacement (or the
 *                                same shape merged with translated fields).
 * @returns {Array} `items` with every entry that's traceable back to
 *                                defaultItems translated, and every entry
 *                                that isn't (a genuine caller override, or
 *                                an untranslated default entry) unchanged.
 */
export function translateSharedItems(items, defaultItems, keysByIndex, translateOne) {
  return items.map((item) => {
    const idx = defaultItems.indexOf(item);
    const key = idx === -1 ? undefined : keysByIndex[idx];
    return key ? translateOne(item, key) : item;
  });
}

/**
 * Companion check for the other shape this same bug takes: a component that
 * translates several *whole* default arrays/values at once (e.g. "if this
 * prop is the untranslated default, swap in the translated block") rather
 * than translating item-by-item. `arr === defaultArr` has the identical
 * filter()-breaks-it problem `translateSharedItems` exists for — this is
 * the version of that identity check for "is `arr` still entirely made up
 * of defaultArr's own items (in any order/subset), or did the caller pass
 * something genuinely different?"
 *
 * @param {Array} arr         The prop actually passed.
 * @param {Array} defaultArr  The literal default it points to by default.
 * @returns {boolean} true if `arr` is `defaultArr` itself or a
 *                     filtered/mapped/reordered derivation of it (safe to
 *                     translate as "the default content"); false if it's a
 *                     caller's own override array.
 */
export function isDerivedFromDefault(arr, defaultArr) {
  return Array.isArray(arr) && arr.every((item) => defaultArr.includes(item));
}
