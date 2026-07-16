// src/inline-edit/EditableImage.jsx
//
// Renders a plain <img> — in edit mode, exactly the same <img> (same parent,
// same position in the DOM), just with an outline class and a ref. The
// "Replace image" button is rendered as a sibling, positioned with
// `position: fixed` from the image's own getBoundingClientRect() (see
// useElementRect) rather than wrapped around it — many of this app's image
// layouts (`w-full h-full object-cover` inside an `absolute inset-0` parent,
// `<picture>` sources, flex/grid items) depend on the <img> being a direct
// child for sizing, and an extra wrapping <span> silently breaks that.
//
// Two addressing modes:
//   - field (default): stores { image_url, alt_text } as a nested object at
//     data[field] — the convention the backend sync (syncApi.js IMAGE_KEYS
//     recursion) already understands for any key named `image_url`.
//       <EditableImage page="about" section="hero" field="employee_photo"
//         src={aboutusEmployee} alt="SAWO team" />
//   - path/altPath: for existing flat CMS keys (e.g. Home's image_1920,
//     Section1-4's items.N.image_url), write directly to that key instead.
//       <EditableImage page="home" section="hero" path="image_1920"
//         altPath="alt_text" src="/1920.webp" alt="…" />
import React, { useState, useRef, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useEditableField } from "./EditProvider";
import { useElementRect } from "./useElementRect";

const ImageReplaceDialog = lazy(() => import("./ImageReplaceDialog"));

// See EditableText's stopNav — stopPropagation alone doesn't block a native
// <a href> navigation; preventDefault is required too.
function stopNav(e) {
  e.preventDefault();
  e.stopPropagation();
}

export default function EditableImage({
  page, section, field, path, altPath,
  src, alt, className, style, ...imgProps
}) {
  const urlPath = path || `${field}.image_url`;
  const altPathResolved = altPath || (path ? null : `${field}.alt_text`);

  const { value: urlValue, editMode, setValue: setUrl } = useEditableField({ page, section, path: urlPath });
  const altField = useEditableField({ page, section, path: altPathResolved || "__unused__" });

  const [showDialog, setShowDialog] = useState(false);
  const imgRef = useRef(null);
  const rect = useElementRect(imgRef, editMode);

  const finalSrc = urlValue || src;
  const finalAlt = (altPathResolved && altField.value) || alt;

  const imgEl = (
    <img
      ref={imgRef}
      src={finalSrc}
      alt={finalAlt}
      className={editMode ? `${className || ""} sawo-editable-active`.trim() : className}
      style={style}
      {...imgProps}
    />
  );

  if (!editMode) return imgEl;

  return (
    <>
      {imgEl}
      {rect && createPortal(
        <>
          <button
            type="button"
            className="sawo-image-replace-btn"
            style={{
              position: "fixed",
              top: rect.top + rect.height / 2,
              left: rect.left + rect.width / 2,
              transform: "translate(-50%, -50%)",
              zIndex: 100000,
            }}
            onClick={(e) => { stopNav(e); setShowDialog(true); }}
          >
            Replace image
          </button>
          {showDialog && (
            <Suspense fallback={null}>
              <ImageReplaceDialog
                currentUrl={finalSrc}
                currentAlt={finalAlt}
                folder={`${page}/${section}`}
                onClose={() => setShowDialog(false)}
                onConfirm={({ url, altText }) => {
                  setUrl(url);
                  if (altPathResolved) altField.setValue(altText);
                  setShowDialog(false);
                }}
              />
            </Suspense>
          )}
        </>,
        document.body
      )}
    </>
  );
}
