// src/inline-edit/EditableCard.jsx
//
// Wraps one "box" (a carousel/grid card that bundles an image + heading +
// description) with a SINGLE "Edit" affordance instead of scattering a
// pencil over the text and a separate hover-button over the image. Clicking
// it opens one panel (ItemEditPanel) with whichever fields apply.
//
// Renders via a render-prop so each section's own card markup (picture vs
// plain img, presence/absence of a caption, differing classNames) stays
// exactly as it was — EditableCard only resolves the current values and
// clones a ref onto the card's root element to measure it (no wrapping
// element is introduced, so nothing about the card's layout changes):
//
//   <EditableCard
//     page="home" section="section1"
//     imagePath={`items.${i}.image_url`} imageDefault={item.img} imageAlt={item.alt}
//     titlePath={`items.${i}.title`} titleDefault={item.title}
//     captionPath={`items.${i}.caption`} captionDefault={item.caption}
//   >
//     {({ image, title, caption }) => (
//       <Link to={item.href}>...uses image/title/caption...</Link>
//     )}
//   </EditableCard>
//
// Omit captionPath (and title/image similarly) for cards that don't have
// that field — ItemEditPanel only shows inputs for fields that were passed.
import React, { cloneElement, useRef, useState, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useEditableField } from "./EditProvider";
import { useElementRect } from "./useElementRect";

const ItemEditPanel = lazy(() => import("./ItemEditPanel"));

export default function EditableCard({
  page, section,
  imagePath, imageDefault, imageAlt,
  titlePath, titleDefault,
  captionPath, captionDefault,
  children,
}) {
  // Hooks are called unconditionally (with a placeholder path when a field
  // isn't configured) so the hook count/order never varies between renders.
  const imageField = useEditableField({ page, section, path: imagePath || "__unused_image__" });
  const titleField = useEditableField({ page, section, path: titlePath || "__unused_title__" });
  const captionField = useEditableField({ page, section, path: captionPath || "__unused_caption__" });

  const editMode = imageField.editMode;
  const image = (imagePath && imageField.value) || imageDefault;
  const title = (titlePath && titleField.value) || titleDefault;
  const caption = (captionPath && captionField.value) || captionDefault;

  const cardRef = useRef(null);
  const rect = useElementRect(cardRef, editMode);
  const [showPanel, setShowPanel] = useState(false);

  const cardElement = children({ image, title, caption, alt: imageAlt });
  const renderedCard = editMode ? cloneElement(cardElement, { ref: cardRef }) : cardElement;

  return (
    <>
      {renderedCard}
      {editMode && rect && createPortal(
        <>
          <button
            type="button"
            className="sawo-card-edit-btn"
            style={{ position: "fixed", top: rect.top + 8, left: rect.left + 8, zIndex: 100000 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPanel(true); }}
          >
            Edit content
          </button>
          {showPanel && (
            <Suspense fallback={null}>
              <ItemEditPanel
                title={titlePath ? title : undefined}
                caption={captionPath ? caption : undefined}
                image={imagePath ? image : undefined}
                imageAlt={imageAlt}
                folder={`${page}/${section}`}
                onClose={() => setShowPanel(false)}
                onSave={({ title: t, caption: c, imageUrl }) => {
                  if (titlePath && t !== undefined) titleField.setValue(t);
                  if (captionPath && c !== undefined) captionField.setValue(c);
                  if (imagePath && imageUrl !== undefined) imageField.setValue(imageUrl);
                  setShowPanel(false);
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
