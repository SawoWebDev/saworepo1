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
const KEY = "sawo_preview_role";
export const PREVIEWABLE_ROLES = ["admin", "editor", "viewer"];

export function getPreviewRole() {
  return sessionStorage.getItem(KEY) || null;
}

export function setPreviewRole(role) {
  if (role && PREVIEWABLE_ROLES.includes(role)) {
    sessionStorage.setItem(KEY, role);
  } else {
    sessionStorage.removeItem(KEY);
  }
}

// Only ever returns a preview role for an actual superadmin — a stale
// sessionStorage value left over from a role downgrade (or someone poking
// devtools) can never widen or narrow anyone else's real access.
export function getEffectiveRole(realRole) {
  if (realRole !== "superadmin") return realRole;
  return getPreviewRole() || realRole;
}
