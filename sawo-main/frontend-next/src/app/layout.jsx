// Minimal pass-through root layout — the real <html>/<body> live in
// app/[locale]/layout.jsx so `lang` can vary per locale. Next.js requires a
// root layout to exist even when it does nothing but render children.
export default function RootLayout({ children }) {
  return children;
}
