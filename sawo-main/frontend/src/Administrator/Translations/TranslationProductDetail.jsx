// Administrator/Translations/TranslationProductDetail.jsx
//
// Dedicated sub-route (/admin/translations/products/:productId) — the
// English source, every language's status, the changed-fields list for
// whichever locale is selected, and the Update -> review -> Apply flow.
// A sub-route rather than a modal, per explicit product decision (trades
// away modal-consistency-with-Products.jsx for a bookmarkable/shareable
// per-product translation URL).
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getPerms } from "../permissions";
import {
  fetchProductById,
  fetchTranslationsForProduct,
  loadTranslationMemory,
  buildTranslationTask,
  applyTranslationTask,
} from "./translationData";
import { fieldStatusesForProduct, rollupStatus, FIELD_STATUS } from "../Local/translationStatus";
import { PRODUCT_TRANSLATION_LOCALES } from "../../i18n/productTranslationLocales";
import StatusIcon from "./StatusIcon";

// ─── UI primitives — copied from Products.jsx (Modal/Confirm/Btn/useToast
// aren't exported from there; every prior admin page that needed them has
// copied the pattern rather than importing across pages, see
// Administrator/Products.jsx:333-415). Extracting to a shared file is a
// reasonable fast-follow, not part of this build. ──────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5500);
  };
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  return { toasts, add, remove };
}

function Toast({ toasts, remove }) {
  const icons = { error: "fa-circle-xmark", success: "fa-circle-check", info: "fa-circle-info", warning: "fa-triangle-exclamation" };
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <i className={`fa-solid ${icons[t.type]}`} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button className="toast-close" onClick={() => remove(t.id)}></button>
        </div>
      ))}
    </div>
  );
}

function Btn({ loading, label, onClick, type = "button", variant = "primary", icon, size, disabled }) {
  const cls = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : ""].filter(Boolean).join(" ");
  return (
    <button type={type} disabled={loading || disabled} onClick={onClick} className={cls}>
      {loading ? <i className="fa-solid fa-spinner" style={{ animation: "spin 1s linear infinite" }} /> : icon && <i className={`fa-solid ${icon}`} style={{ fontSize: "0.85em" }} />}
      {label}
    </button>
  );
}

// ─── page ───────────────────────────────────────────────────────────────
export default function TranslationProductDetail({ currentUser }) {
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const perms = getPerms(currentUser);
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const [product, setProduct] = useState(null);
  const [translationsByLocale, setTranslationsByLocale] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeLocale = searchParams.get("locale") || PRODUCT_TRANSLATION_LOCALES[0].code;
  const [task, setTask] = useState(null); // { items, expected_source_hashes, ... } once "Update" is clicked
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, t] = await Promise.all([fetchProductById(productId), fetchTranslationsForProduct(productId)]);
      setProduct(p);
      setTranslationsByLocale(t);
      setTask(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const startTask = async (locale) => {
    setTask(null);
    try {
      const tm = await loadTranslationMemory(locale);
      const built = buildTranslationTask(product, locale, translationsByLocale[locale] || null, tm);
      setTask(built);
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const updateItemTranslation = (path, value) => {
    setTask((t) => ({ ...t, items: t.items.map((i) => (i.path === path ? { ...i, translated: value } : i)) }));
  };

  const apply = async () => {
    if (!task) return;
    setApplying(true);
    try {
      await applyTranslationTask({ ...task, currentUser });
      addToast(`Applied ${task.items.length} field(s) for ${task.locale.toUpperCase()}.`, "success");
      await load();
    } catch (err) {
      if (err.code === "SOURCE_CHANGED") {
        addToast(err.message, "warning");
      } else {
        addToast(err.message, "error");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="table-loading">
        <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="alert alert-error">
        <i className="fa-solid fa-circle-exclamation" /> {error || "Product not found."}
      </div>
    );
  }

  const fieldStatuses = fieldStatusesForProduct(product, translationsByLocale[activeLocale] || null);
  const changedFields = fieldStatuses.filter((f) => f.status !== FIELD_STATUS.CURRENT);

  return (
    <div>
      <Toast toasts={toasts} remove={removeToast} />

      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/translations" style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>
          <i className="fa-solid fa-arrow-left" /> Back to Translations
        </Link>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginTop: 6 }}>{product.name}</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>
        {/* ── Locale status list ── */}
        <div>
          <h3 style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
            Translation Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {PRODUCT_TRANSLATION_LOCALES.map((l) => {
              const row = translationsByLocale[l.code] || null;
              const status = rollupStatus(product, row);
              const isActive = l.code === activeLocale;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setSearchParams({ locale: l.code })}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                    padding: "8px 10px", borderRadius: "var(--r-sm)", border: "1px solid transparent",
                    background: isActive ? "var(--surface-2)" : "transparent",
                    borderColor: isActive ? "var(--border)" : "transparent",
                    cursor: "pointer", textAlign: "left", font: "inherit",
                  }}
                >
                  <span>{l.label}</span>
                  <StatusIcon status={status} />
                </button>
              );
            })}
          </div>
          {changedFields.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <Btn label={`Update ${activeLocale.toUpperCase()}`} icon="fa-language" onClick={() => startTask(activeLocale)} disabled={!perms.can("translations.apply")} />
            </div>
          )}
        </div>

        {/* ── Detail / task ── */}
        <div>
          {task && task.locale === activeLocale ? (
            <TaskReview
              task={task}
              onChangeItem={updateItemTranslation}
              onApply={apply}
              onCancel={() => setTask(null)}
              applying={applying}
              canApply={perms.can("translations.apply")}
            />
          ) : (
            <ChangedFieldsList
              locale={activeLocale}
              product={product}
              fieldStatuses={fieldStatuses}
              changedFields={changedFields}
              translationRow={translationsByLocale[activeLocale] || null}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ChangedFieldsList({ locale, changedFields, fieldStatuses }) {
  if (changedFields.length === 0) {
    return (
      <div style={{ color: "var(--success)", fontSize: "0.9rem" }}>
        <i className="fa-solid fa-circle-check" /> Everything is current for {locale.toUpperCase()}.
      </div>
    );
  }
  return (
    <div>
      <h3 style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
        Changed fields ({changedFields.length} of {fieldStatuses.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {changedFields.map((f) => (
          <div key={f.path} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <code style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{f.path}</code>
              <StatusIcon status={f.status} showLabel />
            </div>
            <div style={{ fontSize: "0.85rem" }}>{f.value || <em style={{ color: "var(--text-3)" }}>(empty)</em>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskReview({ task, onChangeItem, onApply, onCancel, applying, canApply }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>
          Review — {task.locale.toUpperCase()} ({task.items.length} field(s))
        </h3>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {task.items.map((item) => (
          <div key={item.path} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <code style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{item.path}</code>
              {item.tmPrefilled && (
                <span style={{ fontSize: "0.72rem", color: "var(--success)" }}>
                  <i className="fa-solid fa-database" /> Translation memory match
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-3)", marginBottom: 6 }}>
              <strong>English:</strong> {item.english || <em>(empty)</em>}
            </div>
            {item.existingTranslation && item.existingTranslation !== item.translated && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginBottom: 6 }}>
                <strong>Previous:</strong> {item.existingTranslation}
              </div>
            )}
            <textarea
              value={item.translated || ""}
              onChange={(e) => onChangeItem(item.path, e.target.value)}
              rows={item.english && item.english.length > 80 ? 3 : 1}
              style={{ width: "100%", fontFamily: "inherit", fontSize: "0.85rem" }}
              placeholder="Leave blank to use the English value"
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <Btn label="Apply" icon="fa-check" onClick={onApply} loading={applying} disabled={!canApply} />
        <Btn label="Cancel" variant="ghost" onClick={onCancel} />
      </div>
      {!canApply && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 8 }}>
          Your role can view translation status but not apply changes.
        </p>
      )}
    </div>
  );
}
