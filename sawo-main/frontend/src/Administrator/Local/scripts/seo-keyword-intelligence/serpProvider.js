// serpProvider.js
// Pluggable SERP-checking interface for Phase 4. Swapping providers later
// (e.g. adding a paid DataForSEO implementation) means writing one new file
// that exports `checkPosition` in this same shape and adding one branch to
// getSerpProvider — no caller changes, per the spec's definition of done.
//
// checkPosition(keyword, domain) => Promise<{ position: number|null, url: string|null, checkedAt: string }>
//   position/url are null when the domain wasn't found in the results the
//   provider returned (i.e. "not in top N", not an error).
import { checkPositionViaSerpApi } from "./serpApiProvider.js";

export function getSerpProvider(providerName = process.env.SERP_PROVIDER || "serpapi") {
  switch (providerName) {
    case "serpapi":
      return { checkPosition: checkPositionViaSerpApi };
    default:
      throw new Error(`Unknown SERP_PROVIDER "${providerName}". Known providers: serpapi`);
  }
}
