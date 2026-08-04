// Spring physics: a fixed-timestep (dt = 1ms) semi-implicit Euler
// integration of a damped harmonic oscillator. Stiffness is scaled by 1e-6 and
// damping by 1e-3 so integer-millisecond steps produce natural motion. It emits a
// normalized progress array (0..~1) and the settle duration in ms. Sheet travel
// consumes this through WAAPI; native swipes are deliberately not spring-driven.

export const SPRING_PRESETS = {
  gentle: { stiffness: 560, damping: 68, mass: 1.85 },
  smooth: { stiffness: 580, damping: 60, mass: 1.35 },
  snappy: { stiffness: 350, damping: 34, mass: 0.9 },
  brisk: { stiffness: 350, damping: 28, mass: 0.65 },
  bouncy: { stiffness: 240, damping: 19, mass: 0.7 },
  elastic: { stiffness: 260, damping: 20, mass: 1 },
};

const DEFAULTS = { stiffness: 300, damping: 34, mass: 1, precision: 0.1 };
const MAX_SPRING_DURATION = 10_000;

const TIMING_EASINGS = ["ease", "ease-in", "ease-out", "ease-in-out", "linear"];
const PHYSICS_FIELDS = [
  "stiffness",
  "damping",
  "mass",
  "precision",
  "initialVelocity",
];

const finite = (value, fallback, minimum, maximum) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, minimum), maximum);
};

const settingsObject = (settings) =>
  settings && typeof settings === "object" ? settings : {};

const windowFor = (target) => {
  if (target?.matchMedia) return target;
  if (target?.defaultView) return target.defaultView;
  if (target?.ownerDocument?.defaultView) return target.ownerDocument.defaultView;
  return typeof window !== "undefined" ? window : null;
};

/**
 * Reads the preference when motion starts instead of once at module import.
 * This remains SSR-safe and responds to a preference changed while the app is
 * open. Pass an Element, Document, or Window to target another browsing
 * context.
 */
export const prefersReducedMotion = (target) => {
  try {
    return Boolean(
      windowFor(target)?.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return false;
  }
};

const normalizePhysics = (settings, fallback = DEFAULTS) => {
  const source = settingsObject(settings);
  const fallbackSource = settingsObject(fallback);
  return {
    stiffness: finite(
      source.stiffness,
      finite(fallbackSource.stiffness, DEFAULTS.stiffness, 1, 10_000),
      1,
      10_000
    ),
    damping: finite(
      source.damping,
      finite(fallbackSource.damping, DEFAULTS.damping, 0, 1_000),
      0,
      1_000
    ),
    mass: finite(
      source.mass,
      finite(fallbackSource.mass, DEFAULTS.mass, 0.01, 100),
      0.01,
      100
    ),
    precision: finite(
      source.precision,
      finite(fallbackSource.precision, DEFAULTS.precision, 0.001, 1),
      0.001,
      1
    ),
    initialVelocity: finite(source.initialVelocity, 0, -10_000, 10_000),
  };
};

// This ordering is intentional. A recognised preset overrides conflicting
// object fields. The component fallback is only merged when neither a preset
// nor an explicit supported easing was supplied.
export const resolveSpringSettings = (settings, fallback = DEFAULTS) => {
  const stringPreset = typeof settings === "string";
  const source = settingsObject(settings);
  const preset = stringPreset
    ? SPRING_PRESETS[settings]
    : SPRING_PRESETS[source.preset];
  const recognised =
    Boolean(preset) ||
    source.easing === "spring" ||
    TIMING_EASINGS.includes(source.easing) ||
    PHYSICS_FIELDS.some((field) => source[field] != null);
  const fallbackSource = settingsObject(fallback);
  const resolved = {
    skip: prefersReducedMotion(),
    easing: "spring",
    ...(recognised ? {} : fallbackSource),
    ...(stringPreset ? {} : source),
    ...(preset || {}),
    ...normalizePhysics(
      preset || (stringPreset ? fallbackSource : source),
      recognised ? fallbackSource : DEFAULTS
    ),
  };
  resolved.duration = finite(resolved.duration, undefined, 0, MAX_SPRING_DURATION);
  resolved.delay = finite(resolved.delay, 0, 0, MAX_SPRING_DURATION);
  resolved.skip =
    source.skip === "never"
      ? false
      : source.skip === "auto"
        ? prefersReducedMotion()
        : source.skip ?? prefersReducedMotion();
  return resolved;
};

const resolvePhysicsSettings = (settings) => {
  const source = settingsObject(settings);
  const supplied =
    typeof settings === "string"
      ? SPRING_PRESETS[settings] || {}
      : { ...source, ...(SPRING_PRESETS[source.preset] || {}) };
  return {
    ...supplied,
    ...normalizePhysics(supplied),
    delay: finite(supplied.delay, 0, 0, MAX_SPRING_DURATION),
    skip:
      supplied.skip === "never"
        ? false
        : supplied.skip === "auto"
          ? prefersReducedMotion()
          : supplied.skip ?? prefersReducedMotion(),
  };
};

// Returns { values: number[0..~1], duration: ms }.
export const solveSpring = (settings, fromPos = 0, toPos = 1, v0) => {
  const cfg = resolvePhysicsSettings(settings);
  const from = finite(fromPos, 0, -1e9, 1e9);
  const to = finite(toPos, 1, -1e9, 1e9);
  const distance = Math.abs(to - from);
  if (distance <= Number.EPSILON) {
    return { values: [1], duration: 0 };
  }
  const k = -1e-6 * cfg.stiffness;
  const c = -1e-3 * cfg.damping;
  const velEps = cfg.precision / 22;
  const posEps = 10 * cfg.precision;
  const values = [];
  let pos = 0;
  let vel = finite(v0, cfg.initialVelocity, -10_000, 10_000);
  let velSettled = false;
  let posSettled = false;
  let steps = 0;
  while (!(velSettled && posSettled) && steps < MAX_SPRING_DURATION) {
    vel += (k * (pos - distance) + c * vel) / cfg.mass;
    pos += vel;
    if (!Number.isFinite(pos) || !Number.isFinite(vel)) break;
    velSettled = Math.abs(vel) <= velEps;
    posSettled = Math.abs(distance - pos) <= posEps;
    values.push(pos / distance);
    steps++;
  }
  if (values.length === 0) values.push(1);
  return { values, duration: steps };
};

// Public, options-object form. Keeping the positional solver internal lets us
// evolve its integration details without making that shape part of the API.
export const sampleSpring = (
  settings,
  { from = 0, to = 1, v0 } = {},
) => solveSpring(settings, from, to, v0);

// Spring-drive a scroll container's offset to `target` along one axis. `v0` is the
// initial velocity toward the target in px/ms (carries a fling's momentum). Snap is
// toggled off for the duration. Honors skip (and prefers-reduced-motion) + delay.
export const springScroll = (el, axis, target, settings, { onUpdate, onComplete, v0 = 0 } = {}) => {
  const cfg = resolvePhysicsSettings(settings);
  const prop = axis === "x" ? "scrollLeft" : "scrollTop";
  const destination = finite(target, el?.[prop] || 0, -1e9, 1e9);
  const skip = cfg.skip != null ? cfg.skip : prefersReducedMotion(el);
  const finish = () => {
    if (!el) return;
    el[prop] = destination;
    onUpdate && onUpdate(destination);
    onComplete && onComplete();
  };
  if (!el) return { cancel() {} };
  if (skip) {
    finish();
    return { cancel() {} };
  }
  const timeScale = (typeof window !== "undefined" && window.__VELVET_TIME_SCALE) || 1;
  const start = el[prop];
  const delta = destination - start;
  if (delta === 0) {
    finish();
    return { cancel() {} };
  }
  const { values, duration } = solveSpring(settings, start, destination, v0);
  const prevSnap = el.style.scrollSnapType;
  el.style.scrollSnapType = "none";
  let raf = 0;
  let cancelled = false;
  const run = () => {
    const t0 = performance.now();
    const tick = (now) => {
      if (cancelled) return;
      const ms = (now - t0) / timeScale;
      if (ms >= duration) {
        el.style.scrollSnapType = prevSnap;
        finish();
        return;
      }
      const idx = Math.max(0, Math.min(values.length - 1, Math.floor(ms)));
      el[prop] = start + delta * values[idx];
      onUpdate && onUpdate(el[prop]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };
  const delayTimer = cfg.delay ? setTimeout(run, cfg.delay) : (run(), 0);
  return {
    cancel() {
      cancelled = true;
      clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
      // NOTE: deliberately does NOT restore scrollSnapType. Cancel happens during a
      // handoff (new gesture / dismiss / unmount); re-arming mandatory snap here would
      // let the browser re-snap a mid-travel offset to the nearest point — the dismissal
      // "flicker". Resting snap is re-armed by the present effect's onComplete (open /
      // detent) and on natural spring completion; the next owner sets it otherwise.
    },
  };
};

// Sample the spring into a WAAPI linear() easing (decimated by 8) plus
// the physics duration. `from`/`to` are the real pixel distance the curve settles over.
export const springEasing = (settings, { from = 0, to = 300, v0 } = {}) => {
  const { values, duration } = solveSpring(settings, from, to, v0);
  if (duration === 0) return { duration: 0, easing: "linear" };
  const pts = decimateSpring(values);
  return { duration, easing: linearEasingFromSamples(pts) };
};

// CSS linear() requires at least two stops. A spring that starts within its
// positional settle threshold can legitimately emit one 1ms sample; falling
// back to ordinary linear timing keeps that degenerate travel valid while the
// keyframes still preserve its sampled endpoints.
export const linearEasingFromSamples = (values) => {
  const finiteValues = Array.isArray(values)
    ? values.filter(Number.isFinite)
    : [];
  return finiteValues.length >= 2
    ? `linear(${finiteValues.join(",")})`
    : "linear";
};

// Keep every eighth millisecond sample, excluding the final value from the
// loop. Append the final value only when the raw sample count is not divisible
// by eight. This slightly unusual rule is part of the reference curve shape.
export const decimateSpring = (values, amount = 8) => {
  if (!Array.isArray(values) || values.length === 0) return [];
  const stride = Math.max(1, Math.floor(finite(amount, 8, 1, 1_000)));
  const sampled = [];
  for (let index = 0; index < values.length - 1; index += stride) {
    if (Number.isFinite(values[index])) sampled.push(values[index]);
  }
  if (
    values.length % stride !== 0 &&
    Number.isFinite(values[values.length - 1])
  ) {
    sampled.push(values[values.length - 1]);
  }
  return sampled;
};
