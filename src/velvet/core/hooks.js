import { useEffect, useRef, useState } from "react";

export { createComponentId } from "./id.js";

// true when the CSS media query matches (client only; false on the server).
export const useClientMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return matches;
};

const parseRgb = (s) => {
  const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(s || "");
  return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
};
const mix = (base, over, a) =>
  `rgb(${base.map((c, i) => Math.round(c + (over[i] - c) * a)).join(",")})`;

const themeMeta = () => {
  if (typeof document === "undefined") return null;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  return meta;
};

// Update the page theme-color. If a dimming overlay is active, only the base color
// is updated so the current dimming is preserved.
export const updateThemeColor = (color) => {
  const meta = themeMeta();
  if (!meta) return;
  meta.dataset.velvetBase = color;
  if (!meta.dataset.velvetDimmed) meta.setAttribute("content", color);
};

// Register a theme-color dimming overlay tied to an element. Setting/animating its
// opacity dims the element and the browser theme-color together.
export const useThemeColorDimmingOverlay = ({ elementRef, dimmingColor = "rgb(0,0,0)" } = {}) => {
  const over = useRef(parseRgb(dimmingColor));
  const apply = (opacity) => {
    const el = elementRef && elementRef.current;
    if (el) el.style.opacity = String(opacity);
    const meta = themeMeta();
    if (!meta) return;
    const base = meta.dataset.velvetBase || meta.getAttribute("content") || "rgb(255,255,255)";
    if (opacity <= 0.001) {
      delete meta.dataset.velvetDimmed;
      meta.setAttribute("content", base);
    } else {
      meta.dataset.velvetDimmed = "1";
      meta.setAttribute("content", mix(parseRgb(base), over.current, opacity));
    }
  };
  return {
    setDimmingOverlayOpacity: apply,
    animateDimmingOverlayOpacity: ({ keyframes, duration = 500 }) => {
      const [from, to] = keyframes;
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / duration);
        apply(from + (to - from) * k);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
  };
};
