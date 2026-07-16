// src/inline-edit/adminSession.js
// Dependency-free session check, mirroring Administrator/supabase.js's
// getSession(). Kept import-free so checking "is anyone logged in" never
// pulls Supabase (or anything else) into a logged-out visitor's bundle.

const TOKEN_KEY = "sawo_token";
const USER_KEY = "sawo_user";

export function hasAdminSession() {
  try {
    return !!(localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY));
  } catch {
    return false;
  }
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
