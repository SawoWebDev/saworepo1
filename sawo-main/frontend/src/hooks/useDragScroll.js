// src/hooks/useDragScroll.js
//
// Mouse click-and-drag scrolling for a horizontally-scrollable row (e.g.
// category tabs). Touch devices already scroll natively via
// overflow-x:auto, so this only engages for pointerType "mouse".
//
// Pointer capture is deferred until the pointer has actually moved past
// DRAG_THRESHOLD. Capturing on every mousedown (including plain clicks)
// retargets the resulting click event to the captured element instead of
// whatever button/link is under the cursor — that silently broke every
// tab button, since a plain click never reached its onClick handler.
import { useRef, useCallback } from "react";

const DRAG_THRESHOLD = 4;

export default function useDragScroll() {
  const trackRef = useRef(null);
  const pointerDownRef = useRef(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const downXRef = useRef(0);
  const lastXRef = useRef(0);

  const onPointerDown = useCallback((e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (!trackRef.current) return;
    pointerDownRef.current = true;
    movedRef.current = false;
    downXRef.current = e.clientX;
    lastXRef.current = e.clientX;
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!pointerDownRef.current) return;
    const el = trackRef.current;
    if (!el) return;

    if (!draggingRef.current) {
      if (Math.abs(e.clientX - downXRef.current) <= DRAG_THRESHOLD) return;
      draggingRef.current = true;
      movedRef.current = true;
      el.classList.add("is-dragging");
      el.setPointerCapture(e.pointerId);
    }

    el.scrollLeft -= e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
  }, []);

  const endDrag = useCallback((e) => {
    const el = trackRef.current;
    pointerDownRef.current = false;
    if (!draggingRef.current || !el) return;
    draggingRef.current = false;
    el.classList.remove("is-dragging");
    if (e?.pointerId != null && el.hasPointerCapture?.(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  }, []);

  const onClickCapture = useCallback((e) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  }, []);

  return {
    trackRef,
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
