import { solveSpring } from "../core/spring.js";
import { createDocumentStore } from "./DocumentStore.js";

const motionStore = createDocumentStore(() => ({
  activeViews: [],
  morphAnimations: new WeakMap(),
}));

const frontmostView = (target) => {
  const views = motionStore.peek(target)?.activeViews;
  return views?.[views.length - 1];
};

const installDebugController = (ownerDocument) => {
  const ownerWindow = ownerDocument?.defaultView;
  if (!ownerWindow || ownerWindow.__velvet) return;
  ownerWindow.__velvet = {
    freeze: (progress) => frontmostView(ownerDocument)?.freeze(progress),
    open: () => frontmostView(ownerDocument)?.open(),
    progress: () => frontmostView(ownerDocument)?.getProgress(),
    idle: () => {
      const view = frontmostView(ownerDocument);
      return view ? view.idle() : true;
    },
    count: () => motionStore.peek(ownerDocument)?.activeViews.length || 0,
    setTimeScale: (scale) => (ownerWindow.__VELVET_TIME_SCALE = scale),
  };
};

export const registerActiveView = (view) => {
  const ownerDocument = motionStore.documentOf(view?.element);
  const state = motionStore.get(ownerDocument);
  if (!ownerDocument || !state) return () => {};
  state.activeViews.push(view);
  installDebugController(ownerDocument);
  return () => {
    const index = state.activeViews.lastIndexOf(view);
    if (index >= 0) state.activeViews.splice(index, 1);
  };
};

export const isFrontmostView = (element) =>
  frontmostView(element)?.element === element;

export const registerMorphAnimation = (element, getAnimation) => {
  const state = motionStore.get(element);
  state?.morphAnimations.set(element, getAnimation);
};

export const unregisterMorphAnimation = (element) => {
  motionStore.peek(element)?.morphAnimations.delete(element);
};

export const getMorphAnimation = (element) =>
  motionStore.peek(element)?.morphAnimations.get(element);

export const hasMorphAnimation = (element) =>
  motionStore.peek(element)?.morphAnimations.has(element) || false;

export const captureElementGeometry = (element) => {
  if (!element?.getBoundingClientRect) return null;
  const rect = element.getBoundingClientRect();
  return {
    element,
    rect: {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    borderRadius:
      Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0,
  };
};

export const TRACK = {
  bottom: { axis: "y", openAtMax: true },
  top: { axis: "y", openAtMax: false },
  left: { axis: "x", openAtMax: false },
  right: { axis: "x", openAtMax: true },
  center: { axis: "y", openAtMax: true },
};

export const SCROLL_IDLE_MS = 200;
export const DETENT_TOLERANCE_PX = 2.1;
export const DEFAULT_EXIT_SPRING = Object.freeze({
  easing: "spring",
  stiffness: 520,
  damping: 44,
  mass: 1,
});

export const trackFromSettings = (settings) =>
  settings && typeof settings === "object" ? settings.track : undefined;
export const isLeadingTrack = (track) => track === "top" || track === "left";
export const clamp01 = (value) =>
  value < 0 ? 0 : value > 1 ? 1 : value;
export const maxOf = (element, axis) =>
  axis === "y"
    ? element.scrollHeight - element.clientHeight
    : element.scrollWidth - element.clientWidth;
export const offOf = (element, axis) =>
  axis === "y" ? element.scrollTop : element.scrollLeft;
export const clientOf = (element, axis) =>
  axis === "y" ? element.clientHeight : element.clientWidth;
export const setOff = (element, axis, value) => {
  if (axis === "y") element.scrollTop = value;
  else element.scrollLeft = value;
};

export const restoreProgrammaticOverflow = (motion) => {
  if (!motion?.scroll || motion.overflowRestored) return;
  motion.overflowRestored = true;
  const {
    scroll,
    previousOverflow,
    previousOverflowPriority,
    previousTouchAction,
    previousTouchActionPriority,
  } = motion;
  if (previousOverflow) {
    scroll.style.setProperty(
      "overflow",
      previousOverflow,
      previousOverflowPriority
    );
  } else {
    scroll.style.removeProperty("overflow");
  }
  if (previousTouchAction) {
    scroll.style.setProperty(
      "touch-action",
      previousTouchAction,
      previousTouchActionPriority
    );
  } else {
    scroll.style.removeProperty("touch-action");
  }
};

const USER_AGENT =
  typeof window !== "undefined" ? window.navigator.userAgent : null;
let browserEngine = "unknown";
let browserPlatform = "unknown";
if (typeof window !== "undefined" && navigator.userAgentData) {
  if (
    navigator.userAgentData.brands?.some(
      (brand) => brand.brand === "Chromium"
    )
  ) {
    browserEngine = "chromium";
  }
  if (navigator.userAgentData.platform === "Android") {
    browserPlatform = "android";
  }
}
if (browserPlatform === "unknown" && USER_AGENT?.match(/android/i)) {
  browserPlatform = "android";
}
if (browserEngine === "unknown") {
  if (USER_AGENT?.match(/Chrome/i)) browserEngine = "chromium";
  else if (USER_AGENT?.match(/Firefox/i)) browserEngine = "gecko";
  else if (USER_AGENT?.match(/Safari|iPhone/i)) browserEngine = "webkit";
}
if (browserEngine === "webkit") {
  if (USER_AGENT?.match(/iPhone/i)) browserPlatform = "ios";
  else if (USER_AGENT?.match(/iPad/i)) browserPlatform = "ipados";
  else if (USER_AGENT?.match(/Macintosh/i)) {
    try {
      document.createEvent("TouchEvent");
      browserPlatform = "ipados";
    } catch {
      browserPlatform = "macos";
    }
  }
}

const isWebKit = () => browserEngine === "webkit";
const isIOSWebKit = () =>
  browserPlatform === "ios" || browserPlatform === "ipados";
const isChromium = () => browserEngine === "chromium";

export const NATIVE_TRAVEL_CAPABLE =
  typeof window !== "undefined" &&
  typeof CSS !== "undefined" &&
  CSS.supports("scroll-snap-align: start") &&
  "IntersectionObserver" in window &&
  "IntersectionObserverEntry" in window &&
  "intersectionRatio" in window.IntersectionObserverEntry.prototype;

export const supportsLinearEasing = () =>
  typeof CSS !== "undefined" &&
  CSS.supports("transition-timing-function", "linear(0, 1)") &&
  !isWebKit();

export const resolveSnapOutAcceleration = (
  setting,
  viewLength,
  contentLength,
  placement
) => {
  if (setting === "initial") return 1;
  if (typeof setting === "function") {
    const result = Number.parseInt(setting(contentLength), 10);
    return result < 1
      ? 1
      : result > contentLength / 2
        ? contentLength / 2
        : result;
  }
  if (setting !== "auto") return undefined;
  const effectiveLength =
    placement === "center"
      ? contentLength + (viewLength - contentLength) / 2
      : contentLength;
  if (isChromium()) {
    return effectiveLength <= 1440
      ? 70 + 0.25 * effectiveLength
      : 0.3 * effectiveLength;
  }
  if (isWebKit()) {
    if (isIOSWebKit()) {
      return effectiveLength <= 716
        ? 15 + 0.1 * effectiveLength
        : 0.12 * effectiveLength;
    }
    return 0.5 * effectiveLength;
  }
  return 10;
};

const parseCubicBezier = (easing) => {
  const prefix = "cubic-bezier(";
  if (typeof easing !== "string" || !easing.startsWith(prefix)) return null;
  const values = easing
    .slice(prefix.length, -1)
    .split(",")
    .map((value) => Number.parseFloat(value.trim()));
  return values.length === 4 && !values.some(isNaN) ? values : null;
};

const cubicBezier = (x1, y1, x2, y2) => {
  if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
    throw new Error("bezier x values must be in [0, 1] range");
  }
  if (x1 === y1 && x2 === y2) return (value) => value;
  const sample = (time, first, second) =>
    ((1 - 3 * second + 3 * first) * time + (3 * second - 6 * first)) *
      time *
      time +
    3 * first * time;
  const slope = (time, first, second) =>
    3 * (1 - 3 * second + 3 * first) * time * time +
    2 * (3 * second - 6 * first) * time +
    3 * first;
  const samples =
    typeof Float32Array === "function" ? new Float32Array(11) : Array(11);
  for (let index = 0; index < 11; index++) {
    samples[index] = sample(index * 0.1, x1, x2);
  }
  return (x) => {
    if (x === 0 || x === 1) return x;
    let intervalStart = 0;
    let sampleIndex = 1;
    while (sampleIndex !== 10 && samples[sampleIndex] <= x) {
      intervalStart += 0.1;
      sampleIndex++;
    }
    sampleIndex--;
    let guess =
      intervalStart +
      ((x - samples[sampleIndex]) /
        (samples[sampleIndex + 1] - samples[sampleIndex])) *
        0.1;
    const initialSlope = slope(guess, x1, x2);
    if (initialSlope >= 0.001) {
      for (let index = 0; index < 4; index++) {
        const currentSlope = slope(guess, x1, x2);
        if (currentSlope === 0) break;
        guess -= (sample(guess, x1, x2) - x) / currentSlope;
      }
    } else if (initialSlope !== 0) {
      let lower = intervalStart;
      let upper = intervalStart + 0.1;
      let error;
      let iteration = 0;
      do {
        guess = lower + (upper - lower) / 2;
        error = sample(guess, x1, x2) - x;
        if (error > 0) upper = guess;
        else lower = guess;
      } while (Math.abs(error) > 1e-7 && ++iteration < 10);
    }
    return sample(guess, y1, y2);
  };
};

export const sampleMotion = (config, origin, destination) => {
  if (config?.easing && config.easing !== "spring") {
    const duration = config.duration ?? 250;
    const values = [];
    if (config.easing === "linear") {
      const step = 1 / (duration - 1);
      for (let index = 0; index < duration; index++) {
        const progress = index * step;
        values.push(Number.isNaN(progress) ? 0 : progress);
      }
    } else {
      const controls =
        config.easing === "ease"
          ? [0.25, 0.1, 0.25, 1]
          : config.easing === "ease-in"
            ? [0.42, 0, 1, 1]
            : config.easing === "ease-out"
              ? [0, 0, 0.58, 1]
              : config.easing === "ease-in-out"
                ? [0.42, 0, 0.58, 1]
                : parseCubicBezier(config.easing) || [0.25, 0.1, 0.25, 1];
      const easing = cubicBezier(...controls);
      for (let time = 0; time <= duration; time++) {
        values.push(easing(time / duration));
      }
    }
    return { values, duration };
  }
  return solveSpring(config, origin, destination, config?.initialVelocity);
};
