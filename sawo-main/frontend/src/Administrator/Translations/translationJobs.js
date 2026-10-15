// Administrator/Translations/translationJobs.js
//
// "Translate" button jobs. A job is a translation_jobs row (see
// the AI-translation SQL applied 2026-10-15); the admin browser works through
// it one locale at a time. Because the state is in the database, not in
// React state:
//   - a page refresh picks the job straight back up (this tab's runner id
//     is kept in sessionStorage, so it re-claims its own job immediately)
//   - navigating to other admin pages keeps it going (the runner is
//     mounted in AdminLayout, not on the Translations page)
//   - if the tab is closed, the job pauses; the next admin who opens the
//     CMS takes it over once its heartbeat is >90s old
//   - Cancel just flips status to 'cancelled'; the runner sees it at the
//     next heartbeat and stops (a locale mid-translation is discarded)
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import { translateLocaleForProduct } from "./aiTranslation";
import { refreshPendingCount } from "./translationPending";

const EVENT = "admin:translation-jobs";
const ACTIVE = ["queued", "running"];
const RECENT_MS = 10 * 60 * 1000;

function runnerId() {
  try {
    let id = sessionStorage.getItem("admin:translation-runner");
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`).toString();
      sessionStorage.setItem("admin:translation-runner", id);
    }
    return id;
  } catch {
    return "volatile-runner";
  }
}

const emit = () => window.dispatchEvent(new Event(EVENT));

// ── actions ─────────────────────────────────────────────────────────────
export async function startTranslationJob({ product, locales, currentUser }) {
  const { error } = await supabase.from("translation_jobs").insert({
    product_id: product.id,
    product_name: product.name,
    locales,
    created_by: currentUser?.username || null,
  });
  if (error) {
    if (error.code === "23505") throw new Error("This product is already being translated.");
    if (error.code === "42P01") throw new Error("The translation_jobs table is missing in Supabase.");
    throw new Error(error.message);
  }
  emit();
}

export async function cancelTranslationJob(jobId) {
  const { error } = await supabase
    .from("translation_jobs")
    .update({ status: "cancelled", finished_at: new Date().toISOString(), updated_at: new Date().toISOString(), current_locale: null })
    .eq("id", jobId)
    .in("status", ACTIVE);
  if (error) throw new Error(error.message);
  emit();
}

// ── grid hook: latest job per product (active, or finished recently) ────
export function useTranslationJobs({ onJobFinished } = {}) {
  const [jobs, setJobs] = useState({});
  const prevActive = useRef(new Set());
  const finishedCb = useRef(onJobFinished);
  finishedCb.current = onJobFinished;

  const load = useCallback(async () => {
    const since = new Date(Date.now() - RECENT_MS).toISOString();
    const { data, error } = await supabase
      .from("translation_jobs")
      .select("id, product_id, locales, done_locales, current_locale, status, error, created_at, finished_at")
      .or(`status.in.(queued,running),finished_at.gte.${since}`)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return;
    const byProduct = {};
    for (const j of data || []) if (!byProduct[j.product_id]) byProduct[j.product_id] = j;
    setJobs(byProduct);

    const nowActive = new Set(Object.values(byProduct).filter((j) => ACTIVE.includes(j.status)).map((j) => j.id));
    const finished = [...prevActive.current].some((id) => !nowActive.has(id));
    prevActive.current = nowActive;
    if (finished) finishedCb.current?.();
  }, []);

  const anyActive = Object.values(jobs).some((j) => ACTIVE.includes(j.status));

  useEffect(() => {
    load();
    window.addEventListener(EVENT, load);
    const t = setInterval(load, anyActive ? 3000 : 20000);
    return () => { window.removeEventListener(EVENT, load); clearInterval(t); };
  }, [load, anyActive]);

  return jobs;
}

// ── runner (mounted once, in AdminLayout) ───────────────────────────────
export function useTranslationJobRunner(enabled, currentUser) {
  const busy = useRef(false);
  const userRef = useRef(currentUser);
  userRef.current = currentUser;

  useEffect(() => {
    if (!enabled) return undefined;
    const me = runnerId();
    let stopped = false;

    const touch = (job, locale, done) =>
      supabase.rpc("touch_translation_job", { p_job: job.id, p_runner: me, p_current: locale, p_done: done });

    // One locale. Resolves "running" when it finished normally, "failed"
    // when it errored (job already marked failed), or the job's new status
    // ("cancelled") when someone clicked Cancel meanwhile.
    const runLocale = async (job, locale, done) => {
      let lastStatus = "running";
      // Keep the heartbeat fresh during the (possibly long) model call.
      const beat = setInterval(async () => {
        const { data } = await touch(job, locale, done);
        if (data) lastStatus = data;
      }, 20000);
      const shouldContinue = async () => {
        const { data } = await touch(job, locale, done);
        if (data) lastStatus = data;
        return lastStatus === "running" && !stopped;
      };
      try {
        try {
          await translateLocaleForProduct({ productId: job.product_id, locale, jobId: job.id, currentUser: userRef.current, shouldContinue });
        } catch (err) {
          // English edited mid-translation: rebuild against the new text once.
          if (err.code !== "SOURCE_CHANGED") throw err;
          await translateLocaleForProduct({ productId: job.product_id, locale, jobId: job.id, currentUser: userRef.current, shouldContinue });
        }
        return lastStatus;
      } catch (err) {
        await supabase.rpc("finish_translation_job", { p_job: job.id, p_runner: me, p_status: "failed", p_error: `${locale.toUpperCase()}: ${err.message}` });
        return "failed";
      } finally {
        clearInterval(beat);
      }
    };

    const processJob = async (job) => {
      const done = [...(job.done_locales || [])];
      for (const locale of job.locales) {
        if (stopped) return;
        if (done.includes(locale)) continue;
        const { data: status } = await touch(job, locale, done);
        emit();
        if (status !== "running") return;
        const result = await runLocale(job, locale, done);
        if (result !== "running") return emit();
        done.push(locale);
      }
      await touch(job, null, done);
      await supabase.rpc("finish_translation_job", { p_job: job.id, p_runner: me, p_status: "done", p_error: null });
      refreshPendingCount().catch(() => {});
      emit();
    };

    const tick = async () => {
      if (busy.current || stopped) return;
      busy.current = true;
      try {
        const { data: jobs, error } = await supabase
          .from("translation_jobs")
          .select("id")
          .in("status", ACTIVE)
          .order("created_at", { ascending: true });
        if (error || !jobs?.length) return;
        for (const { id } of jobs) {
          const { data: claimed } = await supabase.rpc("claim_translation_job", { p_job: id, p_runner: me });
          if (claimed?.length) {
            await processJob(claimed[0]);
            break;
          }
        }
      } catch {
        /* network blip — try again next tick */
      } finally {
        busy.current = false;
      }
    };

    tick();
    const t = setInterval(tick, 5000);
    window.addEventListener(EVENT, tick);
    return () => { stopped = true; clearInterval(t); window.removeEventListener(EVENT, tick); };
  }, [enabled]);
}
