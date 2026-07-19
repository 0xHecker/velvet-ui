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

export const travelStyles = (map, progress) => {
  const tween = (a, b) => `calc(${a} + (${b} - ${a}) * ${progress})`;
  const properties = map?.properties || map;
  const styles = {};
  const transforms = [];
  for (const prop in properties) {
    const spec = properties[prop];
    if (spec === "ignore" || spec == null || spec === false) continue;
    const v =
      typeof spec === "function"
        ? spec({ progress, tween })
        : Array.isArray(spec)
          ? tween(spec[0], spec[1])
          : spec;
    if (v == null) continue;
    const value = typeof v === "number" ? String(v) : v;
    if (prop === "transform") transforms.push(value);
    else if (TRANSFORM_PROPERTIES.has(prop)) transforms.push(`${prop}(${value})`);
    else styles[prop] = value;
  }
  if (transforms.length) styles.transform = transforms.join(" ");
  return styles;
};

export const applyTravel = (el, map, progress) => {
  const styles = travelStyles(map, progress);
  for (const prop in styles) el.style[prop] = styles[prop];
};
