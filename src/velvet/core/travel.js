// Apply a progress-driven animation map to an element. Each property is
// [from,to] (interpolated), ({progress,tween}) => value, or a literal.
// Shared by Sheet (travel) and SheetStack/Outlet (stacking).
export const applyTravel = (el, map, progress) => {
  const tween = (a, b) => a + (b - a) * progress;
  for (const prop in map) {
    const spec = map[prop];
    const v =
      typeof spec === "function"
        ? spec({ progress, tween })
        : Array.isArray(spec)
          ? tween(spec[0], spec[1])
          : spec;
    if (v != null) el.style[prop] = typeof v === "number" ? String(v) : v;
  }
};
