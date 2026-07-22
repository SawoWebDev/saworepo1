import React, { lazy, Suspense, useEffect, useState } from "react";
import { getGDPRBannerEnabled } from "../local-storage/gdprSettings";

// GDPRConsent.jsx is only dynamically imported when the admin toggle is on
// — when it's off (the default), this component does nothing beyond one
// cached settings read, and the banner's code never enters the bundle path
// at all. Fixes the "static top-level import ships in every page load"
// cost the banner used to have when it was permanently commented in/out
// in App.jsx instead of toggled.
const GDPRConsent = lazy(() => import("./GDPRConsent"));

export default function GDPRConsentGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    getGDPRBannerEnabled().then(setEnabled).catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <GDPRConsent />
    </Suspense>
  );
}
