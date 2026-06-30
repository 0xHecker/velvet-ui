// Spring physics: a fixed-timestep (dt = 1ms) semi-implicit Euler
// integration of a damped harmonic oscillator. Stiffness is scaled by 1e-6 and
// damping by 1e-3 so integer-millisecond steps produce natural motion. It emits a
// normalized progress array (0..~1) and the settle duration in ms. Consumed two ways:
//   springScroll() — rAF-drive a scroll offset along the curve (programmatic travel)
//   springEasing() — sample the curve into a WAAPI linear() easing string.

export const SPRING_PRESETS = {
  gentle: { stiffness: 560, damping: 68, mass: 1.85 },
  smooth: { stiffness: 580, damping: 60, mass: 1.35 },
  snappy: { stiffness: 350, damping: 34, mass: 0.9 },
  brisk: { stiffness: 350, damping: 28, mass: 0.65 },
  bouncy: { stiffness: 240, damping: 19, mass: 0.7 },
  elastic: { stiffness: 260, damping: 20, mass: 1 },
};

const DEFAULTS = { stiffness: 300, damping: 34, mass: 1, precision: 0.1 };

// Accepts: preset string | { preset, ... } | { easing:"spring", stiffness,... } | timing object.
const resolve = (settings) => {
  if (!settings) return { ...DEFAULTS, ...SPRING_PRESETS.smooth };
  if (typeof settings === "string") return { ...DEFAULTS, ...(SPRING_PRESETS[settings] || SPRING_PRESETS.smooth) };
  if (settings.preset) return { ...DEFAULTS, ...(SPRING_PRESETS[settings.preset] || SPRING_PRESETS.smooth), ...settings };
  return { ...DEFAULTS, ...settings };
};

const prefersReduced = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Returns { values: number[0..~1], duration: ms }.
export const solveSpring = (settings, fromPos = 0, toPos = 1, v0) => {
  const cfg = resolve(settings);
  const distance = Math.abs(toPos - fromPos);
  if (distance === 0) return { values: [1], duration: 0 };
  const k = -1e-6 * cfg.stiffness;
  const c = -1e-3 * cfg.damping;
  const velEps = cfg.precision / 22;
  const posEps = 10 * cfg.precision;
  const values = [];
  let pos = 0;
  let vel = v0 != null ? v0 : cfg.initialVelocity || 0;
  let velSettled = false;
  let posSettled = false;
  let steps = 0;
  while (!(velSettled && posSettled) && steps < 6000) {
    vel += (k * (pos - distance) + c * vel) / cfg.mass;
    pos += vel;
    velSettled = Math.abs(vel) <= velEps;
    posSettled = Math.abs(distance - pos) <= posEps;
    values.push(pos / distance);
    steps++;
  }
  return { values, duration: steps };
};

// Spring-drive a scroll container's offset to `target` along one axis. `v0` is the
// initial velocity toward the target in px/ms (carries a fling's momentum). Snap is
// toggled off for the duration. Honors skip (and prefers-reduced-motion) + delay.
export const springScroll = (el, axis, target, settings, { onUpdate, onComplete, v0 = 0 } = {}) => {
  const cfg = resolve(settings);
  const prop = axis === "x" ? "scrollLeft" : "scrollTop";
  const skip = cfg.skip != null ? cfg.skip : prefersReduced();
  const finish = () => {
    el[prop] = target;
    onUpdate && onUpdate(target);
    onComplete && onComplete();
  };
  if (skip) {
    finish();
    return { cancel() {} };
  }
  const timeScale = (typeof window !== "undefined" && window.__VELVET_TIME_SCALE) || 1;
  const start = el[prop];
  const delta = target - start;
  if (delta === 0) {
    finish();
    return { cancel() {} };
  }
  const { values, duration } = solveSpring(settings, start, target, v0);
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
  const pts = [0];
  for (let i = 0; i < values.length; i += 8) pts.push(values[i]);
  pts.push(1);
  return { duration, easing: `linear(${pts.map((v) => v.toFixed(5)).join(",")})` };
};
