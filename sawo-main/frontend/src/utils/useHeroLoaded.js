import { useEffect, useState } from "react";

// Fades a hero image in only once it's fully loaded, instead of it popping
// in abruptly. Pass the imported image src; returns true once loaded.
export function useHeroLoaded(src) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = src;
    const reveal = () => { if (!cancelled) setLoaded(true); };
    if (img.complete) {
      reveal();
    } else {
      img.onload = reveal;
      img.onerror = reveal; // don't leave the hero hidden forever if the image fails
    }
    return () => { cancelled = true; };
  }, [src]);

  return loaded;
}
