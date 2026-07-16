// src/inline-edit/useElementRect.js
// Tracks an element's viewport rect so edit-mode affordances (a "replace
// image" button, a text-edit pencil) can be positioned with `position:
// fixed` instead of wrapping the target in a new element. Wrapping breaks
// layouts that depend on the target being a direct child for sizing
// (`w-full`/`h-full`, `inset-0`, flex/grid item, etc.) — this avoids that
// entirely since the target's own DOM position/parent never changes.
import { useState, useLayoutEffect } from "react";

export function useElementRect(ref, active) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!active || !ref.current) { setRect(null); return undefined; }
    const update = () => setRect(ref.current.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, ref]);
  return rect;
}
