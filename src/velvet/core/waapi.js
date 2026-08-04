import { prefersReducedMotion, springEasing } from "./spring.js";

const MOTION_ID_PREFIX = "velvet:";
const PHYSICS_KEYS = new Set([
  "preset",
  "stiffness",
  "damping",
  "mass",
  "precision",
  "initialVelocity",
]);
const WAAPI_TIMING_KEYS = [
  "delay",
  "endDelay",
  "fill",
  "iterationStart",
  "iterations",
  "direction",
  "composite",
  "iterationComposite",
];

const finiteDuration = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? Math.min(number, 10_000)
    : fallback;
};

const finalKeyframe = (keyframes) => {
  if (Array.isArray(keyframes)) return keyframes.at(-1) || null;
  if (!keyframes || typeof keyframes !== "object") return null;
  const frame = {};
  for (const property of Object.keys(keyframes)) {
    if (property === "offset" || property === "easing" || property === "composite") {
      continue;
    }
    const value = keyframes[property];
    frame[property] = Array.isArray(value) ? value.at(-1) : value;
  }
  return frame;
};

const applyFrame = (element, frame) => {
  if (!element?.style || !frame) return;
  for (const property of Object.keys(frame)) {
    if (property === "offset" || property === "easing" || property === "composite") {
      continue;
    }
    const value = frame[property];
    if (value == null || Array.isArray(value)) continue;
    try {
      if (property.startsWith("--") || property.includes("-")) {
        element.style.setProperty(property, String(value));
      } else {
        element.style[property] = String(value);
      }
    } catch {
      // A single invalid authored property must not prevent the other final
      // values from settling.
    }
  }
};

const notify = (callback, detail) => {
  try {
    callback?.(detail);
  } catch {
    // Consumer callbacks must not strand the playback lifecycle.
  }
};

const noopPlayback = (status = "skipped") => ({
  animation: null,
  finished: Promise.resolve(status),
  cancel() {},
  finish() {},
  pause() {},
  play() {},
  reverse() {},
});

// Normalize an animation-settings value (preset string | spring object | timing
// object) into WAAPI timing { duration, easing }.
export const resolveTiming = (settings) => {
  if (!settings) return springEasing("smooth");
  if (typeof settings === "string") return springEasing(settings);
  if (typeof settings !== "object") return springEasing("smooth");
  if (
    settings.easing === "spring" ||
    [...PHYSICS_KEYS].some((field) => settings[field] != null)
  ) {
    return springEasing(settings, { v0: settings.initialVelocity || 0 });
  }
  if (
    settings.duration != null ||
    (settings.easing && settings.easing !== "spring")
  ) {
    return {
      duration: finiteDuration(settings.duration, 300),
      easing: settings.easing || "linear",
    };
  }
  return springEasing(settings);
};

/**
 * Interruptible, reduced-motion-safe WAAPI orchestration.
 *
 * Calls with the same `id` replace only the previous Velvet animation on that
 * element. The returned `finished` promise always resolves, including after
 * cancellation, so normal interruption cannot create an unhandled rejection.
 */
export const animate = (element, keyframes, options = {}, legacyExtra) => {
  // Preserve the small internal three/four-argument helper contract while the
  // public API uses one options object.
  const settings =
    options && typeof options === "object" ? options : {};
  const extra =
    legacyExtra && typeof legacyExtra === "object" ? legacyExtra : {};
  const merged = { ...settings, ...extra };
  const {
    id = "default",
    commit = true,
    onFinish,
    onCancel,
    skip,
  } = merged;
  const lastFrame = finalKeyframe(keyframes);
  const shouldSkip =
    skip === true ||
    (skip !== false && skip !== "never" && prefersReducedMotion(element));

  if (!element || shouldSkip || typeof element.animate !== "function") {
    applyFrame(element, lastFrame);
    notify(onFinish, { status: "skipped", animation: null });
    return noopPlayback("skipped");
  }

  const animationId =
    id === false || id == null ? null : `${MOTION_ID_PREFIX}${String(id)}`;
  if (animationId && typeof element.getAnimations === "function") {
    for (const running of element.getAnimations()) {
      if (running.id === animationId) running.cancel();
    }
  }

  const resolved = resolveTiming(merged);
  const timing = {
    duration: finiteDuration(resolved.duration, 0),
    easing: resolved.easing || "linear",
    fill: merged.fill || "both",
  };
  for (const key of WAAPI_TIMING_KEYS) {
    if (merged[key] != null) timing[key] = merged[key];
  }

  let animation;
  try {
    animation = element.animate(keyframes, timing);
  } catch {
    applyFrame(element, lastFrame);
    notify(onFinish, { status: "skipped", animation: null });
    return noopPlayback("skipped");
  }

  if (animationId) animation.id = animationId;
  let settled = false;
  let resolveFinished;
  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });
  const settle = (status) => {
    if (settled) return;
    settled = true;
    if (status === "finished" && commit !== false) {
      applyFrame(element, lastFrame);
      try {
        animation.cancel();
      } catch {
        // The animation may already have detached with its element.
      }
      resolveFinished(status);
      notify(onFinish, { status, animation });
    } else if (status === "cancelled") {
      resolveFinished(status);
      notify(onCancel, { status, animation });
    } else {
      resolveFinished(status);
      notify(onFinish, { status, animation });
    }
  };

  animation.addEventListener("finish", () => settle("finished"), { once: true });
  animation.addEventListener("cancel", () => settle("cancelled"), { once: true });

  return {
    animation,
    finished,
    cancel() {
      if (settled) return;
      try {
        animation.cancel();
      } finally {
        settle("cancelled");
      }
    },
    finish() {
      if (settled) return;
      try {
        animation.finish();
      } catch {
        applyFrame(element, lastFrame);
        settle("finished");
      }
    },
    pause() {
      if (!settled) animation.pause();
    },
    play() {
      if (!settled) animation.play();
    },
    reverse() {
      if (!settled) animation.reverse();
    },
  };
};
