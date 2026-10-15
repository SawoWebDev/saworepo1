// Administrator/AiTranslationSettings.jsx
//
// Settings card for AI product translation via OpenRouter.
//
// Keys are write-only from here: they're saved through the
// set_secure_setting() RPC into public.secure_settings (superadmin only,
// no client can read the table back — see
// the AI-translation SQL applied 2026-10-15). This card only ever shows a
// masked hint (••••abcd). The model name isn't secret, so it lives in
// app_settings like the other settings on this page.
import React, { useEffect, useState } from "react";
import { supabase, logActivity } from "./supabase";
import { callOpenRouter } from "./Translations/aiTranslation";

const MODEL_KEY = "openrouter_model";
const DEFAULT_MODEL = "anthropic/claude-haiku-5.5";
// Rough cost of one product-language (≈3K input + 1.5K output tokens —
// typical for a heater with a spec table), from the model's live price.
const estPerLanguage = (m) =>
  m.inputPerM == null ? null : (3000 * m.inputPerM + 1500 * m.outputPerM) / 1e6;
const fmtPrice = (n) => (n == null ? "?" : n < 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(n % 1 ? 2 : 0)}`);

const KEYS = [
  {
    key: "openrouter_api_key",
    label: "API Key",
    help: "Used for every translation request. Create one at openrouter.ai/keys.",
  },
  {
    key: "openrouter_management_key",
    label: "Management Key",
    help: "Optional. Only used to show the account's credit balance below.",
  },
];

const inputCls = "flex-1 min-w-[220px] px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm";
const money = (n) => (typeof n === "number" ? `$${n.toFixed(2)}` : "—");

export default function AiTranslationSettings({ currentUser, toast }) {
  const isSuperadmin = currentUser?.role === "superadmin";
  const [status, setStatus] = useState({});      // key -> { hint, updated_by, updated_at }
  const [drafts, setDrafts] = useState({});      // key -> typed value
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [modelDraft, setModelDraft] = useState(DEFAULT_MODEL);
  const [saving, setSaving] = useState(null);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState(null);
  const [setupError, setSetupError] = useState(null);
  const [models, setModels] = useState([]);     // shortlist with live pricing

  const loadStatus = async () => {
    const { data, error } = await supabase.rpc("get_secure_settings_status");
    if (error) {
      setSetupError(
        /does not exist|Could not find/i.test(error.message)
          ? "The AI translation tables are missing in Supabase (secure_settings / translation_jobs)."
          : error.message
      );
      return;
    }
    setSetupError(null);
    const map = {};
    for (const row of data || []) map[row.key] = row;
    setStatus(map);
  };

  useEffect(() => {
    loadStatus();
    supabase.from("app_settings").select("value").eq("key", MODEL_KEY).maybeSingle()
      .then(({ data }) => { if (data?.value) { setModel(data.value); setModelDraft(data.value); } });
    callOpenRouter({ action: "models" }).then((r) => setModels(r.models || [])).catch(() => {});
  }, []);

  const saveKey = async (key, value) => {
    setSaving(key);
    try {
      const { error } = await supabase.rpc("set_secure_setting", { p_key: key, p_value: value });
      if (error) throw new Error(error.message);
      setDrafts((d) => ({ ...d, [key]: "" }));
      await loadStatus();
      await logActivity({
        action: "update", entity: "secure_settings", entity_id: key,
        entity_name: `OpenRouter ${key === "openrouter_api_key" ? "API key" : "management key"} → ${value ? "updated" : "removed"}`,
        username: currentUser?.username, user_id: currentUser?.id,
      });
      toast(value ? "Key saved" : "Key removed", "success");
    } catch (err) {
      toast(`Saving key failed: ${err.message}`, "error");
    } finally {
      setSaving(null);
    }
  };

  const saveModel = async () => {
    const value = modelDraft.trim() || DEFAULT_MODEL;
    setSaving("model");
    try {
      const { error } = await supabase.from("app_settings").upsert({ key: MODEL_KEY, value, updated_by: currentUser?.username || null });
      if (error) throw new Error(error.message);
      setModel(value);
      toast("Model saved", "success");
    } catch (err) {
      toast(`Saving model failed: ${err.message}`, "error");
    } finally {
      setSaving(null);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    try {
      setTest(await callOpenRouter({ action: "status" }));
    } catch (err) {
      setTest({ error: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="card card-body break-inside-avoid mb-6">
      <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
        <i className="fa-solid fa-language text-[var(--brand)]"></i>
        AI Translation (OpenRouter)
      </h3>
      <p className="text-sm text-[var(--text-3)] mb-4">
        Powers the <b>Translate</b> button in Translations → Products. Keys are stored server-side
        and can't be read back — only the last 4 characters are shown.
        {!isSuperadmin && " Only a superadmin can change the keys."}
      </p>

      {setupError && (
        <p className="text-xs text-[var(--danger)] mb-4">
          <i className="fa-solid fa-triangle-exclamation mr-1"></i>{setupError}
        </p>
      )}

      {KEYS.map(({ key, label, help }) => {
        const current = status[key];
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-semibold text-[var(--text)] mb-1">{label}</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="password"
                autoComplete="off"
                value={drafts[key] || ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                disabled={!isSuperadmin || saving === key}
                placeholder={current ? `Saved (${current.hint}) — paste a new key to replace` : "sk-or-v1-…"}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => saveKey(key, (drafts[key] || "").trim())}
                disabled={!isSuperadmin || saving === key || !(drafts[key] || "").trim()}
                className="btn btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving === key ? "Saving..." : "Save"}
              </button>
              {current && isSuperadmin && (
                <button
                  type="button"
                  onClick={() => saveKey(key, "")}
                  disabled={saving === key}
                  className="btn btn-ghost text-sm px-3 py-2 disabled:opacity-50"
                  title="Remove this key"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--text-3)] mt-1">
              {current
                ? `Saved ${current.hint}${current.updated_by ? ` by ${current.updated_by}` : ""}${current.updated_at ? ` on ${new Date(current.updated_at).toLocaleDateString()}` : ""}. `
                : "Not set. "}
              {help}
            </p>
          </div>
        );
      })}

      <div className="mb-4">
        <label className="block text-sm font-semibold text-[var(--text)] mb-1">Model</label>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={modelDraft}
            onChange={(e) => setModelDraft(e.target.value)}
            disabled={saving === "model"}
            className={inputCls}
          >
            {!models.some((m) => m.id === modelDraft) && <option value={modelDraft}>{modelDraft}</option>}
            {models.map((m) => (
              <option key={m.id} value={m.id} disabled={!m.available}>
                {m.name.replace(/^[^:]+:\s*/, "")} — {fmtPrice(m.inputPerM)} in / {fmtPrice(m.outputPerM)} out per 1M tokens
                {m.available ? "" : " (unavailable)"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={saveModel}
            disabled={saving === "model" || modelDraft.trim() === model}
            className="btn btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving === "model" ? "Saving..." : "Save"}
          </button>
        </div>
        {(() => {
          const m = models.find((x) => x.id === modelDraft);
          const est = m && estPerLanguage(m);
          return (
            <p className="text-xs text-[var(--text-3)] mt-1">
              {m ? `${m.note}. ` : ""}
              {est != null && `≈ $${est.toFixed(3)} per product per language, ≈ $${(est * 7).toFixed(2)} for all 7 languages. `}
              Prices are live from OpenRouter.
            </p>
          );
        })()}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={runTest} disabled={testing} className="btn btn-ghost text-sm px-4 py-2 disabled:opacity-50">
          <i className={`fa-solid ${testing ? "fa-circle-notch fa-spin" : "fa-plug"} mr-1`}></i>
          {testing ? "Testing..." : "Test connection"}
        </button>
      </div>

      {test && (
        <div className="mt-3 text-xs text-[var(--text-2)] space-y-1">
          {test.error && <p className="text-[var(--danger)]"><i className="fa-solid fa-circle-xmark mr-1"></i>{test.error}</p>}
          {!test.error && (
            <>
              <p>Model: <b>{test.model}</b></p>
              {!test.hasApiKey && <p className="text-[var(--danger)]">No API key saved.</p>}
              {test.key && (test.key.error
                ? <p className="text-[var(--danger)]"><i className="fa-solid fa-circle-xmark mr-1"></i>API key: {test.key.error}</p>
                : <p className="text-[var(--success)]">
                    <i className="fa-solid fa-circle-check mr-1"></i>
                    API key works{test.key.label ? ` (${test.key.label})` : ""} — used {money(test.key.usage)}
                    {typeof test.key.limit === "number" ? ` of ${money(test.key.limit)} limit` : ", no spending limit"}
                  </p>)}
              {test.credits && (test.credits.error
                ? <p className="text-[var(--danger)]"><i className="fa-solid fa-circle-xmark mr-1"></i>Management key: {test.credits.error}</p>
                : <p className="text-[var(--success)]">
                    <i className="fa-solid fa-circle-check mr-1"></i>
                    Account balance: {money((test.credits.total_credits ?? 0) - (test.credits.total_usage ?? 0))}
                    {" "}({money(test.credits.total_usage)} used of {money(test.credits.total_credits)})
                  </p>)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
