// Administrator/Translations/aiTranslation.js
//
// One AI translation step: (product, locale) -> product_translations.
// Reuses the exact same pipeline as the manual Update -> Apply flow
// (buildTranslationTask / applyTranslationTask), so freshness hashes, the
// "English changed meanwhile" guard and translation memory all behave the
// same. The only new part is who fills in `translated`: the
// openrouter-translate edge function instead of a person.
import { supabase } from "../supabase";
import { normalize } from "../Local/scripts/product-i18n-fields.js";
import {
  fetchProductById,
  fetchTranslationsForProduct,
  loadTranslationMemory,
  buildTranslationTask,
  applyTranslationTask,
} from "./translationData";

// English names for the prompt (PRODUCT_TRANSLATION_LOCALES labels are
// endonyms like "Suomi", less clear to the model as a target name).
export const LOCALE_NAMES = {
  fi: "Finnish", zh: "Simplified Chinese", ja: "Japanese", de: "German",
  fr: "French", es: "Spanish", th: "Thai",
};

export async function callOpenRouter(body) {
  const { data, error } = await supabase.functions.invoke("openrouter-translate", { body });
  if (error) {
    // FunctionsHttpError carries the JSON body in error.context.
    let message = error.message;
    try {
      const j = await error.context?.json?.();
      if (j?.error) message = j.error;
    } catch { /* keep the generic message */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// Short translation-memory entries that literally occur in this batch —
// passed as a glossary so the model reuses established terminology.
function glossaryFor(items, tm) {
  const haystack = items.map((i) => i.english).join("\n").toLowerCase();
  const out = [];
  for (const [source, translated] of tm) {
    if (source.length > 2 && source.length <= 60 && haystack.includes(source.toLowerCase())) {
      out.push({ source, translated });
      if (out.length >= 60) break;
    }
  }
  return out;
}

/**
 * Translates every missing/outdated field of one product into one locale and
 * applies it. `shouldContinue()` is checked right before writing, so a
 * Cancel during the model call discards that locale instead of applying it.
 * Returns { applied, skipped } field counts.
 */
export async function translateLocaleForProduct({ productId, locale, currentUser, jobId = null, shouldContinue = async () => true }) {
  const [product, byLocale, tm] = await Promise.all([
    fetchProductById(productId),
    fetchTranslationsForProduct(productId),
    loadTranslationMemory(locale),
  ]);
  const task = buildTranslationTask(product, locale, byLocale[locale] || null, tm);
  if (task.items.length === 0) return { applied: 0, skipped: 0 };

  // TM exact matches are already correct translations; everything else
  // (including stale fields, whose prefill is the OLD translation) goes to
  // the model, with the old translation passed as a terminology reference.
  const toTranslate = task.items.filter((i) => !i.tmPrefilled && typeof i.english === "string" && i.english.trim());
  let results = {};
  if (toTranslate.length) {
    const res = await callOpenRouter({
      action: "translate",
      locale,
      localeName: LOCALE_NAMES[locale] || locale,
      productName: product.name,
      productId,
      jobId,
      items: toTranslate.map((i, idx) => ({ id: String(idx), text: i.english, previous: i.existingTranslation || undefined })),
      glossary: glossaryFor(toTranslate, tm),
    });
    toTranslate.forEach((i, idx) => {
      const t = res.translations?.[String(idx)];
      if (typeof t === "string" && t.trim()) results[i.path] = t;
    });
  }

  const items = task.items
    .map((i) => (i.tmPrefilled ? i : { ...i, translated: results[i.path] ?? null }))
    .filter((i) => typeof i.translated === "string" && normalize(i.translated));
  // Nothing usable is only an error when there WAS text to translate; a task
  // made purely of empty-in-English fields just needs its freshness record.
  const hadText = task.items.some((i) => typeof i.english === "string" && i.english.trim());
  if (items.length === 0 && hadText) throw new Error(`The model returned no usable ${locale} text.`);

  if (!(await shouldContinue())) return { applied: 0, skipped: task.items.length, cancelled: true };

  await applyTranslationTask({ ...task, items, currentUser });
  return { applied: items.length, skipped: task.items.length - items.length };
}
