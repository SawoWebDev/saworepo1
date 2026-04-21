// ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "./supabase";
import { can } from "./permissions";

/**
 * Protects routes by checking authentication and (optionally) capabilities
 *
 * @param {React.ReactNode} children - The component to render if access is granted
 * @param {string} [requiredCap] - Optional capability required (e.g., "page.users")
 *                                 If not provided, only auth is checked
 * @param {string} [redirectTo="/admin/products"] - Where to redirect if capability check fails
 */
export default function ProtectedRoute({ children, requiredCap, redirectTo = "/admin/products" }) {
  const session = getSession();

  // Not authenticated — redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Capability check (if required)
  if (requiredCap && !can(session.user.role, requiredCap)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}






