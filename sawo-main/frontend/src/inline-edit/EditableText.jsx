// src/inline-edit/EditableText.jsx
//
// Wraps a piece of page text. Outside edit mode it just renders `as` with the
// site_content value (falling back to `children`, the hardcoded default) —
// identical cost to the merge-over-defaults pattern Home already uses.
//
// Usage:
//   <EditableText page="about" section="hero" path="title" as="h1">
//     We are SAWO
//   </EditableText>
//
//   Rich text (bold/italic/links; only use where the original content
//   actually has formatting — see sanitizeHtml for the allowed tags):
//   <EditableText page="about" section="story" path="intro_html" as="p" rich>
//     {"Plain text with maybe <b>bold</b> in it"}
//   </EditableText>
//
//   Popover mode — for text nested inside a Link/button, or that's itself
//   absolutely positioned (e.g. a caption with `inset-0`), where turning the
//   text into a focus target — or wrapping it in a new element — would fight
//   the surrounding layout. Renders a small pencil button that opens a
//   one-line editor instead of making the text contentEditable. The pencil
//   and editor are positioned with `position: fixed`, computed from the
//   text's own getBoundingClientRect(), so no wrapping element is ever
//   introduced around `Tag` — its layout/positioning is untouched:
//   <EditableText page="home" section="hero" path="button_text" popover>
//     {buttonText}
//   </EditableText>
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditableField } from "./EditProvider";
import { sanitizeHtml } from "./sanitizeHtml";
import { useElementRect } from "./useElementRect";

// Stops both React's synthetic bubbling (which follows the React tree even
// through a portal) and the browser's native "follow the link" default
// action (stopPropagation alone does NOT prevent that — only
// preventDefault does, and it must be called by *something* in the event's
// path, which a stopped-before-reaching-the-Link event never triggers).
function stopNav(e) {
  e.preventDefault();
  e.stopPropagation();
}

export default function EditableText({
  page, section, path, as: Tag = "span", rich = false, popover = false,
  className, style, children,
}) {
  const { value, editMode, setValue } = useEditableField({ page, section, path });
  const ref = useRef(null);
  const [showPopover, setShowPopover] = useState(false);
  const [draft, setDraft] = useState("");
  const rect = useElementRect(ref, editMode && popover);

  const hasValue = value !== undefined && value !== null && value !== "";
  const display = hasValue ? value : children;

  // ── Popover mode ────────────────────────────────────────────────────────
  if (editMode && popover) {
    return (
      <>
        <Tag ref={ref} className={className} style={style} onClick={stopNav}>
          {display}
        </Tag>
        {rect && createPortal(
          <>
            <button
              type="button"
              className="sawo-edit-pencil sawo-edit-pencil-fixed"
              title="Edit text"
              style={{ position: "fixed", top: rect.top - 2, left: rect.right + 4, zIndex: 100000 }}
              onClick={(e) => {
                stopNav(e);
                setDraft(typeof display === "string" ? display : "");
                setShowPopover(true);
              }}
            >
              ✎
            </button>
            {showPopover && (
              <span
                className="sawo-edit-popover sawo-edit-popover-fixed"
                style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, zIndex: 100000 }}
                onClick={stopNav}
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { setValue(draft); setShowPopover(false); }
                    if (e.key === "Escape") setShowPopover(false);
                  }}
                />
                <button type="button" onClick={(e) => { stopNav(e); setValue(draft); setShowPopover(false); }}>Save</button>
                <button type="button" onClick={(e) => { stopNav(e); setShowPopover(false); }}>Cancel</button>
              </span>
            )}
          </>,
          document.body
        )}
      </>
    );
  }

  // ── contentEditable mode (plain or rich) ────────────────────────────────
  if (editMode) {
    const commit = () => {
      const el = ref.current;
      if (!el) return;
      setValue(rich ? sanitizeHtml(el.innerHTML) : el.innerText);
    };

    return (
      <>
        {rich && (
          <span className="sawo-rich-toolbar" contentEditable={false}>
            <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); document.execCommand("bold"); }}><b>B</b></button>
            <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); document.execCommand("italic"); }}><i>I</i></button>
            <button
              type="button"
              title="Link"
              onMouseDown={(e) => {
                e.preventDefault();
                const url = window.prompt("Link URL:");
                if (url) document.execCommand("createLink", false, url);
              }}
            >
              🔗
            </button>
          </span>
        )}
        <Tag
          ref={ref}
          className={`${className || ""} sawo-editable-active`.trim()}
          style={style}
          contentEditable
          suppressContentEditableWarning
          onClick={stopNav}
          onPaste={(e) => {
            e.preventDefault();
            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
          }}
          onBlur={commit}
          {...(rich
            ? { dangerouslySetInnerHTML: { __html: typeof display === "string" ? display : "" } }
            : { children: display })}
        />
      </>
    );
  }

  // ── View mode (visitors, and admins outside edit mode) ──────────────────
  if (rich) {
    return (
      <Tag
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(typeof display === "string" ? display : "") }}
      />
    );
  }
  return <Tag className={className} style={style}>{display}</Tag>;
}
