// src/inline-edit/AdminEditSystem.jsx
// Entry point for the admin-only chunk (React.lazy'd from EditProvider).
// Everything imported from here — AdminBar, saveAndPublish (Supabase upsert
// + GitHub sync streaming) — is only ever fetched for a logged-in admin.
import AdminBar from "./AdminBar";

export default function AdminEditSystem() {
  return <AdminBar />;
}
