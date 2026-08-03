// Site-wide product search for the header SearchBar. Matches a query against
// name, brand, type, short_description, and each product's variant codes
// (e.g. a heater model number like "SW3-45NB") via the search_products
// Postgres function — matching inside a jsonb array isn't expressible
// through PostgREST's own filter syntax, so the matching logic lives in one
// SQL function instead of being duplicated/approximated client-side.
//
// Plain REST fetch (not the Supabase SDK), same reasoning as
// translation/settings.js: this runs from a 'use client' component on every
// keystroke (debounced), so it stays a couple of KB instead of pulling in
// the SDK for a client bundle that already has enough to load.
export async function searchProducts(query, limit = 8) {
  const term = query?.trim();
  if (!term) return [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const res = await fetch(`${url}/rest/v1/rpc/search_products`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ search_query: term, result_limit: limit }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    return (rows || []).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      thumbnail: r.thumbnail,
      matchedField: r.matched_field,
      matchedValue: r.matched_value,
    }));
  } catch (err) {
    console.warn('[lib/search] searchProducts failed:', err.message);
    return [];
  }
}
