// ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "./supabase";
import { can, getLandingPath } from "./permissions";
import { getEffectiveRole } from "./previewRole";

/**
 * Protects routes by checking authentication and (optionally) capabilities
 *
 * @param {React.ReactNode} children - The component to render if access is granted
 * @param {string} [requiredCap] - Optional capability required (e.g., "page.users")
 *                                 If not provided, only auth is checked
 * @param {string} [redirectTo] - Where to redirect if the capability check fails.
 *                                Defaults to the role's own landing page — NOT a
 *                                hardcoded /admin/dashboard, which a viewer can't
 *                                access and would bounce off of forever.
 */
export default function ProtectedRoute({ children, requiredCap, redirectTo }) {
  const session = getSession();

  // Not authenticated — redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Capability check (if required) — uses the effective (possibly
  // previewed) role, so a superadmin previewing as "viewer" sees exactly
  // what a viewer would if they navigated straight to this URL.
  const effectiveRole = getEffectiveRole(session.user.role);
  if (requiredCap && !can(effectiveRole, requiredCap)) {
    return <Navigate to={redirectTo || getLandingPath(effectiveRole)} replace />;
  }
  return children;
}
