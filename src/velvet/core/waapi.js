import { springEasing } from "./spring.js";

// Normalize an animation-settings value (preset string | spring object | timing
// object) into WAAPI timing { duration, easing }.
export const resolveTiming = (settings) => {
  if (!settings) return springEasing("smooth");
  if (typeof settings === "string") return springEasing(settings);
  if (settings.easing === "spring" || settings.preset || settings.stiffness)
    return springEasing(settings, { v0: settings.initialVelocity || 0 });
  if (settings.easing && settings.duration)
    return { duration: settings.duration, easing: settings.easing };
  return springEasing(settings);
};

// Thin wrapper over element.animate that accepts our settings shape and fills
// in fill:both. Returns the Animation (or null if WAAPI is unavailable).
export const animate = (el, keyframes, settings, extra = {}) => {
  if (!el || typeof el.animate !== "function") return null;
  const { duration, easing } = resolveTiming(settings);
  return el.animate(keyframes, {
    duration,
    easing,
    fill: "both",
    ...extra,
  });
};
