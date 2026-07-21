  import Header from "../components/Header/Header";
  import Footer from "../components/Footer/Footer";
  import { usePageTracking } from "../local-storage/track";
  import { usePostHogTracking } from "../lib/posthog";

  export default function MainLayout({ children }) {
    // Lightweight first-party page-view tracking (skips admins; ~300B POST
    // per route change, feeds /admin/analytics). See local-storage/track.js.
    usePageTracking();

    // PostHog: session replay + (future) funnel events only — no pageviews,
    // no geo, production-only, admins excluded. See lib/posthog.js.
    usePostHogTracking();

    return (
      <div className="flex flex-col min-h-screen bg-white text-[#333] font-[Montserrat] transition-colors duration-300">
        {/* Fixed header with highest z-index */}
        <Header />

        {/* Main content */}
        <main className="flex-1 relative z-0">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    );
  }
