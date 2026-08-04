// Apply a progress-driven animation map to an element. Each property is
// [from,to] (interpolated), ({progress,tween}) => value, or a literal.
// Shared by Sheet (travel) and SheetStack/Outlet (stacking).
const TRANSFORM_PROPERTIES = new Set([
  "translate",
  "translateX",
  "translateY",
  "translateZ",
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skew",
  "skewX",
  "skewY",
]);
const UNSAFE_PROPERTIES = new Set(["__proto__", "constructor", "prototype"]);

const finiteProgress = (progress) => {
  const value = Number(progress);
  return Number.isFinite(value) ? value : 0;
};

export const travelStyles = (map, progress, context = {}) => {
  const resolvedProgress = finiteProgress(progress);
  const tween = (a, b) =>
    `calc(${a} + (${b} - ${a}) * ${resolvedProgress})`;
  const properties = map?.properties || map;
  if (!properties || typeof properties !== "object") return {};
  const styles = {};
  const transforms = [];
  for (const prop of Object.keys(properties)) {
    if (UNSAFE_PROPERTIES.has(prop)) continue;
    const spec = properties[prop];
    if (spec === "ignore" || spec == null || spec === false) continue;
    let v;
    try {
      v =
        typeof spec === "function"
          ? spec({ ...context, progress: resolvedProgress, tween })
          : Array.isArray(spec)
            ? spec.length >= 2
              ? tween(spec[0], spec[1])
              : null
            : spec;
    } catch (error) {
      try {
        context?.onError?.(error, {
          property: prop,
          progress: resolvedProgress,
        });
      } catch {
        // Error reporting must not break the remaining property map.
      }
      continue;
    }
    if (v == null) continue;
    if (typeof v !== "string" && typeof v !== "number") continue;
    const value = typeof v === "number" ? String(v) : v;
    if (prop === "transform") transforms.push(value);
    else if (TRANSFORM_PROPERTIES.has(prop)) transforms.push(`${prop}(${value})`);
    else styles[prop] = value;
  }
  if (transforms.length) styles.transform = transforms.join(" ");
  return styles;
};

export const applyTravel = (el, map, progress, context) => {
  if (!el?.style) return {};
  const styles = travelStyles(map, progress, context);
  for (const prop of Object.keys(styles)) {
    try {
      if (prop.startsWith("--") || prop.includes("-")) {
        el.style.setProperty(prop, styles[prop]);
      } else {
        el.style[prop] = styles[prop];
      }
    } catch {
      // Invalid authored CSS is isolated to that property.
    }
  }
  return styles;
};
