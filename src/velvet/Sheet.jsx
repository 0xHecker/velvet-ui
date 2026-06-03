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
import { springScroll } from "./core/spring.js";
import { applyTravel } from "./core/travel.js";
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
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const maxOf = (el, axis) =>
  axis === "y" ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
const offOf = (el, axis) => (axis === "y" ? el.scrollTop : el.scrollLeft);
const clientOf = (el, axis) => (axis === "y" ? el.clientHeight : el.clientWidth);
const setOff = (el, axis, v) => {
  if (axis === "y") el.scrollTop = v;
  else el.scrollLeft = v;
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
const useSheet = () => {
  const ctx = useContext(SheetCtx);
  if (!ctx) throw new Error("Velvet Sheet sub-components must be used within <Sheet.Root>");
  return ctx;
};

// Subscribe an element to the Sheet's travel progress. Layout effect so it
// registers before the present effect emits the initial (closed) progress.
const useTravel = (ref, travelAnimation, fallback) => {
  const { subscribeTravel } = useSheet();
  const animRef = useRef(travelAnimation);
  animRef.current = travelAnimation;
  useIso(
    () =>
      subscribeTravel(({ progress }) => {
        const el = ref.current;
        const map = animRef.current || fallback;
        if (el && map) applyTravel(el, map, progress);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subscribeTravel]
  );
};

// Subscribe an element to the Sheet's stacking progress (driven by the sheet
// directly above it within a SheetStack).
const useStacking = (ref, stackingAnimation) => {
  const { subscribeStacking } = useSheet();
  const animRef = useRef(stackingAnimation);
  animRef.current = stackingAnimation;
  useIso(
    () =>
      subscribeStacking((progress) => {
        const el = ref.current;
        if (el && animRef.current) applyTravel(el, animRef.current, progress);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subscribeStacking]
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
  const [presented, setPresented] = useControllable(
    presentedProp,
    defaultPresented,
    onPresentedChange
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
  const emitTravel = useCallback((payload) => {
    travelListeners.current.forEach((fn) => fn(payload));
  }, []);
  const subscribeTravel = useCallback((fn) => {
    travelListeners.current.add(fn);
    return () => travelListeners.current.delete(fn);
  }, []);

  const stackingListeners = useRef(new Set());
  const emitStacking = useCallback((progress) => {
    stackingListeners.current.forEach((fn) => fn(progress));
  }, []);
  const subscribeStacking = useCallback((fn) => {
    stackingListeners.current.add(fn);
    return () => stackingListeners.current.delete(fn);
  }, []);

  const titleId = useId();
  const descriptionId = useId();
  const hasTitle = useRef(false);
  const hasDescription = useRef(false);
  const detentCount = useRef(1);
  const lastFocused = useRef(null);

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
      emitTravel,
      subscribeStacking,
      emitStacking,
      titleId,
      descriptionId,
      hasTitle,
      hasDescription,
      detentCount,
      lastFocused,
    }),
    [
      presented,
      setPresented,
      activeDetent,
      setActiveDetent,
      mounted,
      sheetRole,
      subscribeTravel,
      emitTravel,
      titleId,
      descriptionId,
      defaultActiveDetent,
      defaultPresented,
    ]
  );

  return <SheetCtx.Provider value={ctx}>{children}</SheetCtx.Provider>;
};

// ---- Portal ---------------------------------------------------------------
const Portal = ({ children, container }) => {
  const { mounted } = useSheet();
  if (!mounted) return null;
  return createPortal(children, container || document.body);
};

// ---- View -----------------------------------------------------------------
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
    inertOutside = true,
    enteringAnimationSettings = "smooth",
    exitingAnimationSettings = "smooth",
    onTravel,
    onTravelStart,
    onTravelEnd,
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
    finishExit,
    titleId,
    descriptionId,
    hasTitle,
    hasDescription,
    lastFocused,
  } = sheet;

  const track = tracks || contentPlacement || "bottom";
  const { axis, openAtMax } = TRACK[track] || TRACK.bottom;

  const viewRef = useRef(null);
  const scrollRef = useRef(null);
  const composedView = useComposedRefs(forwardedRef, viewRef);

  const springCtrlRef = useRef(null);
  const animatingRef = useRef(false); // programmatic scroll in progress
  const activeRef = useRef(false); // sheet present & interactive
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const dragStartRef = useRef(null);
  const scrollEndTimer = useRef(0);
  const pointerDownTargetRef = useRef(null);
  const fastExitRef = useRef(false); // a gesture (drag/scroll) dismiss → close fast, like the scroll fling

  const stack = useSheetStack();
  const stackId = useId();
  const stackHandleRef = useRef(null);

  const reportTravel = useCallback(
    (progress) => {
      const payload = { progress, range: { start: 0, end: 1 }, progressAtDetents: [0, 1] };
      emitTravel(payload);
      if (stackHandleRef.current) stackHandleRef.current.update(progress);
      onTravel && onTravel(payload);
    },
    [emitTravel, onTravel]
  );

  // Register with an enclosing SheetStack (if any) for the View's whole mounted
  // lifetime, so sheets below animate as this one travels in and back out.
  useEffect(() => {
    if (!stack) return;
    const handle = stack.register(stackId);
    stackHandleRef.current = handle;
    const unsub = stack.subscribeAbove(stackId, emitStacking);
    return () => {
      unsub();
      handle.unregister();
      stackHandleRef.current = null;
    };
  }, [stack, stackId, emitStacking]);

  // Travel distance = closed→open. For a panel taller than the viewport (a "long"
  // sheet) "open" rests at one viewport of scroll and the content scrolls beyond it;
  // a short panel travels its own height (resting against the track edge).
  const isLongRef = useRef(false);
  const travelOf = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    const max = maxOf(el, axis);
    return openAtMax ? Math.min(max, clientOf(el, axis)) : max;
  }, [axis, openAtMax]);

  const progressOf = useCallback(() => {
    const t = travelOf();
    if (t <= 0) return 0;
    const raw = offOf(scrollRef.current, axis) / t;
    return clamp01(openAtMax ? raw : 1 - raw);
  }, [axis, openAtMax, travelOf]);

  const closedOff = useCallback(() => (openAtMax ? 0 : travelOf()), [openAtMax, travelOf]);
  const openOff = useCallback(() => (openAtMax ? travelOf() : 0), [openAtMax, travelOf]);

  // ---- Detents: intermediate rest stops between closed (index 0) and open (n) ----
  const detentList = useMemo(
    () => (detents == null ? [] : Array.isArray(detents) ? detents : [detents]),
    [detents]
  );
  const hasDetents = detentList.length > 0;
  const detentProgressRef = useRef([0, 1]);
  const prevDetentRef = useRef(0);

  // Resolve detent CSS lengths (e.g. "60lvh") into ascending progress stops.
  const computeDetents = useCallback(() => {
    const el = scrollRef.current;
    const max = maxOf(el, axis);
    const stops = [0, 1];
    if (max > 0) {
      for (const len of detentList) {
        const probe = document.createElement("div");
        probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;";
        probe.style[axis === "y" ? "height" : "width"] = len;
        el.appendChild(probe);
        stops.push(clamp01((axis === "y" ? probe.offsetHeight : probe.offsetWidth) / max));
        el.removeChild(probe);
      }
    }
    stops.sort((a, b) => a - b);
    detentProgressRef.current = stops;
    sheet.detentCount.current = stops.length - 1;
    return stops;
  }, [axis, detentList, sheet]);

  const offsetForProgress = useCallback(
    (p) => {
      const t = travelOf();
      return openAtMax ? p * t : (1 - p) * t;
    },
    [openAtMax, travelOf]
  );

  // On release, position relative to the active detent decides. Dragged/scrolled
  // UP snaps to a higher detent (open). DOWN instantly dismisses a dismissable
  // sheet — no snapping — or collapses a non-dismissable one to the next lower
  // detent. Barely moved → settle back on the active detent.
  const snapToDetent = useCallback(() => {
    const el = scrollRef.current;
    if (offOf(el, axis) > travelOf() + 1) return; // content region above "open": keep scroll
    const stops = detentProgressRef.current;
    const p = progressOf();
    const active = Math.min(Math.max(activeDetent || 1, 1), stops.length - 1);
    let idx = active;
    if (p > stops[active] + 0.04) {
      for (let i = active + 1; i < stops.length; i++)
        if (Math.abs(stops[i] - p) < Math.abs(stops[idx] - p)) idx = i; // open: nearest higher detent
    } else if (p < stops[active] - 0.04) {
      if (swipeDismissal !== false) {
        fastExitRef.current = true;
        activeRef.current = false;
        setPresented(false); // dismissable: close instantly, no snapping
        return;
      }
      idx = Math.max(1, active - 1); // non-dismissable: collapse one detent
    }
    if (idx !== activeDetent) {
      setActiveDetent(idx); // the present/step effect springs to it
      return;
    }
    animatingRef.current = true; // settle on the active detent
    springCtrlRef.current = springScroll(el, axis, offsetForProgress(stops[idx]), "snappy", {
      onUpdate: () => reportTravel(progressOf()),
      onComplete: () => (animatingRef.current = false),
    });
  }, [axis, activeDetent, offsetForProgress, progressOf, reportTravel, setActiveDetent, setPresented, swipeDismissal, travelOf]);

  // ---- Present / step / dismiss: spring to the target detent. Target = the
  // active detent while presented (>= 1), or 0 (closed) while dismissed. ----
  useIso(() => {
    const el = scrollRef.current;
    if (!el) return;
    const stops = computeDetents();
    isLongRef.current = openAtMax && maxOf(el, axis) > clientOf(el, axis) + 1;
    // Detents snap in JS (native snap off). A long sheet keeps native mandatory
    // snap but realigns "open" to the content's start; its tall content (snap
    // area > viewport) then scrolls freely above openß.
    if (hasDetents) el.setAttribute("data-velvet-freescroll", "");
    else el.removeAttribute("data-velvet-freescroll");
    if (isLongRef.current) el.setAttribute("data-velvet-long", "");
    else el.removeAttribute("data-velvet-long");
    const n = stops.length - 1;
    const target = presented ? Math.min(Math.max(activeDetent || 1, 1), n) : 0;
    const prev = prevDetentRef.current;
    prevDetentRef.current = target;
    const offset = offsetForProgress(stops[target]);

    if (presented && prev === 0) lastFocused.current = document.activeElement;
    activeRef.current = presented;

    if (typeof window !== "undefined" && window.__VELVET_DEBUG && presented) {
      animatingRef.current = true;
      el.style.scrollSnapType = "none";
      setOff(el, axis, offset);
      reportTravel(progressOf());
      return;
    }

    animatingRef.current = true; // guard onScroll's dismiss while we position + spring
    if (presented && prev === 0) {
      setOff(el, axis, offsetForProgress(stops[0])); // start fully closed before entering
      reportTravel(progressOf());
    }
    const settings =
      target === 0
        ? fastExitRef.current
          ? "brisk" // gesture dismiss → close fast, like the native scroll fling
          : exitingAnimationSettings
        : prev === 0
          ? enteringAnimationSettings
          : "snappy";
    fastExitRef.current = false;
    springCtrlRef.current = springScroll(el, axis, offset, settings, {
      onUpdate: () => reportTravel(progressOf()),
      onComplete: () => {
        animatingRef.current = false;
        if (target === 0) {
          restoreFocus(lastFocused.current);
          finishExit();
        } else if (prev === 0) {
          focusFirst(viewRef.current);
        }
      },
    });
    return () => springCtrlRef.current && springCtrlRef.current.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presented, activeDetent]);

  // ---- Native scroll travel: wheel / trackpad / touch drive the scroller
  // natively, and native CSS scroll-snap (mandatory + snap-align) flings the
  // panel to the nearest snap point — open or closed — using the browser's own
  // momentum/physics, exactly like. We never compute velocity or run a
  // competing spring; on scroll-end we only read where the snap landed and, for
  // a plain sheet snapped past the midpoint toward closed, dismiss. Detent/long
  // sheets turn native snap off and snap in JS. ----
  const onScrollEnd = useCallback(() => {
    if (!activeRef.current || animatingRef.current || draggingRef.current) return;
    clearTimeout(scrollEndTimer.current);
    if (hasDetents) snapToDetent();
    else if (swipeDismissal && progressOf() < 0.7) {
      activeRef.current = false;
      setPresented(false); // native snap landed at closed → dismiss
    }
  }, [hasDetents, snapToDetent, swipeDismissal, progressOf, setPresented]);

  const onScroll = useCallback(() => {
    if (animatingRef.current) return; // during a programmatic spring, onUpdate is the sole reporter
    const p = progressOf();
    reportTravel(p);
    if (draggingRef.current) return;
    // Decisive, wheel-like dismiss: the instant a native scroll (trackpad/wheel/
    // touch) carries a plain or long sheet past the midpoint toward closed,
    // commit — don't wait for inertial momentum to decay (that made trackpad
    // feel slow). Detents still resolve on scroll-end via snapToDetent.
    if (swipeDismissal) {
      // Dismiss zone: below 70% for a plain/long sheet, or just below the ACTIVE
      // detent for a detent sheet — so a swipe-down commits and flies off at once
      // instead of slowly free-scrolling and waiting for momentum to settle.
      const stops = detentProgressRef.current;
      let threshold = 0.7;
      if (hasDetents && stops.length > 1) {
        const a = Math.min(Math.max(activeDetent || 1, 1), stops.length - 1);
        threshold = stops[a] - 0.06;
      }
      if (p < threshold) {
        fastExitRef.current = true;
        activeRef.current = false;
        setPresented(false);
        return;
      }
    }
    clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(onScrollEnd, 90);
  }, [progressOf, reportTravel, hasDetents, swipeDismissal, setPresented, onScrollEnd, activeDetent]);

  // ---- Mouse / pen drag: write scrollTop directly (touch uses native scroll) ----
  useIso(() => {
    const el = scrollRef.current;
    if (!el) return;
    const clientAxis = (e) => (axis === "y" ? e.clientY : e.clientX);
    let samples = []; // {t, v:scrollOffset} for release velocity

    const onMove = (e) => {
      if (!draggingRef.current) return;
      const delta = clientAxis(e) - dragStartRef.current.pos;
      if (!movedRef.current) {
        if (Math.abs(delta) < 3) return; // tap tolerance — let clicks through
        movedRef.current = true;
        el.style.scrollSnapType = "none";
        el.style.touchAction = "none"; // a real drag now — take the gesture from the browser
        el.style.userSelect = "none"; // (text-selection drag would otherwise cancel the pointer)
        try { el.setPointerCapture(e.pointerId); } catch {}
        onTravelStart && onTravelStart();
      }
      if (e.cancelable) e.preventDefault();
      const max = maxOf(el, axis);
      const next = Math.max(0, Math.min(max, dragStartRef.current.scroll - delta));
      setOff(el, axis, next);
      samples.push({ t: performance.now(), v: next });
      if (samples.length > 6) samples.shift();
      reportTravel(progressOf());
    };

    // Shared teardown for pointerup AND pointercancel — pointercancel (fired
    // when the browser hijacks a gesture) must never leave the drag stranded.
    const endDrag = (cancelled) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      if (!draggingRef.current) return;
      draggingRef.current = false;
      el.style.touchAction = "";
      el.style.userSelect = "";
      clearTimeout(scrollEndTimer.current);
      if (!movedRef.current) return; // was a tap
      // Release velocity toward the closed edge (px/ms), shared by every sheet.
      let vel = 0;
      if (samples.length >= 2) {
        const a = samples[Math.max(0, samples.length - 4)];
        const b = samples[samples.length - 1];
        if (b.t > a.t) vel = (b.v - a.v) / (b.t - a.t);
      }
      const towardClosed = openAtMax ? -vel : vel; // +ve = heading toward closed
      if (hasDetents) {
        el.style.scrollSnapType = "";
        // A quick downward flick closes instantly, exactly like a long sheet:
        // dismiss a dismissable sheet, or collapse a non-dismissable one a detent.
        if (!cancelled && towardClosed > 0.3) {
          if (swipeDismissal !== false) {
            fastExitRef.current = true;
            activeRef.current = false;
            setPresented(false);
            return;
          }
          const stops = detentProgressRef.current;
          const active = Math.min(Math.max(activeDetent || 1, 1), stops.length - 1);
          if (active > 1) {
            setActiveDetent(active - 1);
            return;
          }
        }
        snapToDetent(); // else: open-snap, slow dismiss/collapse, or settle
        return;
      }
      // Plain sheet: close purely on flick speed; otherwise snap back to open.
      if (!cancelled && swipeDismissal && towardClosed > 0.3) {
        fastExitRef.current = true;
        activeRef.current = false;
        setPresented(false); // gesture dismiss — exit spring runs from here
        return;
      }
      animatingRef.current = true; // settle back to open, then restore the native-snap baseline
      springCtrlRef.current = springScroll(el, axis, openOff(), "snappy", {
        onUpdate: () => reportTravel(progressOf()),
        onComplete: () => {
          animatingRef.current = false;
          el.style.scrollSnapType = "";
        },
      });
    };
    function onUp() {
      endDrag(false);
    }
    function onCancel() {
      endDrag(true);
    }

    const onDown = (e) => {
      if (!swipe || e.button || !activeRef.current) return;
      // Modal sheets scroll natively on touch; only mouse/pen drag there. A
      // non-modal sheet's scroller is click-through (pointer-events:none), so
      // native touch scroll can't reach it — drive touch via the manual drag too.
      if (inertOutside && e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (springCtrlRef.current) springCtrlRef.current.cancel();
      animatingRef.current = false;
      dragStartRef.current = { pos: clientAxis(e), scroll: offOf(el, axis), p: progressOf() };
      movedRef.current = false;
      draggingRef.current = true;
      pointerDownTargetRef.current = e.target;
      samples = [{ t: performance.now(), v: offOf(el, axis) }];
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    };

    const onWheel = (e) => {
      // Non-modal scrollers are click-through, so native wheel never reaches them.
      // Drive the travel manually so the panel can be swiped (e.g. a mini-player).
      if (inertOutside || animatingRef.current) return;
      const max = maxOf(el, axis);
      const cur = offOf(el, axis);
      const next = Math.max(0, Math.min(max, cur + (axis === "y" ? e.deltaY : e.deltaX)));
      if (next !== cur) {
        e.preventDefault();
        setOff(el, axis, next); // fires onScroll → travel + snap/dismiss
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scrollend", onScrollEnd); // native, instant scroll-end decision
    return () => {
      draggingRef.current = false;
      movedRef.current = false;
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [axis, openAtMax, swipe, swipeDismissal, hasDetents, snapToDetent, openOff, travelOf, onScrollEnd, progressOf, reportTravel, setPresented, onTravelStart, inertOutside]);

  // Register a debug handle so tests can freeze travel at an exact progress.
  useEffect(() => {
    const api = {
      freeze: (p) => {
        const el = scrollRef.current;
        if (!el) return;
        if (springCtrlRef.current) springCtrlRef.current.cancel();
        animatingRef.current = true;
        el.style.scrollSnapType = "none";
        const cp = clamp01(p);
        setOff(el, axis, offsetForProgress(cp));
        reportTravel(cp);
      },
      open: () => {
        const el = scrollRef.current;
        if (!el) return;
        if (springCtrlRef.current) springCtrlRef.current.cancel();
        el.style.scrollSnapType = "none";
        setOff(el, axis, openOff());
        reportTravel(1);
      },
      getProgress: () => progressOf(),
      idle: () => !animatingRef.current && !draggingRef.current,
    };
    activeViews.push(api);
    return () => {
      const i = activeViews.indexOf(api);
      if (i >= 0) activeViews.splice(i, 1);
    };
  }, [axis, openAtMax, openOff, offsetForProgress, progressOf, reportTravel]);

  // Body scroll lock for modal sheets (ref-counted across stacked sheets).
  useEffect(() => {
    if (!inertOutside) return;
    lockScroll();
    return unlockScroll;
  }, [inertOutside]);

  // Escape key.
  useEffect(() => {
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
  }, [onEscapeKeyDown, sheetRole, setPresented]);

  // Click outside: a click on the scroll container but not on the panel.
  const onScrollClick = useCallback(
    (e) => {
      if (movedRef.current) return; // ended a drag, not a click
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

  const ariaProps = {
    role: sheetRole,
    "aria-modal": inertOutside ? true : undefined,
    "aria-labelledby": hasTitle.current ? titleId : undefined,
    "aria-describedby": hasDescription.current ? descriptionId : undefined,
  };

  return (
    <Polymorph
      asChild={asChild}
      ref={composedView}
      data-velvet="view"
      data-velvet-track={track}
      data-velvet-modal={inertOutside ? "true" : "false"}
      className={className}
      style={style}
      {...ariaProps}
      {...rest}
    >
      <ViewInner
        track={track}
        axis={axis}
        scrollRef={scrollRef}
        hasDetents={hasDetents}
        onScroll={onScroll}
        onClick={onScrollClick}
      >
        {children}
      </ViewInner>
    </Polymorph>
  );
});

// Splits children into Backdrop (rendered behind, full-view) vs. the rest
// (rendered inside the content-area on the track).
const ViewInner = ({ track, axis, scrollRef, hasDetents, onScroll, onClick, children }) => {
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
        onScroll={onScroll}
        onClick={onClick}
      >
        <div data-velvet="spacer" />
        <div data-velvet="content-area" data-velvet-track={track}>
          {children}
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
  { className, style, asChild, action = "dismiss", ...rest },
  forwardedRef
) {
  const { setPresented } = useSheet();
  return (
    <Polymorph
      as="button"
      asChild={asChild}
      ref={forwardedRef}
      type="button"
      aria-label="Dismiss"
      data-velvet="handle"
      className={className}
      style={style}
      onClick={() => action === "dismiss" && setPresented(false)}
      {...rest}
    />
  );
});

// ---- Trigger --------------------------------------------------------------
const Trigger = forwardRef(function Trigger(
  { className, style, asChild, action = "present", children, onPress, ...rest },
  forwardedRef
) {
  const { presented, setPresented, activeDetent, setActiveDetent, detentCount } = useSheet();
  const handle = (e) => {
    if (onPress) onPress(e);
    const isStep = action === "step" || (action && action.type === "step");
    if (action === "present") setPresented(true);
    else if (action === "dismiss") setPresented(false);
    else if (isStep) {
      const n = detentCount.current;
      const cur = activeDetent || 1;
      const spec = action === "step" ? {} : action;
      let idx;
      if (spec.detent != null) idx = spec.detent;
      else if (spec.direction === "down") idx = cur <= 1 ? n : cur - 1;
      else idx = cur >= n ? 1 : cur + 1;
      if (idx <= 0) setPresented(false);
      else {
        if (!presented) setPresented(true);
        setActiveDetent(idx);
      }
    } else setPresented((p) => !p);
  };
  return (
    <Polymorph
      as="button"
      asChild={asChild}
      ref={forwardedRef}
      type="button"
      data-velvet-trigger=""
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
