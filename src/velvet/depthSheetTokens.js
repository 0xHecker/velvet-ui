/**
 * Stable DepthSheet token names. The motion maps and the styled composition
 * both consume these custom properties, so JavaScript and CSS cannot drift.
 */
export const depthSheetVariables = Object.freeze({
  inset: "--velvet-depth-inset",
  radius: "--velvet-depth-radius",
  shift: "--velvet-depth-shift",
  shiftLimit: "--velvet-depth-shift-limit",
  scaleLoss: "--velvet-depth-scale-loss",
  scaleMinimum: "--velvet-depth-scale-min",
  radiusStep: "--velvet-depth-radius-step",
  radiusLimit: "--velvet-depth-radius-limit",
  dimming: "--velvet-depth-dimming",
  brightnessMinimum: "--velvet-depth-brightness-min",
  pageBackground: "--velvet-depth-page-background",
  surfaceBackground: "--velvet-depth-surface-background",
  backdropBackground: "--velvet-depth-backdrop-background",
  handleBackground: "--velvet-depth-handle-background",
  shadow: "--velvet-depth-shadow",
});

/**
 * The values supplied by depth-sheet.css. Exporting them makes the default
 * material inspectable in CSS-in-JS and gives the CSS parity test one source
 * of truth to verify.
 */
export const depthSheetDefaultTokens = Object.freeze({
  inset: "max(24px, env(safe-area-inset-top))",
  radius: "28px",
  shift: "14px",
  shiftLimit: "80px",
  scaleLoss: 0.06,
  scaleMinimum: 0.76,
  radiusStep: "2px",
  radiusLimit: "42px",
  dimming: 0.1,
  brightnessMinimum: 0.7,
  pageBackground: "#fff",
  surfaceBackground: "#f8faf8",
  backdropBackground: "#020806",
  handleBackground: "rgba(255, 255, 255, 0.74)",
  shadow:
    "0 -1px 0 rgba(255, 255, 255, 0.8), 0 -24px 70px -34px rgba(0, 0, 0, 0.5)",
});

const UNITLESS_LIMITS = Object.freeze({
  scaleLoss: [0, 0.25],
  scaleMinimum: [0.5, 1],
  dimming: [0, 0.25],
  brightnessMinimum: [0.4, 1],
});

export const depthSheetVariable = (name) => {
  const property = depthSheetVariables[name];
  return property ? `var(${property})` : undefined;
};

export const depthSheetTokenStyle = (tokens) => {
  if (!tokens) return null;
  const style = {};
  for (const name of Object.keys(tokens)) {
    const property = depthSheetVariables[name];
    const value = tokens[name];
    if (!property || value == null) continue;
    const limits = UNITLESS_LIMITS[name];
    if (limits) {
      const number = Number(value);
      if (!Number.isFinite(number)) continue;
      style[property] = Math.min(Math.max(number, limits[0]), limits[1]);
      continue;
    }
    if (typeof value !== "string" || value.trim() === "") continue;
    style[property] = value;
  }
  return style;
};
