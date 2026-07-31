// src/Administrator/previewRole.js
//
// Lets a superadmin see the CMS the way another role would, without needing
// a second account (accounts require a unique email — see
// docs/cms/CMS-DOCUMENTATION.md) or logging out. Purely a client-side UI
// simulation: it only changes what `can()` and NAV_ITEMS filtering think the
// current role is, so the sidebar/pages render as that role would see them.
// It does NOT reduce actual database privileges — the real session
// underneath is unchanged, so RLS still evaluates the superadmin's true
// role. That's intentional: this is for previewing visibility, not for
// safely testing what a lower role can/can't do at the data layer.
//
// This is a tiny subscribable store rather than plain sessionStorage reads:
// the picker (Profile.jsx) and the badge/nav (AdminLayout.jsx) are in
// separate component trees, so without a subscription each would hold its
// own stale copy and the sidebar wouldn't update until a remount.
import { useSyncExternalStore } from "react";

const KEY = "sawo_preview_role";
export const PREVIEWABLE_ROLES = ["admin", "editor", "viewer"];

const listeners = new Set();
// useSyncExternalStore requires getSnapshot to be referentially stable
// between notifications, so cache the value instead of re-reading
// sessionStorage on every render (a fresh read is fine, but a fresh *object*
// would loop — this also avoids hitting storage on every render).
let snapshot = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(KEY) : null;

function emit() {
  listeners.forEach((fn) => fn());
}

export function getPreviewRole() {
  return snapshot;
}

export function setPreviewRole(role) {
  const next = role && PREVIEWABLE_ROLES.includes(role) ? role : null;
  if (next) {
    sessionStorage.setItem(KEY, next);
  } else {
    sessionStorage.removeItem(KEY);
  }
  if (snapshot !== next) {
    snapshot = next;
    emit();
  }
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Subscribes a component to preview-role changes. Every consumer re-renders
 * the moment the role is switched anywhere in the app — that's what makes
 * the sidebar badge and nav update instantly instead of on next navigation.
 */
export function usePreviewRole() {
  return useSyncExternalStore(subscribe, getPreviewRole, () => null);
}

// Only ever returns a preview role for an actual superadmin — a stale
// sessionStorage value left over from a role downgrade (or someone poking
// devtools) can never widen or narrow anyone else's real access.
export function getEffectiveRole(realRole) {
  if (realRole !== "superadmin") return realRole;
  return getPreviewRole() || realRole;
}
