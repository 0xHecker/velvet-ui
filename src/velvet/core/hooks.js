import { useEffect, useRef, useState } from "react";

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

let colorContext;
const colorCache = new Map();
const parseDirectRgb = (input) => {
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(input);
  if (hex) {
    const value = hex[1].length <= 4
      ? hex[1].split("").map((part) => part + part).join("")
      : hex[1];
    return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  }
  const rgb = /^rgba?\(\s*([\d.]+)(%?)\D+([\d.]+)(%?)\D+([\d.]+)(%?)/i.exec(input);
  if (!rgb) return null;
  return [1, 3, 5].map((index) => {
    const value = Number.parseFloat(rgb[index]);
    return rgb[index + 1] ? Math.round((value / 100) * 255) : value;
  });
};
const parseRgb = (value) => {
  const input = String(value || "").trim();
  const direct = parseDirectRgb(input);
  if (direct) return direct;
  if (colorCache.has(input)) return colorCache.get(input);
  if (typeof document !== "undefined") {
    colorContext ||= document.createElement("canvas").getContext("2d");
    if (colorContext) {
      colorContext.fillStyle = "#010203";
      colorContext.fillStyle = input;
      const parsed = parseDirectRgb(colorContext.fillStyle);
      if (parsed) {
        colorCache.set(input, parsed);
        return parsed;
      }
    }
  }
  return [0, 0, 0];
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

const themeDimmingOverlays = new Map();
const renderThemeColor = () => {
  const meta = themeMeta();
  if (!meta) return;
  const base = meta.dataset.velvetBase || meta.getAttribute("content") || "rgb(255,255,255)";
  let color = base;
  let dimmed = false;
  themeDimmingOverlays.forEach(({ color: overlay, opacity }) => {
    if (!(opacity > 0.001)) return;
    dimmed = true;
    color = mix(parseRgb(color), overlay, Math.min(Math.max(opacity, 0), 1));
  });
  if (dimmed) {
    meta.dataset.velvetDimmed = "1";
    meta.setAttribute("content", color);
  } else {
    delete meta.dataset.velvetDimmed;
    meta.setAttribute("content", base);
  }
};

// Update the page theme-color. If a dimming overlay is active, only the base color
// is updated so the current dimming is preserved.
export const updateThemeColor = (color) => {
  const meta = themeMeta();
  if (!meta) return;
  meta.dataset.velvetBase = color;
  renderThemeColor();
};

// Register a theme-color dimming overlay tied to an element. Setting/animating its
// opacity dims the element and the browser theme-color together.
export const useThemeColorDimmingOverlay = ({
  elementRef,
  dimmingColor = "rgb(0,0,0)",
  applyToElement = true,
} = {}) => {
  const id = useRef(Symbol("velvet-theme-dimming"));
  const over = useRef(parseRgb(dimmingColor));
  const animationFrame = useRef(0);
  over.current = parseRgb(dimmingColor);
  const apply = (opacity) => {
    const el = elementRef && elementRef.current;
    if (el && applyToElement) el.style.opacity = String(opacity);
    themeDimmingOverlays.set(id.current, { color: over.current, opacity });
    renderThemeColor();
  };
  useEffect(
    () => () => {
      cancelAnimationFrame(animationFrame.current);
      themeDimmingOverlays.delete(id.current);
      renderThemeColor();
    },
    []
  );
  return {
    setDimmingOverlayOpacity: apply,
    animateDimmingOverlayOpacity: ({ keyframes, duration = 500 }) => {
      const [from, to] = keyframes;
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / duration);
        apply(from + (to - from) * k);
        if (k < 1) animationFrame.current = requestAnimationFrame(tick);
      };
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(tick);
    },
  };
};
