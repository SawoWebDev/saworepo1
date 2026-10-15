// supabase/functions/openrouter-translate/index.ts
//
// Server-side proxy between the admin CMS and OpenRouter. The OpenRouter
// keys live in public.secure_settings (RLS on, no policies — see
// the AI-translation SQL applied 2026-10-15), which only this
// function can read via the service role. The browser never sees a key.
//
// Actions (POST JSON body):
//   { action: "status" }   admin/superadmin — key label/usage/limit, and
//                          account credits when a management key is set.
//   { action: "translate", locale, localeName, productName,
//     items: [{ id, text, previous? }], glossary: [{ source, translated }] }
//                          editor/admin/superadmin — returns { translations: { id: text } }
//                          Optional context: productId, jobId (logged to ai_usage_log).
//   { action: "models" }   curated translation-model shortlist with live
//                          OpenRouter pricing, for the Settings dropdown.
//
// Every translate call (success or failure) is logged to public.ai_usage_log
// with OpenRouter's exact billed cost (usage accounting) — this feeds
// Translations > AI Usage. Logging is best-effort: it never fails a call.
//
// Deploy: supabase functions deploy openrouter-translate
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MODEL = "anthropic/claude-haiku-5.5";
const OPENROUTER = "https://openrouter.ai/api/v1";
const TRANSLATE_ROLES = ["editor", "admin", "superadmin"];
const STATUS_ROLES = ["admin", "superadmin"];

// Shortlist for the Settings dropdown — models that handle HTML-preserving
// product copy in Thai/Japanese/Chinese well, from premium to budget.
const TRANSLATION_MODELS = [
  { id: "anthropic/claude-haiku-5.5", note: "Recommended for routine work — about 20x cheaper than Sonnet, same family and HTML handling" },
  { id: "google/gemini-2.5-flash-lite", note: "Budget alternative — very cheap, good multilingual" },
  { id: "openai/gpt-5-nano", note: "Budget alternative — cheapest input price" },
  { id: "deepseek/deepseek-v4-flash", note: "Cheapest overall — spot-check Thai/Japanese output" },
  { id: "google/gemini-2.5-flash", note: "Mid-range — fast, ~5x Haiku cost" },
  { id: "openai/gpt-5-mini", note: "Mid-range alternative" },
  { id: "anthropic/claude-sonnet-5.5", note: "Premium — use for important or marketing-heavy copy (~20x Haiku cost)" },
  { id: "anthropic/claude-opus-5.5", note: "Highest quality — rarely needed for catalogue copy" },
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function buildPrompt(localeName: string, locale: string, productName: string, glossary: { source: string; translated: string }[]) {
  const gloss = glossary.length
    ? `\nGlossary — when the English term appears, use exactly this translation:\n${glossary.map((g) => `- "${g.source}" => "${g.translated}"`).join("\n")}\n`
    : "";
  return `You are a professional translator for SAWO, a Finnish manufacturer of sauna heaters, sauna controls, steam generators, sauna rooms and sauna accessories.
Translate product catalogue content for "${productName}" from English into ${localeName} (locale code "${locale}").

Rules:
- Reply with ONLY a JSON object: {"translations": {"<id>": "<translated text>", ...}} containing every id you were given.
- Keep all HTML exactly: same tags, attributes, entities, <br> and line breaks, in the same order. Translate only the human-readable text between tags.
- Inside HTML tables, translate header cells and descriptive labels; leave cells that are only model codes, numbers or measurements unchanged.
- Never translate or alter brand/product-line names (SAWO, Saunova, Innova, Nordex, Krios, Aries, Cubos, Tower, Scandia, Scandifire, Minidragon, Dragonfire, Kivistone, Cumulus, Nimbus, Phoenix, Heaterking, etc.), model codes (e.g. NB, NS, Ni2, SAU-UI-V2, 1313MS, STN-45-C1/3), numbers, units (kW, V, W, Hz, A, mm, cm, kg, m³, °C, h) or URLs.
- Keep the spacing between numbers and units exactly as in the English.
- Natural, concise product-catalogue tone for native ${localeName} readers.${locale === "zh" ? " Use Simplified Chinese." : ""}
- If an item includes "previous", it is the earlier translation of an older English version: keep its terminology where the meaning did not change.
${gloss}`;
}

function parseJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  return JSON.parse(text.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // ── who is calling ────────────────────────────────────────────────────
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: authData } = await admin.auth.getUser(jwt);
  if (!authData?.user) {
    return json({ error: "Not signed in. Log out and back in to the CMS, then try again." }, 401);
  }
  const { data: profile } = await admin
    .from("users").select("username, role").eq("auth_user_id", authData.user.id).maybeSingle();
  if (!profile) return json({ error: "No CMS account is linked to this login." }, 403);

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  // ── keys + model ──────────────────────────────────────────────────────
  const { data: secrets, error: secretsErr } = await admin.from("secure_settings").select("key, value");
  if (secretsErr) return json({ error: `Reading API keys: ${secretsErr.message}` }, 500);
  const secret = (k: string) => secrets?.find((s) => s.key === k)?.value || null;
  const apiKey = secret("openrouter_api_key");
  const mgmtKey = secret("openrouter_management_key");
  const { data: modelRow } = await admin.from("app_settings").select("value").eq("key", "openrouter_model").maybeSingle();
  const model = (modelRow?.value as string) || DEFAULT_MODEL;

  // ── status ────────────────────────────────────────────────────────────
  if (body.action === "status") {
    if (!STATUS_ROLES.includes(profile.role)) return json({ error: "Admins only." }, 403);
    const out: Record<string, unknown> = { model, hasApiKey: !!apiKey, hasManagementKey: !!mgmtKey };
    if (apiKey) {
      const r = await fetch(`${OPENROUTER}/key`, { headers: { Authorization: `Bearer ${apiKey}` } });
      const j = await r.json().catch(() => ({}));
      out.key = r.ok ? j.data : { error: j?.error?.message || `HTTP ${r.status}` };
    }
    if (mgmtKey) {
      const r = await fetch(`${OPENROUTER}/credits`, { headers: { Authorization: `Bearer ${mgmtKey}` } });
      const j = await r.json().catch(() => ({}));
      out.credits = r.ok ? j.data : { error: j?.error?.message || `HTTP ${r.status}` };
    }
    return json(out);
  }

  // ── models ────────────────────────────────────────────────────────────
  if (body.action === "models") {
    const r = await fetch(`${OPENROUTER}/models`);
    const j = await r.json().catch(() => ({ data: [] }));
    const byId = new Map((j.data || []).map((m: any) => [m.id, m]));
    const models = TRANSLATION_MODELS.map((t) => {
      const m: any = byId.get(t.id);
      return {
        id: t.id,
        note: t.note,
        available: !!m,
        name: m?.name || t.id,
        inputPerM: m ? parseFloat(m.pricing?.prompt) * 1e6 : null,
        outputPerM: m ? parseFloat(m.pricing?.completion) * 1e6 : null,
      };
    });
    return json({ models, current: model });
  }

  // ── translate ─────────────────────────────────────────────────────────
  if (body.action === "translate") {
    if (!TRANSLATE_ROLES.includes(profile.role)) return json({ error: "You don't have permission to translate." }, 403);
    if (!apiKey) return json({ error: "No OpenRouter API key is set. Add one in Settings → AI Translation." }, 400);

    const { locale, localeName, productName = "", items = [], glossary = [], productId = null, jobId = null } = body;
    if (!locale || !Array.isArray(items) || items.length === 0) return json({ error: "Nothing to translate." }, 400);

    const logUsage = (row: Record<string, unknown>) =>
      admin.from("ai_usage_log").insert({
        action: "translate", model, locale, product_name: productName || null,
        product_id: productId, job_id: jobId, username: profile.username, ...row,
      }).then(() => {}, () => {});

    const payload = items.map((i: any) => (i.previous ? { id: i.id, text: i.text, previous: i.previous } : { id: i.id, text: i.text }));
    const started = Date.now();
    const r = await fetch(`${OPENROUTER}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.sawo.com",
        "X-Title": "SAWO CMS Translations",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        usage: { include: true },
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildPrompt(localeName || locale, locale, productName, glossary.slice(0, 60)) },
          { role: "user", content: JSON.stringify({ items: payload }) },
        ],
      }),
    });
    const j = await r.json().catch(() => ({}));
    const usage = j.usage || {};
    const metrics = {
      model: j.model || model,
      provider: j.provider || null,
      prompt_tokens: usage.prompt_tokens ?? null,
      completion_tokens: usage.completion_tokens ?? null,
      total_tokens: usage.total_tokens ?? null,
      cost: typeof usage.cost === "number" ? usage.cost : null,
      latency_ms: Date.now() - started,
    };
    if (!r.ok) {
      const error = `OpenRouter: ${j?.error?.message || `HTTP ${r.status}`}`;
      await logUsage({ ...metrics, status: "error", error });
      return json({ error }, 502);
    }

    try {
      const parsed = parseJsonObject(j.choices?.[0]?.message?.content || "");
      await logUsage({ ...metrics, status: "ok" });
      return json({ translations: parsed.translations || {}, model, usage });
    } catch (e) {
      const error = `Could not read the model's reply: ${(e as Error).message}`;
      await logUsage({ ...metrics, status: "error", error });
      return json({ error }, 502);
    }
  }

  return json({ error: "Unknown action" }, 400);
});
