// Product search will query the Supabase/data layer once the product pages are
// ported (Phase 0 remaining work). Until then it returns no product hits, so
// the header search still works for navigating to pages.
export async function searchProducts() {
  return [];
}
