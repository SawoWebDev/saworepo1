// src/hooks/useDragCarousel.js
//
// Shared behaviour for the Home page's item carousels (Sauna Heaters,
// Sauna Accessories): seamless infinite loop in both directions + mouse
// click-and-drag scrolling. Touch devices already scroll the track
// natively (overflow-x-auto), so drag handling only engages for
// pointerType "mouse".
//
// Loop strategy: the caller renders the item list tripled
// ([...items, ...items, ...items]). The track starts centered on the
// middle copy; once scrollLeft drifts into the left or right copy, it's
// shifted back by one copy-width. Since all three copies are pixel
// identical, the correction is invisible.
import { useRef, useEffect, useCallback } from "react";
import { afterPageLoad, prefersReducedMotion } from "../utils/afterPageLoad";

export default function useDragCarousel({ autoplayMs = 3000 } = {}) {
  const trackRef      = useRef(null);
  const isHoveredRef   = useRef(false);
  const draggingRef    = useRef(false);
  const movedRef       = useRef(false);
  const downXRef       = useRef(0);
  const lastXRef       = useRef(0);

  // Center on the middle copy once the track has laid out.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth / 3;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Wrap scrollLeft back into the middle copy whenever it drifts into
  // either outer copy, so autoplay, arrow clicks, and dragging all loop
  // forever in both directions.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const handleScroll = () => {
      const copyWidth = el.scrollWidth / 3;
      if (el.scrollLeft < copyWidth) {
        el.scrollLeft += copyWidth;
      } else if (el.scrollLeft >= copyWidth * 2) {
        el.scrollLeft -= copyWidth;
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let interval;
    // Defer the auto-scroll until after load + idle so Lighthouse can settle
    // the page and finalize LCP/TBT (prevents the `NO_LCP` runtime error).
    const cancelStart = afterPageLoad(() => {
      interval = setInterval(() => {
        const el = trackRef.current;
        if (el && !isHoveredRef.current && !draggingRef.current) {
          const itemWidth = el.firstChild.offsetWidth + 24;
          el.scrollBy({ left: itemWidth, behavior: "smooth" });
        }
      }, autoplayMs);
    });
    return () => {
      cancelStart();
      clearInterval(interval);
    };
  }, [autoplayMs]);

  const setHovered = useCallback((v) => { isHoveredRef.current = v; }, []);

  const scrollByItem = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    const itemWidth = el.firstChild.offsetWidth + 24;
    el.scrollBy({ left: dir * itemWidth, behavior: "smooth" });
  }, []);

  const onPointerDown = useCallback((e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    draggingRef.current = true;
    movedRef.current = false;
    downXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    el.classList.add("is-dragging");
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  // Applies each move as a delta against the *current* scrollLeft (not a
  // fixed drag-start reference) so it composes correctly with the loop's
  // wrap correction, which can shift scrollLeft by a whole copy-width
  // between two pointermove events. An absolute start-relative computation
  // would silently overwrite that shift and undo the loop mid-drag.
  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    if (Math.abs(e.clientX - downXRef.current) > 4) movedRef.current = true;
    el.scrollLeft -= dx;
  }, []);

  const endDrag = useCallback((e) => {
    const el = trackRef.current;
    if (!draggingRef.current || !el) return;
    draggingRef.current = false;
    el.classList.remove("is-dragging");
    if (e && e.pointerId != null && el.hasPointerCapture?.(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  }, []);

  // Swallow the click that follows a real drag so links inside the track
  // don't navigate away when the user was just dragging the carousel.
  const onClickCapture = useCallback((e) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  }, []);

  return {
    trackRef,
    setHovered,
    scrollByItem,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
  };
}
