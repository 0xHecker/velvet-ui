import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Polymorph } from "./core/Slot.jsx";
import { useComposedRefs } from "./core/refs.js";
import {
  SPRING_PRESETS,
  decimateSpring,
  resolveSpringSettings,
  solveSpring,
} from "./core/spring.js";
import { applyTravel, travelStyles } from "./core/travel.js";
import { useSheetStack } from "./SheetStack.jsx";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Debug registry: lets tests/dev freeze the frontmost sheet at an exact travel
// progress for deterministic checkpoint screenshots.
const activeViews = [];
if (typeof window !== "undefined" && !window.__velvet) {
  window.__velvet = {
    freeze: (p) => activeViews[activeViews.length - 1]?.freeze(p),
    open: () => activeViews[activeViews.length - 1]?.open(),
    progress: () => activeViews[activeViews.length - 1]?.getProgress(),
    idle: () => {
      const v = activeViews[activeViews.length - 1];
      return v ? v.idle() : true;
    },
    count: () => activeViews.length,
    setTimeScale: (s) => (window.__VELVET_TIME_SCALE = s),
  };
}

// ---- Track geometry -------------------------------------------------------
// axis = travel axis; openAtMax = whether the open detent is at max scroll
// offset (bottom/right) or at 0 (top/left).
const TRACK = {
  bottom: { axis: "y", openAtMax: true },
  top: { axis: "y", openAtMax: false },
  left: { axis: "x", openAtMax: false },
  right: { axis: "x", openAtMax: true },
  center: { axis: "y", openAtMax: true },
};
const SCROLL_IDLE_MS = 200;
const DETENT_TOLERANCE_PX = 2.1;
const DEFAULT_EXIT_SPRING = Object.freeze({
  easing: "spring",
  stiffness: 520,
  damping: 44,
  mass: 1,
});
const trackFromSettings = (settings) =>
  settings && typeof settings === "object" ? settings.track : undefined;
const isLeadingTrack = (track) => track === "top" || track === "left";
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const maxOf = (el, axis) =>
  axis === "y" ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
const offOf = (el, axis) => (axis === "y" ? el.scrollTop : el.scrollLeft);
const clientOf = (el, axis) => (axis === "y" ? el.clientHeight : el.clientWidth);
const setOff = (el, axis, v) => {
  if (axis === "y") el.scrollTop = v;
  else el.scrollLeft = v;
};
const USER_AGENT = typeof window !== "undefined" ? window.navigator.userAgent : null;
let BROWSER_ENGINE = "unknown";
let BROWSER_PLATFORM = "unknown";
if (typeof window !== "undefined" && navigator.userAgentData) {
  if (navigator.userAgentData.brands?.some((brand) => brand.brand === "Chromium")) {
    BROWSER_ENGINE = "chromium";
  }
  if (navigator.userAgentData.platform === "Android") BROWSER_PLATFORM = "android";
}
if (BROWSER_PLATFORM === "unknown" && USER_AGENT?.match(/android/i)) {
  BROWSER_PLATFORM = "android";
}
if (BROWSER_ENGINE === "unknown") {
  if (USER_AGENT?.match(/Chrome/i)) BROWSER_ENGINE = "chromium";
  else if (USER_AGENT?.match(/Firefox/i)) BROWSER_ENGINE = "gecko";
  else if (USER_AGENT?.match(/Safari|iPhone/i)) BROWSER_ENGINE = "webkit";
}
if (BROWSER_ENGINE === "webkit") {
  if (USER_AGENT?.match(/iPhone/i)) BROWSER_PLATFORM = "ios";
  else if (USER_AGENT?.match(/iPad/i)) BROWSER_PLATFORM = "ipados";
  else if (USER_AGENT?.match(/Macintosh/i)) {
    try {
      document.createEvent("TouchEvent");
      BROWSER_PLATFORM = "ipados";
    } catch {
      BROWSER_PLATFORM = "macos";
    }
  }
}
const isWebKit = () => BROWSER_ENGINE === "webkit";
const isIOSWebKit = () =>
  BROWSER_PLATFORM === "ios" || BROWSER_PLATFORM === "ipados";
const isChromium = () => BROWSER_ENGINE === "chromium";
const NATIVE_TRAVEL_CAPABLE =
  typeof window !== "undefined" &&
  typeof CSS !== "undefined" &&
  CSS.supports("scroll-snap-align: start") &&
  "IntersectionObserver" in window &&
  "IntersectionObserverEntry" in window &&
  "intersectionRatio" in window.IntersectionObserverEntry.prototype;
const supportsLinearEasing = () =>
  typeof CSS !== "undefined" &&
  CSS.supports("transition-timing-function", "linear(0, 1)") &&
  !isWebKit();

const resolveSnapOutAcceleration = (setting, viewLength, contentLength, placement) => {
  if (setting === "initial") return 1;
  if (typeof setting === "function") {
    const result = Number.parseInt(setting(contentLength), 10);
    return result < 1 ? 1 : result > contentLength / 2 ? contentLength / 2 : result;
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
  const samples = typeof Float32Array === "function" ? new Float32Array(11) : Array(11);
  for (let index = 0; index < 11; index++) samples[index] = sample(index * 0.1, x1, x2);
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

const sampleMotion = (config, origin, destination) => {
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
      for (let time = 0; time <= duration; time++) values.push(easing(time / duration));
    }
    return { values, duration };
  }
  return solveSpring(config, origin, destination, config?.initialVelocity);
};

// Ref-counted body scroll lock: only the first lock applies overflow:hidden +
// scrollbar-gap padding; only the last unlock removes it. Without ref-counting,
// a closing stacked sheet wiped the compensation the sheet below still needed,
// causing a layout shift.
let scrollLocks = 0;
const lockScroll = () => {
  if (scrollLocks++ > 0) return;
  const el = document.documentElement;
  const gap = window.innerWidth - el.clientWidth;
  el.setAttribute("data-velvet-scroll-locked", "");
  if (gap > 0) el.style.paddingRight = `${gap}px`;
};
const unlockScroll = () => {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks > 0) return;
  const el = document.documentElement;
  el.removeAttribute("data-velvet-scroll-locked");
  el.style.paddingRight = "";
};

// ---- Context --------------------------------------------------------------
const SheetCtx = createContext(null);
const SheetPreviewCtx = createContext(null);
const useSheet = () => {
  const ctx = useContext(SheetCtx);
  if (!ctx) throw new Error("Velvet Sheet sub-components must be used within <Sheet.Root>");
  return ctx;
};

// Gallery previews run the exact same Sheet trees inside a bounded local
// viewport. The environment controls each nested Root by depth while keeping
// all of the real travel, detent, and SheetStack behavior intact.
const PreviewEnvironment = ({ container, layers, onLayerPresentedChange, children }) => {
  const value = useMemo(
    () => ({ container, layers, onLayerPresentedChange }),
    [container, layers, onLayerPresentedChange]
  );
  return <SheetPreviewCtx.Provider value={value}>{children}</SheetPreviewCtx.Provider>;
};

// Subscribe an element to the Sheet's travel progress. Layout effect so it
// registers before the present effect emits the initial (closed) progress.
const useTravel = (ref, travelAnimation, fallback) => {
  const { subscribeTravel, registerTravelAnimation } = useSheet();
  const animRef = useRef(travelAnimation);
  animRef.current = travelAnimation;
  useIso(
    () =>
      subscribeTravel(({ progress }, { waapi } = {}) => {
        if (waapi) return;
        const el = ref.current;
        const map = animRef.current || fallback;
        if (el && map) applyTravel(el, map, progress);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subscribeTravel]
  );
  useIso(
    () =>
      registerTravelAnimation({
        ref,
        getAnimation: () => animRef.current || fallback,
      }),
    [fallback, ref, registerTravelAnimation]
  );
};

// Subscribe an element to the Sheet's stacking progress (driven by the sheet
// directly above it within a SheetStack).
const useStacking = (ref, stackingAnimation) => {
  const { subscribeStacking, registerStackingAnimation } = useSheet();
  const animRef = useRef(stackingAnimation);
  animRef.current = stackingAnimation;
  useIso(
    () =>
      subscribeStacking((progress, { waapi } = {}) => {
        if (waapi) return;
        const el = ref.current;
        if (el && animRef.current) applyTravel(el, animRef.current, progress);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subscribeStacking]
  );
  useIso(
    () =>
      registerStackingAnimation({
        ref,
        getAnimation: () => animRef.current,
      }),
    [ref, registerStackingAnimation]
  );
};

const useControllable = (controlled, defaultValue, onChange) => {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : uncontrolled;
  const setValue = useCallback(
    (next) => {
      const resolved = typeof next === "function" ? next(value) : next;
      if (!isControlled) setUncontrolled(resolved);
      onChange && onChange(resolved);
    },
    [isControlled, onChange, value]
  );
  return [value, setValue];
};

// ---- Root -----------------------------------------------------------------
const Root = ({
  children,
  presented: presentedProp,
  defaultPresented = false,
  onPresentedChange,
  activeDetent: activeDetentProp,
  defaultActiveDetent,
  onActiveDetentChange,
  sheetRole = "dialog",
  license,
}) => {
  const parentSheet = useContext(SheetCtx);
  const preview = useContext(SheetPreviewCtx);
  const depth = (parentSheet?.depth ?? -1) + 1;
  const controlledPresented = preview
    ? Boolean(preview.layers?.[depth])
    : presentedProp;
  const controlledPresentedChange = preview
    ? (next) => preview.onLayerPresentedChange?.(depth, next)
    : onPresentedChange;
  const [presented, setPresented] = useControllable(
    controlledPresented,
    defaultPresented,
    controlledPresentedChange
  );
  const [activeDetent, setActiveDetent] = useControllable(
    activeDetentProp,
    defaultActiveDetent ?? (defaultPresented ? 1 : 0),
    onActiveDetentChange
  );
  // Keep the portal mounted through the exit animation.
  const [mounted, setMounted] = useState(presented);
  const presentedRef = useRef(presented);
  presentedRef.current = presented;
  useEffect(() => {
    if (presented) setMounted(true);
  }, [presented]);

  const travelListeners = useRef(new Set());
  const travelAnimations = useRef(new Set());
  const emitTravel = useCallback((payload, metadata) => {
    travelListeners.current.forEach((fn) => fn(payload, metadata));
  }, []);
  const subscribeTravel = useCallback((fn) => {
    travelListeners.current.add(fn);
    return () => travelListeners.current.delete(fn);
  }, []);
  const registerTravelAnimation = useCallback((entry) => {
    travelAnimations.current.add(entry);
    return () => travelAnimations.current.delete(entry);
  }, []);
  const getTravelAnimations = useCallback(() => [...travelAnimations.current], []);

  const stackingListeners = useRef(new Set());
  const stackingAnimations = useRef(new Set());
  const emitStacking = useCallback((progress, metadata) => {
    stackingListeners.current.forEach((fn) => fn(progress, metadata));
  }, []);
  const subscribeStacking = useCallback((fn) => {
    stackingListeners.current.add(fn);
    return () => stackingListeners.current.delete(fn);
  }, []);
  const registerStackingAnimation = useCallback((entry) => {
    stackingAnimations.current.add(entry);
    return () => stackingAnimations.current.delete(entry);
  }, []);
  const getStackingAnimations = useCallback(() => [...stackingAnimations.current], []);

  const titleId = useId();
  const descriptionId = useId();
  const hasTitle = useRef(false);
  const hasDescription = useRef(false);
  const detentCount = useRef(1);
  const lastFocused = useRef(null);
  const actionDispatcherRef = useRef(null);
  const actionStateRef = useRef({ presented, activeDetent });
  actionStateRef.current = { presented, activeDetent };

  const performAction = useCallback(
    (action, stateOverride) => {
      const state = { ...actionStateRef.current, ...stateOverride };
      if (action.type === "present") {
        setPresented(true);
        return;
      }
      if (action.type === "dismiss") {
        setPresented(false);
        return;
      }
      if (action.type === "toggle") {
        setPresented((value) => !value);
        return;
      }
      if (action.type !== "step") return;
      const count = detentCount.current;
      const current = state.activeDetent || 1;
      let next;
      if (action.detent != null) next = action.detent;
      else if (action.direction === "down") next = current <= 1 ? count : current - 1;
      else next = current >= count ? 1 : current + 1;
      if (next <= 0) {
        setPresented(false);
        return;
      }
      if (!state.presented) setPresented(true);
      setActiveDetent(next);
    },
    [setActiveDetent, setPresented]
  );
  const requestAction = useCallback(
    (action) => {
      const dispatch = actionDispatcherRef.current;
      if (dispatch) dispatch(action);
      else performAction(action);
    },
    [performAction]
  );

  const ctx = useMemo(
    () => ({
      presented,
      setPresented,
      activeDetent,
      setActiveDetent,
      mounted,
      finishExit: () => {
        if (!presentedRef.current) {
          setMounted(false);
          setActiveDetent(defaultActiveDetent ?? (defaultPresented ? 1 : 0)); // reopen at the default detent
        }
      },
      sheetRole,
      subscribeTravel,
      registerTravelAnimation,
      getTravelAnimations,
      emitTravel,
      subscribeStacking,
      registerStackingAnimation,
      getStackingAnimations,
      emitStacking,
      titleId,
      descriptionId,
      hasTitle,
      hasDescription,
      detentCount,
      lastFocused,
      actionDispatcherRef,
      performAction,
      requestAction,
      preview,
      depth,
    }),
    [
      presented,
      setPresented,
      activeDetent,
      setActiveDetent,
      mounted,
      sheetRole,
      subscribeTravel,
      registerTravelAnimation,
      getTravelAnimations,
      emitTravel,
      registerStackingAnimation,
      getStackingAnimations,
      titleId,
      descriptionId,
      defaultActiveDetent,
      defaultPresented,
      performAction,
      requestAction,
      preview,
      depth,
    ]
  );

  return <SheetCtx.Provider value={ctx}>{children}</SheetCtx.Provider>;
};

// ---- Portal ---------------------------------------------------------------
const Portal = ({ children, container }) => {
  const { mounted, preview } = useSheet();
  if (!mounted) return null;
  const target = container || preview?.container;
  if (preview && !target) return null;
  return createPortal(children, target || document.body);
};

// ---- View -----------------------------------------------------------------
// Gesture travel is a native mandatory-scroll-snap system. JavaScript never
// estimates release velocity or chooses a projected detent; the browser does
// both. JavaScript measures the hidden snap geometry, reports travel, and uses
// the fixed-timestep spring only for programmatic present/step/dismiss actions.
const View = forwardRef(function View(
  {
    children,
    className,
    style,
    asChild,
    contentPlacement,
    tracks,
    detents,
    swipe = true,
    swipeDismissal = true,
    swipeOvershoot = true,
    swipeTrap,
    snapOutAcceleration = "auto",
    snapToEndDetentsAcceleration = "auto",
    inertOutside = true,
    enteringAnimationSettings,
    exitingAnimationSettings,
    steppingAnimationSettings,
    onTravel,
    onTravelStart,
    onTravelEnd,
    onTravelStatusChange,
    onClickOutside,
    onEscapeKeyDown,
    nativeEdgeSwipePrevention,
    ...rest
  },
  forwardedRef
) {
  const sheet = useSheet();
  const {
    presented,
    setPresented,
    activeDetent,
    setActiveDetent,
    sheetRole,
    emitTravel,
    emitStacking,
    getTravelAnimations,
    getStackingAnimations,
    finishExit,
    titleId,
    descriptionId,
    hasTitle,
    hasDescription,
    lastFocused,
    actionDispatcherRef,
    performAction,
  } = sheet;

  const isPreview = Boolean(sheet.preview);
  const swipeEnabled = !isPreview && swipe;
  const modal = isPreview ? false : inertOutside;
  const dismissible = swipeDismissal !== false && sheetRole !== "alertdialog";
  const detentList = useMemo(
    () => (detents == null ? [] : Array.isArray(detents) ? detents : [detents]),
    [detents]
  );
  const hasDetents = detentList.length > 0;
  const [restingInside, setRestingInside] = useState(false);
  useEffect(() => {
    if (!presented) setRestingInside(false);
  }, [presented]);
  // Silk only switches to persistent snap geometry after the sheet has
  // finished entering. During entering/exiting it uses the ordinary outside
  // geometry so the first/last programmatic travel has a real distance.
  const actualSwipeOutDisabledWithDetent =
    swipeEnabled && !dismissible && hasDetents && presented && restingInside;

  const trackList = useMemo(() => {
    if (Array.isArray(tracks)) return tracks;
    if (tracks) return [tracks];
    if (contentPlacement && contentPlacement !== "center") return [contentPlacement];
    return ["bottom"];
  }, [contentPlacement, tracks]);
  const dualTracks = trackList.length === 2;
  const placement = contentPlacement || (dualTracks ? "center" : trackList[0]);
  const primaryTrack = dualTracks
    ? trackList.includes("bottom")
      ? "bottom"
      : trackList.includes("right")
        ? "right"
        : trackList[trackList.length - 1]
    : trackList[0];
  const primaryGeometry = TRACK[primaryTrack] || TRACK.bottom;
  const { axis, openAtMax } = primaryGeometry;
  const validDualTracks =
    dualTracks &&
    trackList.every((candidate) => TRACK[candidate]?.axis === axis) &&
    trackList.some(isLeadingTrack) &&
    trackList.some((candidate) => !isLeadingTrack(candidate));
  const actualTrack = validDualTracks ? (axis === "y" ? "vertical" : "horizontal") : primaryTrack;
  const swipeOvershootDisabled = (!validDualTracks || !dismissible) && !swipeOvershoot;
  const nativeScrollEnabled =
    swipeEnabled && NATIVE_TRAVEL_CAPABLE && (dismissible || hasDetents);
  const configurationKey = `${actualTrack}|${placement}|${detentList.join("|")}|${dismissible}|${swipeOvershoot}|${actualSwipeOutDisabledWithDetent}`;

  const viewRef = useRef(null);
  const scrollRef = useRef(null);
  const composedView = useComposedRefs(forwardedRef, viewRef);
  const geometryRef = useRef(null);
  const previousDetentRef = useRef(0);
  const configurationRef = useRef(null);
  const exitTrackRef = useRef(primaryTrack);
  const activeRef = useRef(false);
  const programmaticRef = useRef(false);
  const motionRef = useRef(null);
  const motionTokenRef = useRef(0);
  const scrollSequenceRef = useRef(false);
  const scrollEndTimerRef = useRef(0);
  const travelRafRef = useRef(0);
  const ignoreNextProgrammaticScrollRef = useRef(false);
  const touchOngoingRef = useRef(false);
  const progressFilterRef = useRef({ previous: 0, delta: 0 });
  const observerRef = useRef(null);
  const observerWheelCleanupRef = useRef(null);
  const wheelSeenRef = useRef(false);
  const nativeDismissRef = useRef(false);
  const movedRef = useRef(false);
  const pointerDownTargetRef = useRef(null);
  const pendingStepRef = useRef(null);
  const pendingStepRafRef = useRef([0, 0]);
  const liveDetentRef = useRef(activeDetent);
  liveDetentRef.current = activeDetent;

  const stack = useSheetStack();
  const stackId = useId();
  const stackHandleRef = useRef(null);
  const lastRangeRef = useRef({ start: 0, end: 0 });
  const lastVisualCoordinateRef = useRef(null);

  const rangeForProgress = useCallback((progress) => {
    const stops = geometryRef.current?.progressAtDetents || [
      { before: -DETENT_TOLERANCE_PX, exact: 0, after: DETENT_TOLERANCE_PX },
      { before: 1 - DETENT_TOLERANCE_PX, exact: 1, after: 1 + DETENT_TOLERANCE_PX },
    ];
    for (let index = 0; index < stops.length; index++) {
      const stop = stops[index];
      if (progress > stop.after && index + 1 < stops.length && progress < stops[index + 1].before) {
        return { start: index, end: index + 1 };
      }
      if (progress > stop.before && progress < stop.after) {
        return { start: index, end: index };
      }
      if (progress <= 0) return { start: 0, end: 0 };
    }
    return lastRangeRef.current;
  }, []);

  const reportTravel = useCallback(
    (progress, forcedRange, metadata) => {
      const exact = geometryRef.current?.exactProgressAtDetents || [0, 1];
      const range = forcedRange || rangeForProgress(progress);
      lastRangeRef.current = range;
      const payload = {
        progress,
        range,
        progressAtDetents: exact,
      };
      emitTravel(payload, metadata);
      stackHandleRef.current?.update(progress, metadata);
      onTravel?.(payload);
    },
    [emitTravel, onTravel, rangeForProgress]
  );

  useIso(() => {
    if (!stack) return undefined;
    const handle = stack.register(stackId, { getStackingAnimations });
    stackHandleRef.current = handle;
    const unsubscribe = stack.subscribeAbove(stackId, emitStacking);
    return () => {
      unsubscribe();
      handle.unregister();
      stackHandleRef.current = null;
    };
  }, [stack, stackId, emitStacking, getStackingAnimations]);

  const resolveCssLength = useCallback(
    (value) => {
      if (typeof value === "number") return value;
      const host = viewRef.current;
      if (!host) return 0;
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;inset:auto;";
      probe.style[axis === "y" ? "height" : "width"] = String(value);
      probe.style[axis === "y" ? "width" : "height"] = "1px";
      host.appendChild(probe);
      // Computed layout pixels are transform-independent. DOMRect is not: the
      // gallery renders real components inside scaled preview canvases, which
      // previously turned a 96px detent into 48px.
      const computed = window.getComputedStyle(probe);
      const result = Number.parseFloat(computed[axis === "y" ? "height" : "width"]);
      probe.remove();
      return result;
    },
    [axis]
  );

  const measureGeometry = useCallback(() => {
    const view = viewRef.current;
    const scroll = scrollRef.current;
    const content = scroll?.querySelector('[data-velvet="content"]');
    if (!view || !scroll || !content) return null;

    const viewStyles = window.getComputedStyle(view);
    const contentStyles = window.getComputedStyle(content);
    const viewLength = Number.parseFloat(viewStyles[axis === "y" ? "height" : "width"]);
    const contentLength = Number.parseFloat(
      contentStyles[axis === "y" ? "height" : "width"]
    );
    if (!(viewLength > 0) || !(contentLength > 0)) return null;

    const detentLengths = detentList.map(resolveCssLength);
    const markerEnds = [...detentLengths, contentLength];
    const markers = markerEnds.map((end, index) => ({
      start: index === 0 ? 0 : markerEnds[index - 1],
      end,
      size: end - (index === 0 ? 0 : markerEnds[index - 1]),
    }));
    const accelerator = resolveSnapOutAcceleration(
      snapOutAcceleration,
      viewLength,
      contentLength,
      placement
    );
    const endAccelerator = swipeOvershootDisabled
      ? snapToEndDetentsAcceleration === "auto"
        ? 10
        : 1
      : 0;
    const firstDetent = detentLengths[0] || 0;

    let frontLength;
    if (actualSwipeOutDisabledWithDetent) {
      frontLength = contentLength - firstDetent + endAccelerator;
    } else if (validDualTracks) {
      frontLength =
        viewLength / 2 +
        viewLength -
        (viewLength - contentLength) / 2 +
        accelerator;
    } else if (placement === "center") {
      frontLength =
        viewLength - (viewLength - contentLength) / 2 + accelerator;
    } else {
      frontLength = contentLength + accelerator;
    }
    const backLength =
      swipeOvershootDisabled && snapToEndDetentsAcceleration === "auto"
        ? viewLength + endAccelerator
        : validDualTracks
          ? viewLength / 2 +
            viewLength -
            (viewLength - contentLength) / 2 +
            accelerator
          : viewLength;

    const exactProgressAtDetents = [
      0,
      ...detentLengths.map((length) => length / contentLength),
      1,
    ];
    const progressAtDetents = exactProgressAtDetents.map((exact) => ({
      before: exact - DETENT_TOLERANCE_PX / contentLength,
      exact,
      after: exact + DETENT_TOLERANCE_PX / contentLength,
    }));
    const openDistance = contentLength + (viewLength - contentLength) / 2;
    const openCenter = validDualTracks ? accelerator + openDistance : null;
    const maxOffset = Math.max(0, frontLength + backLength - viewLength);

    scroll.style.setProperty("--velvet-view-axis", `${viewLength}px`);
    scroll.style.setProperty("--velvet-content-axis", `${contentLength}px`);
    scroll.style.setProperty("--velvet-front-axis", `${frontLength}px`);
    scroll.style.setProperty("--velvet-back-axis", `${backLength}px`);
    scroll.style.setProperty("--velvet-snap-accelerator", `${accelerator}px`);
    scroll.style.setProperty("--velvet-end-accelerator", `${endAccelerator}px`);
    scroll.style.setProperty("--velvet-first-detent", `${firstDetent}px`);
    scroll.querySelectorAll('[data-velvet="detent-marker"]').forEach((marker, index) => {
      const dimensions = markers[index];
      if (!dimensions) return;
      marker.style.setProperty("--velvet-marker-start", `${dimensions.start}px`);
      marker.style.setProperty("--velvet-marker-end", `${dimensions.end}px`);
      marker.style.setProperty("--velvet-marker-size", `${dimensions.size}px`);
      marker.style.setProperty("--velvet-marker-index", index);
    });

    const initialIndex = Math.min(
      Math.max(previousDetentRef.current || 0, 0),
      exactProgressAtDetents.length - 1
    );
    progressFilterRef.current = {
      previous: exactProgressAtDetents[initialIndex],
      delta: 0,
    };
    const geometry = {
      viewLength,
      contentLength,
      detentLengths,
      markerEnds,
      markers,
      accelerator,
      endAccelerator,
      firstDetent,
      frontLength,
      backLength,
      maxOffset,
      openDistance,
      openCenter,
      exactProgressAtDetents,
      progressAtDetents,
    };
    geometryRef.current = geometry;
    sheet.detentCount.current = markerEnds.length;
    return geometry;
  }, [
    actualSwipeOutDisabledWithDetent,
    axis,
    detentList,
    placement,
    resolveCssLength,
    sheet.detentCount,
    snapOutAcceleration,
    snapToEndDetentsAcceleration,
    swipeOvershootDisabled,
    validDualTracks,
  ]);

  const readVisualCoordinate = useCallback(() => {
    const view = viewRef.current;
    const wrapper = scrollRef.current?.querySelector('[data-velvet="content-area"]');
    const geometry = geometryRef.current;
    if (!view || !wrapper || !geometry) return null;
    const wrapperRect = wrapper.getBoundingClientRect();
    const viewRect = view.getBoundingClientRect();
    const renderedViewLength = axis === "y" ? viewRect.height : viewRect.width;
    const coordinateScale = renderedViewLength / geometry.viewLength || 1;
    return (
      (axis === "y"
        ? wrapperRect.top - viewRect.top
        : wrapperRect.left - viewRect.left) / coordinateScale
    );
  }, [axis]);

  const targetOffset = useCallback(
    (detent, track = exitTrackRef.current) => {
      const geometry = geometryRef.current || measureGeometry();
      if (!geometry) return 0;
      const last = geometry.exactProgressAtDetents.length - 1;
      const destination = Math.min(Math.max(detent, 0), last);
      const leading = isLeadingTrack(track);
      const markerOffset = destination === 0 ? 0 : geometry.markerEnds[destination - 1];
      if (validDualTracks) {
        if (destination === last) return geometry.openCenter;
        if (destination === 0) return leading ? 10000 : 0;
        return 0;
      }
      if (!leading) {
        if (destination === last) return 10000;
        if (actualSwipeOutDisabledWithDetent) {
          if (destination <= 1) return 0;
          return markerOffset - geometry.firstDetent;
        }
        if (destination === 0) return 0;
        return markerOffset + geometry.accelerator;
      }
      let correction;
      if (actualSwipeOutDisabledWithDetent) {
        correction =
          destination === 1
            ? 2 * geometry.endAccelerator
            : destination === last
              ? 0
              : geometry.endAccelerator;
      } else {
        correction =
          destination === 0
            ? geometry.accelerator
            : destination === last
              ? geometry.endAccelerator
              : 0;
      }
      if (placement === "center") {
        return destination === 0
          ? geometry.openDistance - markerOffset + correction
          : 0;
      }
      return geometry.contentLength - markerOffset + correction;
    },
    [actualSwipeOutDisabledWithDetent, measureGeometry, placement, validDualTracks]
  );

  const rawProgressOf = useCallback(() => {
    const scroll = scrollRef.current;
    const geometry = geometryRef.current;
    if (!scroll || !geometry) return 0;
    const offset = offOf(scroll, axis);
    let progress;
    if (validDualTracks) {
      progress = 1 - Math.abs(offset - geometry.openCenter) / geometry.openDistance;
    } else if (openAtMax) {
      if (actualSwipeOutDisabledWithDetent) {
        progress =
          (offset + geometry.firstDetent - geometry.endAccelerator) /
          geometry.contentLength;
      } else if (placement === "center") {
        progress = (offset - geometry.accelerator) / geometry.openDistance;
      } else {
        progress = (offset - geometry.accelerator) / geometry.contentLength;
      }
    } else if (placement === "center") {
      progress =
        (geometry.openDistance + geometry.endAccelerator - offset) /
        geometry.openDistance;
    } else {
      progress =
        (geometry.contentLength + geometry.endAccelerator - offset) /
        geometry.contentLength;
    }
    const minimum = swipeOvershootDisabled && actualSwipeOutDisabledWithDetent
      ? geometry.exactProgressAtDetents[1]
      : 0;
    const maximum = swipeOvershootDisabled ? 1 : 10;
    return Math.min(Math.max(progress, minimum), maximum);
  }, [
    actualSwipeOutDisabledWithDetent,
    axis,
    openAtMax,
    placement,
    swipeOvershootDisabled,
    validDualTracks,
  ]);

  const progressOf = useCallback(() => {
    const raw = rawProgressOf();
    const state = progressFilterRef.current;
    let filtered = raw;
    let delta = state.previous - raw;
    if (
      touchOngoingRef.current &&
      (delta === 0 || Math.abs(delta) < Math.abs(state.delta / 2))
    ) {
      filtered = state.previous - state.delta / 2;
      delta = state.previous - filtered;
    }
    if (Math.abs(delta) >= 0.1 && Math.abs(delta) < 0.35) {
      filtered = delta >= 0 ? state.previous - 0.1 : state.previous + 0.1;
      delta = delta >= 0 ? 0.1 : -0.1;
    }
    if (raw <= 0) filtered = 0;
    state.previous = filtered;
    state.delta = delta;
    return filtered;
  }, [rawProgressOf]);

  const cancelMotion = useCallback(({ preserveVisual = false } = {}) => {
    motionTokenRef.current += 1;
    const motion = motionRef.current;
    if (!motion) return;
    cancelAnimationFrame(motion.raf || 0);
    cancelAnimationFrame(motion.raf2 || 0);
    cancelAnimationFrame(motion.travelRaf || 0);
    motion.animations?.forEach((entry) => {
      const animation = entry.animation || entry;
      if (preserveVisual) {
        try {
          animation.commitStyles();
        } catch {
          const computed = entry.target && window.getComputedStyle(entry.target);
          entry.properties?.forEach((property) => {
            const cssProperty = property.startsWith("--")
              ? property
              : property.replace(/[A-Z]/g, "-$&").toLowerCase();
            const value = computed?.getPropertyValue(cssProperty);
            if (value) entry.target.style.setProperty(cssProperty, value);
          });
        }
      }
      animation.cancel();
    });
    motionRef.current = null;
    programmaticRef.current = false;
  }, []);

  const suppressAsyncScrollEvent = useCallback((destination) => {
    const scroll = scrollRef.current;
    if (!scroll || !Number.isFinite(destination)) {
      return false;
    }
    const reachableDestination = Math.min(Math.max(destination, 0), maxOf(scroll, axis));
    if (Math.abs(offOf(scroll, axis) - reachableDestination) < 0.5) return false;
    // Silk marks exactly one programmatic scroll event. A time window can eat
    // the beginning of a real gesture or expire before a delayed browser event.
    ignoreNextProgrammaticScrollRef.current = true;
    return true;
  }, [axis]);

  const runProgrammaticTravel = useCallback(
    ({
      destination,
      track,
      settings,
      travelStatus,
      runStart = true,
      originCoordinateOverride,
      onComplete,
    }) => {
      const view = viewRef.current;
      const scroll = scrollRef.current;
      const wrapper = scroll?.querySelector('[data-velvet="content-area"]');
      const geometry = measureGeometry();
      if (!view || !scroll || !wrapper || !geometry) return;

      const config = settings;
      const exact = geometry.exactProgressAtDetents;
      const last = exact.length - 1;
      const targetDetent = Math.min(Math.max(destination, 0), last);
      const destinationProgress = exact[targetDetent];
      const destinationOffset = targetOffset(targetDetent, track);
      const wrapperRect = wrapper.getBoundingClientRect();
      const viewRect = view.getBoundingClientRect();
      // DOMRect coordinates include ancestor transforms, while measured CSS
      // lengths and WAAPI translate values live in the element's unscaled
      // coordinate space. Card previews render the real component inside a
      // scaled canvas, so normalise the rect delta before solving the travel.
      const renderedViewLength = axis === "y" ? viewRect.height : viewRect.width;
      const coordinateScale = renderedViewLength / geometry.viewLength || 1;
      const measuredOriginCoordinate =
        (axis === "y"
          ? wrapperRect.top - viewRect.top
          : wrapperRect.left - viewRect.left) / coordinateScale;
      const originCoordinate = Number.isFinite(originCoordinateOverride)
        ? originCoordinateOverride
        : measuredOriginCoordinate;
      const travelLength =
        placement === "center"
          ? geometry.contentLength + (geometry.viewLength - geometry.contentLength) / 2
          : geometry.contentLength;
      const originPosition = isLeadingTrack(track)
        ? originCoordinate + travelLength
        : originCoordinate - travelLength;
      const destinationPosition =
        (isLeadingTrack(track) ? 1 : -1) * destinationProgress * travelLength;
      const originProgress = Math.max(Math.abs(originPosition) / travelLength, 0);
      const progressDistance = destinationProgress - originProgress;
      const contentMove = !(Object.hasOwn(config, "contentMove") && !config.contentMove);

      // Reverse from the rendered pose. commitStyles() keeps the current WAAPI
      // frame alive while the replacement travel takes ownership in the next
      // double-rAF, so hover enter/leave never teleports to the old endpoint.
      cancelMotion({ preserveVisual: true });
      if (!contentMove) wrapper.style.removeProperty("transform");

      if (runStart) {
        onTravelStatusChange?.(travelStatus);
        onTravelStart?.();
      }
      if (config.skip) {
        wrapper.style.removeProperty("transform");
        programmaticRef.current = true;
        suppressAsyncScrollEvent(destinationOffset);
        setOff(scroll, axis, destinationOffset);
        reportTravel(destinationProgress, { start: targetDetent, end: targetDetent });
        lastVisualCoordinateRef.current = readVisualCoordinate();
        programmaticRef.current = false;
        onComplete?.();
        onTravelEnd?.();
        return;
      }

      if (
        !Number.isFinite(originPosition) ||
        !Number.isFinite(destinationPosition) ||
        Math.abs(originPosition - destinationPosition) < 0.0001
      ) {
        wrapper.style.removeProperty("transform");
        programmaticRef.current = true;
        suppressAsyncScrollEvent(destinationOffset);
        setOff(scroll, axis, destinationOffset);
        reportTravel(destinationProgress, { start: targetDetent, end: targetDetent });
        lastVisualCoordinateRef.current = readVisualCoordinate();
        programmaticRef.current = false;
        onComplete?.();
        onTravelEnd?.();
        return;
      }
      const { values: rawValues, duration } = sampleMotion(
        config,
        originPosition,
        destinationPosition
      );
      const decimated = decimateSpring(rawValues, 8);
      const visualValues = decimated.length ? decimated : [1];
      const mappedValues = visualValues.map(
        (value) => originProgress + progressDistance * value
      );
      const translateAxis = axis === "x" ? "X" : "Y";
      const transformAt = (value) =>
        `translate${translateAxis}(${(originPosition - destinationPosition) * (1 - value)}px)`;
      const useLinear = supportsLinearEasing();
      const visualKeyframes = useLinear
        ? [
            { transform: transformAt(visualValues[0]) },
            { transform: transformAt(visualValues[visualValues.length - 1]) },
          ]
        : visualValues.map((value) => ({ transform: transformAt(value) }));
      const token = ++motionTokenRef.current;
      const motion = {
        destination: targetDetent,
        raf: 0,
        raf2: 0,
        travelRaf: 0,
        animations: [],
      };
      motionRef.current = motion;
      programmaticRef.current = true;

      motion.raf = requestAnimationFrame(() => {
        motion.raf2 = requestAnimationFrame(() => {
          if (token !== motionTokenRef.current) return;
          if (contentMove || targetDetent !== 0) {
            // The old WAAPI pose was committed before cancellation. Replace it
            // in the same frame as the native scroll jump with the transform
            // relative to the new scroll base. This also holds the exact origin
            // throughout a configured delay without stranding the old pose.
            if (contentMove) wrapper.style.transform = transformAt(0);
            suppressAsyncScrollEvent(destinationOffset);
            scroll.scrollTo({
              left: axis === "x" ? destinationOffset : 0,
              top: axis === "y" ? destinationOffset : 0,
            });
          }

          const timing = {
            easing: useLinear ? `linear(${visualValues.join(",")})` : "linear",
            duration,
            delay: config.delay ?? 0,
          };
          const waitForAnimation = (
            target,
            keyframes,
            persistFinal = false,
            clearAfter = []
          ) =>
            new Promise((resolve) => {
              if (!target || keyframes.length === 0) {
                resolve();
                return;
              }
              const animation = target.animate(keyframes, timing);
              motion.animations.push({
                animation,
                target,
                properties: Object.keys(keyframes[0] || {}),
              });
              const finish = () => {
                if (persistFinal) {
                  const finalFrame = keyframes[keyframes.length - 1];
                  Object.entries(finalFrame).forEach(([property, value]) => {
                    const cssProperty = property.startsWith("--")
                      ? property
                      : `${property.startsWith("webkit") || property.startsWith("moz") ? "-" : ""}${property.replace(/[A-Z]/g, "-$&").toLowerCase()}`;
                    target.style.setProperty(cssProperty, value);
                  });
                }
                clearAfter.forEach((property) => target.style.removeProperty(property));
                animation.removeEventListener("finish", finish);
                resolve();
              };
              animation.addEventListener("finish", finish);
            });

          const visualPromise = contentMove
            ? waitForAnimation(
                wrapper,
                visualKeyframes,
                false,
                ["transform"]
              )
            : Promise.resolve();

          // Portal descendants register their travel maps in layout effects.
          // Read them after the double-rAF so a newly mounted Backdrop/Content
          // participates in the very first entrance instead of remaining at
          // its default (transparent/untransformed) style.
          const registeredAnimations = [
            ...getTravelAnimations().map((entry) => ({
              ...entry,
              progressValues: mappedValues,
            })),
            ...(stack?.getAnimationsBelow(stackId) || []).map((entry) => ({
              ...entry,
              progressValues: mappedValues.map(
                (value) => (entry.baseline || 0) + value
              ),
            })),
          ]
            .map((entry) => {
              const target = entry.ref?.current;
              const map = entry.getAnimation?.();
              if (!target || !map) return null;
              const values = entry.progressValues;
              const frameValues = useLinear
                ? [values[0], values[values.length - 1]]
                : values;
              return {
                target,
                keyframes: frameValues.map((progress) => travelStyles(map, progress)),
              };
            })
            .filter(Boolean);
          const registeredPromise = Promise.all(
            registeredAnimations.map((entry) =>
              waitForAnimation(entry.target, entry.keyframes, true)
            )
          );

          const travelPromise = new Promise((resolve) => {
            let startedAt = null;
            const tick = (now) => {
              if (token !== motionTokenRef.current) return;
              if (startedAt == null) startedAt = now;
              const elapsed = Math.floor(now - startedAt);
              if (elapsed < rawValues.length) {
                const progress = originProgress + progressDistance * rawValues[elapsed];
                reportTravel(progress, undefined, { waapi: true });
                motion.travelRaf = requestAnimationFrame(tick);
                return;
              }
              reportTravel(
                destinationProgress,
                { start: targetDetent, end: targetDetent },
                { waapi: true }
              );
              resolve();
            };
            tick(document.timeline.currentTime);
          });

          Promise.all([visualPromise, registeredPromise, travelPromise]).then(() => {
            if (token !== motionTokenRef.current) return;
            if (contentMove || targetDetent !== 0) {
              const reachableDestination = Math.min(
                Math.max(destinationOffset, 0),
                maxOf(scroll, axis)
              );
              if (Math.abs(offOf(scroll, axis) - reachableDestination) >= 0.5) {
                // A compositor snap can retain ownership briefly after a native
                // swipe. Reassert the requested detent at the programmatic
                // boundary while overflow is suspended, mirroring Silk's
                // stuck-snap correction instead of letting the old snap win.
                const previousOverflow = scroll.style.overflow;
                scroll.style.setProperty("overflow", "hidden");
                suppressAsyncScrollEvent(reachableDestination);
                setOff(scroll, axis, reachableDestination);
                window.setTimeout(() => {
                  if (previousOverflow) scroll.style.overflow = previousOverflow;
                  else scroll.style.removeProperty("overflow");
                }, CSS.supports("overscroll-behavior", "none") ? 1 : 10);
              }
            }
            motionRef.current = null;
            programmaticRef.current = false;
            lastVisualCoordinateRef.current = readVisualCoordinate();
            onComplete?.();
            onTravelEnd?.();
          });
        });
      });
    },
    [
      axis,
      cancelMotion,
      getTravelAnimations,
      measureGeometry,
      onTravelEnd,
      onTravelStart,
      onTravelStatusChange,
      placement,
      readVisualCoordinate,
      reportTravel,
      stack,
      stackId,
      suppressAsyncScrollEvent,
      targetOffset,
    ]
  );

  const endNativeTravel = useCallback(() => {
    clearTimeout(scrollEndTimerRef.current);
    cancelAnimationFrame(travelRafRef.current);
    travelRafRef.current = 0;
    if (!scrollSequenceRef.current) return false;
    scrollSequenceRef.current = false;
    onTravelEnd?.();
    return true;
  }, [onTravelEnd]);

  const flushPendingStep = useCallback((settledDetent) => {
    const action = pendingStepRef.current;
    pendingStepRef.current = null;
    if (!action) return;
    cancelAnimationFrame(pendingStepRafRef.current[0]);
    cancelAnimationFrame(pendingStepRafRef.current[1]);
    pendingStepRafRef.current[0] = requestAnimationFrame(() => {
      pendingStepRafRef.current[1] = requestAnimationFrame(() => {
        if (scrollSequenceRef.current) {
          pendingStepRef.current = action;
          return;
        }
        performAction(action, { presented: true, activeDetent: settledDetent });
      });
    });
  }, [performAction]);

  useIso(() => {
    const dispatch = (action) => {
      if (action.type === "step" && scrollSequenceRef.current) {
        // STEP is semantic rather than a precomputed detent so it is resolved
        // against the detent reached by native scroll-snap, after paint.
        pendingStepRef.current = action;
        return;
      }
      performAction(action);
    };
    actionDispatcherRef.current = dispatch;
    return () => {
      if (actionDispatcherRef.current === dispatch) actionDispatcherRef.current = null;
    };
  }, [actionDispatcherRef, performAction]);

  const updateLiveDetent = useCallback(
    (progress) => {
      const range = rangeForProgress(progress);
      if (range.start !== range.end || range.start <= 0) return;
      const next = range.start;
      if (liveDetentRef.current === next) return;
      liveDetentRef.current = next;
      queueMicrotask(() => {
        if (!activeRef.current) return;
        previousDetentRef.current = next;
        setActiveDetent(next);
      });
    },
    [rangeForProgress, setActiveDetent]
  );

  const disarmDismissObserver = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    observerWheelCleanupRef.current?.();
    observerWheelCleanupRef.current = null;
  }, []);

  const armDismissObserver = useCallback(() => {
    disarmDismissObserver();
    const view = viewRef.current;
    const scroll = scrollRef.current;
    const content = scroll?.querySelector('[data-velvet="content"]');
    if (
      !view ||
      !scroll ||
      !content ||
      !activeRef.current ||
      !nativeScrollEnabled ||
      !dismissible ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }
    wheelSeenRef.current = false;
    const markWheel = () => {
      wheelSeenRef.current = true;
    };
    window.addEventListener("wheel", markWheel, { passive: true, once: true });
    observerWheelCleanupRef.current = () =>
      window.removeEventListener("wheel", markWheel, { passive: true });

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || nativeDismissRef.current || programmaticRef.current) continue;
          nativeDismissRef.current = true;
          view.style.setProperty("pointer-events", "none", "important");
          view.style.setProperty("opacity", "0", "important");
          view.style.setProperty("position", "fixed", "important");
          view.style.setProperty("top", "-100px", "important");
          view.style.setProperty("left", "-100px", "important");
          content.style.setProperty("pointer-events", "none", "important");
          scroll.style.setProperty("width", "1px", "important");
          scroll.style.setProperty("height", "1px", "important");
          scroll.style.setProperty("clip-path", "inset(0)", "important");

          const dismiss = () => {
            scroll.style.setProperty("scroll-snap-type", "none", "important");
            pendingStepRef.current = null;
            endNativeTravel();
            activeRef.current = false;
            setActiveDetent(0);
            setPresented(false);
          };
          requestAnimationFrame(() => {
            if (!wheelSeenRef.current) {
              dismiss();
              return;
            }
            let previousDelta = 100000;
            const suppressWheelTail = (event) => {
              const nextDelta = Math.abs(event.deltaY);
              if (previousDelta < nextDelta) {
                window.removeEventListener("wheel", suppressWheelTail, { passive: false });
              } else {
                event.preventDefault();
              }
              previousDelta = nextDelta;
            };
            window.addEventListener("wheel", suppressWheelTail, { passive: false });
            window.setTimeout(() => {
              window.removeEventListener("wheel", suppressWheelTail, { passive: false });
              dismiss();
            }, 100);
          });
        }
      },
      { root: view, threshold: [0] }
    );
    observerRef.current.observe(content);
  }, [
    disarmDismissObserver,
    dismissible,
    endNativeTravel,
    nativeScrollEnabled,
    setActiveDetent,
    setPresented,
  ]);

  const sampleNativeTravel = useCallback(() => {
    if (!scrollSequenceRef.current) return;
    const progress = progressOf();
    reportTravel(progress);
    updateLiveDetent(progress);
    travelRafRef.current = requestAnimationFrame(sampleNativeTravel);
  }, [progressOf, reportTravel, updateLiveDetent]);

  const settleNativeTravel = useCallback(() => {
    clearTimeout(scrollEndTimerRef.current);
    if (!scrollSequenceRef.current || !activeRef.current) return;
    cancelAnimationFrame(travelRafRef.current);
    travelRafRef.current = 0;
    if (programmaticRef.current) {
      endNativeTravel();
      return;
    }
    const progress = progressOf();
    reportTravel(progress);
    const exact = geometryRef.current?.exactProgressAtDetents || [0, 1];
    const settledIndex = exact.findIndex(
      (detentProgress) =>
        progress > detentProgress - 0.01 && progress < detentProgress + 0.01
    );
    // MOVE_END always stops per-frame travel reporting. A nonexact quiet point
    // still owns the native scroll sequence; the next scroll restarts MOVE.
    if (settledIndex < 0) return;
    previousDetentRef.current = settledIndex;
    liveDetentRef.current = settledIndex;
    if (settledIndex > 0 && settledIndex !== activeDetent) {
      setActiveDetent(settledIndex);
    }
    if (settledIndex > 0) {
      lastVisualCoordinateRef.current = readVisualCoordinate();
      setRestingInside(true);
      onTravelStatusChange?.("idleInside");
    }
    endNativeTravel();
    if (settledIndex > 0) flushPendingStep(settledIndex);
    else pendingStepRef.current = null;
  }, [
    activeDetent,
    endNativeTravel,
    flushPendingStep,
    onTravelStatusChange,
    progressOf,
    readVisualCoordinate,
    reportTravel,
    setActiveDetent,
  ]);

  const onScroll = useCallback(() => {
    if (ignoreNextProgrammaticScrollRef.current) {
      ignoreNextProgrammaticScrollRef.current = false;
      if (scrollSequenceRef.current) {
        clearTimeout(scrollEndTimerRef.current);
        scrollEndTimerRef.current = window.setTimeout(settleNativeTravel, SCROLL_IDLE_MS);
      }
      return;
    }
    if (
      !activeRef.current ||
      programmaticRef.current ||
      !nativeScrollEnabled
    ) {
      return;
    }
    if (!scrollSequenceRef.current) {
      scrollSequenceRef.current = true;
      progressFilterRef.current = {
        previous: progressFilterRef.current.previous,
        delta: 0,
      };
      movedRef.current = true;
      onTravelStatusChange?.("stepping");
      onTravelStart?.();
    }
    cancelAnimationFrame(travelRafRef.current);
    travelRafRef.current = requestAnimationFrame(sampleNativeTravel);
    clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = window.setTimeout(settleNativeTravel, SCROLL_IDLE_MS);
  }, [nativeScrollEnabled, onTravelStart, onTravelStatusChange, sampleNativeTravel, settleNativeTravel]);

  const onTouchStart = useCallback(() => {
    touchOngoingRef.current = true;
  }, []);
  const onTouchEnd = useCallback(() => {
    touchOngoingRef.current = false;
    if (!swipeOvershootDisabled) return;
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        if (!activeRef.current || programmaticRef.current) return;
        const scroll = scrollRef.current;
        const geometry = geometryRef.current;
        if (!scroll || !geometry) return;
        const offset = offOf(scroll, axis);
        if (offset < 0) setOff(scroll, axis, 0);
        else if (offset > geometry.maxOffset) setOff(scroll, axis, geometry.maxOffset);
      });
    }, 80);
  }, [axis, swipeOvershootDisabled]);

  useIso(() => {
    // A live exact-segment update belongs to the current native sequence. Do
    // not remeasure/rearm the View merely because React exposed that detent;
    // external detent changes still differ from previousDetentRef and proceed.
    if (
      scrollSequenceRef.current &&
      presented &&
      activeDetent === previousDetentRef.current
    ) {
      return undefined;
    }
    const geometry = measureGeometry();
    const scroll = scrollRef.current;
    if (!geometry || !scroll) return undefined;
    disarmDismissObserver();
    const last = geometry.exactProgressAtDetents.length - 1;
    const target = presented
      ? Math.min(Math.max(activeDetent || 1, 1), last)
      : 0;
    let previous = previousDetentRef.current;
    const configurationChanged =
      configurationRef.current != null && configurationRef.current !== configurationKey;
    configurationRef.current = configurationKey;

    if (scrollSequenceRef.current && (!presented || target !== previous)) {
      pendingStepRef.current = null;
      endNativeTravel();
    }

    // Strict Mode replays this layout effect. Keep an already-owned transition
    // to the same detent alive; a real destination/configuration change still
    // cancels and replaces it below.
    if (
      !configurationChanged &&
      programmaticRef.current &&
      motionRef.current?.destination === target
    ) {
      return undefined;
    }
    activeRef.current = presented;
    if (presented && previous === 0 && !isPreview) {
      lastFocused.current = document.activeElement;
    }
    if (!presented && nativeDismissRef.current) {
      cancelMotion();
      nativeDismissRef.current = false;
      previousDetentRef.current = 0;
      if (!isPreview) restoreFocus(lastFocused.current);
      finishExit();
      onTravelStatusChange?.("idleOutside");
      return undefined;
    }
    if (!presented && previous === 0) return undefined;

    const enteringConfig = resolveSpringSettings(enteringAnimationSettings, SPRING_PRESETS.smooth);
    const exitingConfig = resolveSpringSettings(exitingAnimationSettings, DEFAULT_EXIT_SPRING);
    const steppingConfig = resolveSpringSettings(
      steppingAnimationSettings ?? enteringAnimationSettings,
      SPRING_PRESETS.smooth
    );
    const requestedTrack =
      target === 0
        ? trackFromSettings(exitingConfig)
        : previous === 0
          ? trackFromSettings(enteringConfig)
          : trackFromSettings(steppingConfig);
    const travelTrack = trackList.includes(requestedTrack) ? requestedTrack : primaryTrack;
    exitTrackRef.current = travelTrack;

    if (configurationChanged && presented && previous > 0 && target === previous) {
      cancelMotion();
      programmaticRef.current = true;
      const offset = targetOffset(target, travelTrack);
      suppressAsyncScrollEvent(offset);
      setOff(scroll, axis, offset);
      reportTravel(geometry.exactProgressAtDetents[target], { start: target, end: target });
      lastVisualCoordinateRef.current = readVisualCoordinate();
      programmaticRef.current = false;
      setRestingInside(true);
      armDismissObserver();
      return undefined;
    }

    if (presented && previous === target) {
      cancelMotion();
      armDismissObserver();
      return undefined;
    }

    if (presented && previous === 0) {
      onTravelStatusChange?.("entering");
      onTravelStart?.();
      programmaticRef.current = true;
      const offset = targetOffset(0, travelTrack);
      suppressAsyncScrollEvent(offset);
      setOff(scroll, axis, offset);
      reportTravel(0, { start: 0, end: 0 });
      programmaticRef.current = false;
    }
    previousDetentRef.current = target;

    if (typeof window !== "undefined" && window.__VELVET_DEBUG && presented) {
      cancelMotion();
      programmaticRef.current = true;
      const offset = targetOffset(target, travelTrack);
      suppressAsyncScrollEvent(offset);
      setOff(scroll, axis, offset);
      reportTravel(geometry.exactProgressAtDetents[target], { start: target, end: target });
      programmaticRef.current = false;
      armDismissObserver();
      return undefined;
    }

    runProgrammaticTravel({
      destination: target,
      track: travelTrack,
      travelStatus: target === 0 ? "exiting" : previous === 0 ? "entering" : "stepping",
      runStart: !(presented && previous === 0),
      settings:
        target === 0
          ? exitingConfig
          : previous === 0
            ? enteringConfig
            : steppingConfig,
      originCoordinateOverride: configurationChanged
        ? lastVisualCoordinateRef.current
        : undefined,
      onComplete: () => {
        if (target === 0) {
          if (!isPreview) restoreFocus(lastFocused.current);
          finishExit();
          onTravelStatusChange?.("idleOutside");
          return;
        }
        activeRef.current = true;
        setRestingInside(true);
        if (target !== activeDetent) setActiveDetent(target);
        if (previous === 0 && !isPreview) focusFirst(viewRef.current);
        armDismissObserver();
        onTravelStatusChange?.("idleInside");
      },
    });
    return undefined;
  }, [
    activeDetent,
    armDismissObserver,
    axis,
    cancelMotion,
    configurationKey,
    disarmDismissObserver,
    enteringAnimationSettings,
    exitingAnimationSettings,
    endNativeTravel,
    finishExit,
    isPreview,
    lastFocused,
    measureGeometry,
    onTravelStart,
    onTravelStatusChange,
    presented,
    primaryTrack,
    reportTravel,
    readVisualCoordinate,
    runProgrammaticTravel,
    setActiveDetent,
    steppingAnimationSettings,
    suppressAsyncScrollEvent,
    targetOffset,
    trackList,
  ]);

  useIso(() => {
    const view = viewRef.current;
    const scroll = scrollRef.current;
    const content = scroll?.querySelector('[data-velvet="content"]');
    if (!view || !content || typeof ResizeObserver === "undefined") return undefined;
    let firstView = true;
    let firstContent = true;
    const reposition = () => {
      const geometry = measureGeometry();
      if (
        !geometry ||
        !presented ||
        programmaticRef.current ||
        scrollSequenceRef.current ||
        touchOngoingRef.current
      ) {
        return;
      }
      const target = Math.min(
        Math.max(previousDetentRef.current || activeDetent || 1, 1),
        geometry.exactProgressAtDetents.length - 1
      );
      programmaticRef.current = true;
      const offset = targetOffset(target, primaryTrack);
      suppressAsyncScrollEvent(offset);
      setOff(scroll, axis, offset);
      programmaticRef.current = false;
      reportTravel(geometry.exactProgressAtDetents[target], { start: target, end: target });
    };
    const viewObserver = new ResizeObserver(() => {
      if (firstView) firstView = false;
      else reposition();
    });
    const contentObserver = new ResizeObserver(() => {
      if (firstContent) firstContent = false;
      else reposition();
    });
    viewObserver.observe(view, { box: "border-box" });
    contentObserver.observe(content, { box: "border-box" });
    return () => {
      viewObserver.disconnect();
      contentObserver.disconnect();
    };
  }, [activeDetent, axis, measureGeometry, presented, primaryTrack, reportTravel, suppressAsyncScrollEvent, targetOffset]);

  useEffect(
    () => () => {
      // Strict Mode's simulated cleanup runs while the view is still connected.
      // Defer the destructive cleanup and only run it for a real unmount.
      queueMicrotask(() => {
        if (viewRef.current?.isConnected) return;
        cancelMotion();
        disarmDismissObserver();
        clearTimeout(scrollEndTimerRef.current);
        cancelAnimationFrame(travelRafRef.current);
        cancelAnimationFrame(pendingStepRafRef.current[0]);
        cancelAnimationFrame(pendingStepRafRef.current[1]);
        pendingStepRef.current = null;
      });
    },
    [cancelMotion, disarmDismissObserver]
  );

  useEffect(() => {
    if (isPreview) return undefined;
    const api = {
      freeze: (progress) => {
        const scroll = scrollRef.current;
        const geometry = measureGeometry();
        if (!scroll || !geometry) return;
        cancelMotion();
        const clamped = clamp01(progress);
        const closed = targetOffset(0, primaryTrack);
        const open = targetOffset(geometry.exactProgressAtDetents.length - 1, primaryTrack);
        scroll.style.setProperty("scroll-snap-type", "none", "important");
        const offset = closed + (open - closed) * clamped;
        suppressAsyncScrollEvent(offset);
        setOff(scroll, axis, offset);
        reportTravel(clamped);
      },
      open: () => {
        const scroll = scrollRef.current;
        const geometry = measureGeometry();
        if (!scroll || !geometry) return;
        cancelMotion();
        const offset = targetOffset(
          geometry.exactProgressAtDetents.length - 1,
          primaryTrack
        );
        suppressAsyncScrollEvent(offset);
        setOff(scroll, axis, offset);
        reportTravel(1);
      },
      getProgress: rawProgressOf,
      idle: () => !programmaticRef.current && !scrollSequenceRef.current,
    };
    activeViews.push(api);
    return () => {
      const index = activeViews.indexOf(api);
      if (index >= 0) activeViews.splice(index, 1);
    };
  }, [axis, cancelMotion, isPreview, measureGeometry, primaryTrack, rawProgressOf, reportTravel, suppressAsyncScrollEvent, targetOffset]);

  // Body scroll lock for modal sheets (ref-counted across stacked sheets).
  useEffect(() => {
    if (!modal) return;
    lockScroll();
    return unlockScroll;
  }, [modal]);

  // Escape key.
  useEffect(() => {
    if (isPreview) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const behavior = { nativePreventDefault: true, dismiss: sheetRole !== "alertdialog" };
      if (typeof onEscapeKeyDown === "function")
        onEscapeKeyDown({ changeDefault: (b) => Object.assign(behavior, b), nativeEvent: e });
      else if (onEscapeKeyDown) Object.assign(behavior, onEscapeKeyDown);
      if (behavior.nativePreventDefault) e.preventDefault();
      if (behavior.dismiss) setPresented(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPreview, onEscapeKeyDown, sheetRole, setPresented]);

  // The hidden mandatory-snap scroller must never react to keyboard paging.
  // Silk suspends both overflow and snapping from keydown through keyup so
  // Arrow/Page/Home/End/Space cannot desynchronise the visual and detent state.
  useEffect(() => {
    if (isPreview) return undefined;
    const scrollKeys = new Set([
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "End",
      "Home",
      " ",
    ]);
    const onKeyDown = (event) => {
      if (!activeRef.current || !scrollKeys.has(event.key)) return;
      const scroll = scrollRef.current;
      scroll?.style.setProperty("overflow", "hidden");
      scroll?.style.setProperty("scroll-snap-type", "none");
    };
    const onKeyUp = (event) => {
      if (!scrollKeys.has(event.key)) return;
      const scroll = scrollRef.current;
      scroll?.style.removeProperty("overflow");
      scroll?.style.removeProperty("scroll-snap-type");
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      const scroll = scrollRef.current;
      scroll?.style.removeProperty("overflow");
      scroll?.style.removeProperty("scroll-snap-type");
    };
  }, [isPreview]);

  // Click outside: a click on the scroll container but not on the panel.
  const onScrollClick = useCallback(
    (e) => {
      // React events bubble through portals by component ancestry. A click in
      // a child sheet must not be interpreted as a backdrop click by the sheet
      // behind it; the parent's scroll container is absent from the native
      // composed path in that case.
      if (!e.nativeEvent.composedPath().includes(scrollRef.current)) return;
      if (movedRef.current) {
        movedRef.current = false;
        return;
      }
      const contentEl =
        scrollRef.current && scrollRef.current.querySelector('[data-velvet="content"]');
      const target = pointerDownTargetRef.current || e.target;
      if (contentEl && contentEl.contains(target)) return;
      const behavior = { dismiss: sheetRole !== "alertdialog", stopOverlayPropagation: true };
      if (typeof onClickOutside === "function")
        onClickOutside({ changeDefault: (b) => Object.assign(behavior, b), nativeEvent: e });
      else if (onClickOutside) Object.assign(behavior, onClickOutside);
      if (behavior.dismiss) setPresented(false);
    },
    [onClickOutside, sheetRole, setPresented]
  );
  const onScrollPointerDown = useCallback((event) => {
    pointerDownTargetRef.current = event.target;
    movedRef.current = false;
  }, []);

  const ariaProps = {
    role: sheetRole,
    "aria-modal": modal ? true : undefined,
    "aria-labelledby": hasTitle.current ? titleId : undefined,
    "aria-describedby": hasDescription.current ? descriptionId : undefined,
  };

  return (
    <Polymorph
      asChild={asChild}
      ref={composedView}
      data-velvet="view"
      data-velvet-preview={isPreview ? "" : undefined}
      data-velvet-track={actualTrack}
      data-velvet-placement={placement}
      data-velvet-tracks={trackList.join(" ")}
      data-velvet-modal={modal ? "true" : "false"}
      className={className}
      style={style}
      {...ariaProps}
      {...rest}
    >
      <ViewInner
        track={actualTrack}
        placement={placement}
        axis={axis}
        scrollRef={scrollRef}
        markerCount={detentList.length + 1}
        dualTracks={validDualTracks}
        nativeScrollEnabled={nativeScrollEnabled}
        swipeOvershootDisabled={swipeOvershootDisabled}
        swipeOutDisabledWithDetent={actualSwipeOutDisabledWithDetent}
        swipeTrap={swipeTrap}
        nativeEdgeSwipePrevention={nativeEdgeSwipePrevention}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPointerDown={onScrollPointerDown}
        onClick={onScrollClick}
      >
        {children}
      </ViewInner>
    </Polymorph>
  );
});

// Splits children into Backdrop (rendered behind, full-view) vs. the rest
// (rendered inside the content-area on the track).
const ViewInner = ({
  track,
  placement,
  axis,
  scrollRef,
  markerCount,
  dualTracks,
  nativeScrollEnabled,
  swipeOvershootDisabled,
  swipeOutDisabledWithDetent,
  swipeTrap,
  nativeEdgeSwipePrevention,
  onScroll,
  onTouchStart,
  onTouchEnd,
  onPointerDown,
  onClick,
  children,
}) => {
  const backdropHostRef = useRef(null);
  const [host, setHost] = useState(null);
  useIso(() => setHost(backdropHostRef.current), []);
  return (
    <BackdropHostCtx.Provider value={host}>
      <div ref={backdropHostRef} data-velvet="backdrop-host" />
      <div
        ref={scrollRef}
        data-velvet="scroll"
        data-velvet-axis={axis}
        data-velvet-track={track}
        data-velvet-placement={placement}
        data-velvet-dual={dualTracks ? "" : undefined}
        data-velvet-scroll-disabled={!nativeScrollEnabled ? "" : undefined}
        data-velvet-overshoot-disabled={swipeOvershootDisabled ? "" : undefined}
        data-velvet-swipe-trap={swipeTrap ? "" : undefined}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPointerDownCapture={onPointerDown}
        onClick={onClick}
      >
        <div data-velvet="front-spacer" data-velvet-track={track} />
        <div
          data-velvet="content-area"
          data-velvet-track={track}
          data-velvet-placement={placement}
          data-velvet-overshoot-disabled={swipeOvershootDisabled ? "" : undefined}
          data-velvet-swipe-out-disabled-with-detent={
            swipeOutDisabledWithDetent ? "" : undefined
          }
        >
          {children}
          {nativeEdgeSwipePrevention && <div data-velvet="native-edge-preventer" />}
        </div>
        <div data-velvet="back-spacer" data-velvet-track={track}>
          {Array.from({ length: markerCount }, (_, index) => (
            <div
              key={index}
              data-velvet="detent-marker"
              data-velvet-track={track}
              data-velvet-swipe-out-disabled-with-detent={
                swipeOutDisabledWithDetent ? "" : undefined
              }
            />
          ))}
        </div>
      </div>
    </BackdropHostCtx.Provider>
  );
};

const BackdropHostCtx = createContext(null);

// ---- Backdrop -------------------------------------------------------------
const DEFAULT_BACKDROP = { opacity: ({ progress }) => Math.min(progress * 0.45, 0.45) };

const Backdrop = forwardRef(function Backdrop(
  { className, style, asChild, swipeable = true, themeColorDimming, travelAnimation, ...rest },
  forwardedRef
) {
  const host = useContext(BackdropHostCtx);
  const ref = useRef(null);
  const composed = useComposedRefs(forwardedRef, ref);
  useTravel(ref, travelAnimation, DEFAULT_BACKDROP);

  if (!host) return null;
  return createPortal(
    <Polymorph
      asChild={asChild}
      ref={composed}
      data-velvet="backdrop"
      className={className}
      style={style}
      {...rest}
    />,
    host
  );
});

// ---- Content --------------------------------------------------------------
const Content = forwardRef(function Content(
  { className, style, asChild, travelAnimation, stackingAnimation, children, ...rest },
  forwardedRef
) {
  const ref = useRef(null);
  const composed = useComposedRefs(forwardedRef, ref);
  useTravel(ref, travelAnimation, null);
  useStacking(ref, stackingAnimation);
  return (
    <Polymorph
      asChild={asChild}
      ref={composed}
      data-velvet="content"
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Polymorph>
  );
});

// ---- BleedingBackground ---------------------------------------------------
const BleedingBackground = forwardRef(function BleedingBackground(
  { className, style, asChild, ...rest },
  forwardedRef
) {
  return (
    <Polymorph
      asChild={asChild}
      ref={forwardedRef}
      data-velvet="bleeding-background"
      className={className}
      style={style}
      {...rest}
    />
  );
});

// ---- Handle ---------------------------------------------------------------
const Handle = forwardRef(function Handle(
  { className, style, asChild, action = "step", ...rest },
  forwardedRef
) {
  const { requestAction } = useSheet();
  const activate = () => {
    if (action === "dismiss") {
      requestAction({ type: "dismiss" });
      return;
    }
    const isStep = action === "step" || (action && action.type === "step");
    if (!isStep) return;
    const spec = action === "step" ? {} : action;
    requestAction({ type: "step", detent: spec.detent, direction: spec.direction });
  };
  return (
    <Polymorph
      as="button"
      asChild={asChild}
      ref={forwardedRef}
      type="button"
      aria-label={action === "dismiss" ? "Dismiss" : "Step sheet"}
      data-velvet="handle"
      className={className}
      style={style}
      onClick={activate}
      {...rest}
    />
  );
});

// ---- Trigger --------------------------------------------------------------
const Trigger = forwardRef(function Trigger(
  { className, style, asChild, action = "present", children, onPress, ...rest },
  forwardedRef
) {
  const { requestAction, preview } = useSheet();
  const handle = (e) => {
    if (onPress) onPress(e);
    const isStep = action === "step" || (action && action.type === "step");
    if (action === "present") requestAction({ type: "present" });
    else if (action === "dismiss") requestAction({ type: "dismiss" });
    else if (isStep) {
      const spec = action === "step" ? {} : action;
      requestAction({ type: "step", detent: spec.detent, direction: spec.direction });
    } else requestAction({ type: "toggle" });
  };
  return (
    <Polymorph
      as="button"
      asChild={asChild}
      ref={forwardedRef}
      type="button"
      data-velvet-trigger=""
      data-velvet-preview-trigger={preview ? "" : undefined}
      className={className}
      style={style}
      onClick={handle}
      {...rest}
    >
      {children}
    </Polymorph>
  );
});

// ---- Title / Description --------------------------------------------------
const Title = forwardRef(function Title({ className, asChild, children, ...rest }, forwardedRef) {
  const { titleId, hasTitle } = useSheet();
  useIso(() => {
    hasTitle.current = true;
    return () => (hasTitle.current = false);
  }, [hasTitle]);
  return (
    <Polymorph as="h2" asChild={asChild} ref={forwardedRef} id={titleId} className={className} {...rest}>
      {children}
    </Polymorph>
  );
});

const Description = forwardRef(function Description(
  { className, asChild, children, ...rest },
  forwardedRef
) {
  const { descriptionId, hasDescription } = useSheet();
  useIso(() => {
    hasDescription.current = true;
    return () => (hasDescription.current = false);
  }, [hasDescription]);
  return (
    <Polymorph as="p" asChild={asChild} ref={forwardedRef} id={descriptionId} className={className} {...rest}>
      {children}
    </Polymorph>
  );
});

// ---- focus helpers --------------------------------------------------------
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
const focusFirst = (root) => {
  if (!root) return;
  const el = root.querySelector("[data-velvet-autofocus]") || root.querySelector(FOCUSABLE);
  if (el) el.focus({ preventScroll: true });
};
const restoreFocus = (el) => {
  if (el && typeof el.focus === "function") el.focus({ preventScroll: true });
};

// ---- Outlet: animate an element from this Sheet's travel and/or stacking progress ----
const Outlet = forwardRef(function Outlet(
  { className, style, asChild, travelAnimation, stackingAnimation, children, ...rest },
  forwardedRef
) {
  const ref = useRef(null);
  const composed = useComposedRefs(forwardedRef, ref);
  useTravel(ref, travelAnimation, null);
  useStacking(ref, stackingAnimation);
  return (
    <Polymorph asChild={asChild} ref={composed} data-velvet="outlet" className={className} style={style} {...rest}>
      {children}
    </Polymorph>
  );
});

export const Sheet = {
  PreviewEnvironment,
  Root,
  Portal,
  View,
  Backdrop,
  Content,
  BleedingBackground,
  Handle,
  Trigger,
  Title,
  Description,
  Outlet,
};
