import { useEffect } from "react";

// Adds click-and-drag panning (mouse) to a horizontally scrollable element,
// matching the touch-swipe scrolling it already gets for free on mobile.
// Pass the same ref used for scrollLeft/scrollBy elsewhere in the carousel.
// onDragStateChange (optional) is called with true/false so callers can pause
// autoplay while the user is actively dragging.
export function useDragScroll(ref, onDragStateChange) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let dragged = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onPointerDown = (e) => {
      // Left button only — avoid hijacking right-click/middle-click.
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDown = true;
      dragged = false;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      el.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) {
        if (!dragged) {
          dragged = true;
          el.classList.add("sawo-drag-scrolling");
          onDragStateChange?.(true);
        }
        el.scrollLeft = startScrollLeft - dx;
      }
    };

    const endDrag = (e) => {
      if (!isDown) return;
      isDown = false;
      if (dragged) {
        el.classList.remove("sawo-drag-scrolling");
        onDragStateChange?.(false);
      }
      el.releasePointerCapture?.(e.pointerId);
    };

    // Prevent link navigation from firing right after a drag.
    const onClickCapture = (e) => {
      if (dragged) {
        e.preventDefault();
        e.stopPropagation();
      }
      dragged = false;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [ref, onDragStateChange]);
}
