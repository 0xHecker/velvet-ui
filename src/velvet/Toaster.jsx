import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { dismissToast, finalizeToast, subscribeToasts } from "./toast.js";
import { solveSpring } from "./core/spring.js";

const GLYPH = { success: "✓", error: "✕", info: "i", warning: "!" };
const DEFAULT_HOTKEY = ["altKey", "KeyT"];
const SWIPE_IGNORE = "input, textarea, select, [contenteditable]:not([contenteditable='false']), [data-velvet-toast-swipe-ignore]";
const GESTURE_SLOP = 5;
const SWIPE_DISTANCE = 70;
const SWIPE_VELOCITY = 0.45;
const VELOCITY_WINDOW = 120;
const VELOCITY_SAMPLE_DISTANCE = 4;
const toasterCounts = new WeakMap();
const warnedToasterDocuments = new WeakSet();

const cx = (...values) => values.filter(Boolean).join(" ");
const cssLength = (value) => typeof value === "number" ? `${value}px` : value;
const textFromNode = (node) => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).filter(Boolean).join(" ");
  if (node && typeof node === "object") {
    if (typeof node[Symbol.iterator] === "function") {
      try {
        return Array.from(node, textFromNode).filter(Boolean).join(" ");
      } catch {
        // A user iterator must not break rendering or the live region.
        return "";
      }
    }
    if (node.props) return textFromNode(node.props.children);
  }
  return "";
};
const announcementFor = (entry) =>
  entry.announcement || [textFromNode(entry.message), textFromNode(entry.description)].filter(Boolean).join(". ");

const resolveDirection = (value) => {
  if (value === "ltr" || value === "rtl") return value;
  if (typeof document === "undefined") return "ltr";
  return document.documentElement.dir === "rtl" ? "rtl" : "ltr";
};
const resolvePosition = (position, direction) => {
  if (position.endsWith("-start")) return position.replace("-start", direction === "rtl" ? "-right" : "-left");
  if (position.endsWith("-end")) return position.replace("-end", direction === "rtl" ? "-left" : "-right");
  return position;
};
const resolveSwipeDirection = (value, direction) => {
  if (value === "start") return direction === "rtl" ? "right" : "left";
  if (value === "end") return direction === "rtl" ? "left" : "right";
  return value;
};
const matchesHotkey = (event, hotkey) => {
  if (!Array.isArray(hotkey) || hotkey.length === 0) return false;
  return hotkey.every((key) => {
    if (key === "altKey" || key === "ctrlKey" || key === "metaKey" || key === "shiftKey") {
      return event[key];
    }
    return event.code === key || event.key.toLowerCase() === String(key).toLowerCase();
  });
};

const recordGestureSample = (state, point, now = performance.now()) => {
  state.samples.push({ point, time: now });
  while (state.samples.length > 1 && now - state.samples[0].time > VELOCITY_WINDOW) {
    state.samples.shift();
  }
  if (state.samples.length > 16) state.samples.splice(0, state.samples.length - 16);
};

// Measure the most recent meaningful motion instead of the last browser event.
// Pointer streams can end with repeated coordinates or one-pixel jitter; both
// should preserve the user's actual flick while a deliberate reversal should not.
const gestureVelocity = (samples) => {
  const latest = samples[samples.length - 1];
  if (!latest) return 0;
  for (let index = samples.length - 2; index >= 0; index--) {
    const sample = samples[index];
    const elapsed = latest.time - sample.time;
    const distance = latest.point - sample.point;
    if (elapsed > 0 && Math.abs(distance) >= VELOCITY_SAMPLE_DISTANCE) {
      return distance / elapsed;
    }
  }
  return 0;
};

// rAF-drive a value using the exact fixed-timestep spring shared with Sheet.
function springValue(from, to, settings, { v0 = 0, onValue, onDone } = {}) {
  const finish = () => { onValue?.(to); onDone?.(); };
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (from === to || reduce) { finish(); return { cancel() { } }; }
  const { values, duration } = solveSpring(settings, from, to, v0);
  if (duration === 0) { finish(); return { cancel() { } }; }
  const delta = to - from;
  const timeScale = (typeof window !== "undefined" && window.__VELVET_TIME_SCALE) || 1;
  let raf = 0;
  let cancelled = false;
  const startedAt = performance.now();
  const tick = (now) => {
    if (cancelled) return;
    const elapsed = (now - startedAt) / timeScale;
    if (elapsed >= duration) { finish(); return; }
    const index = Math.max(0, Math.min(values.length - 1, Math.floor(elapsed)));
    onValue?.(from + delta * values[index]);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return { cancel() { cancelled = true; cancelAnimationFrame(raf); } };
}

function ToastItem({
  entry,
  frontIndex,
  expandedOffset,
  layoutExpanded,
  paused,
  bottom,
  duration,
  directions,
  position,
  closeButton,
  icons,
  classNames,
  unstyled,
  measured,
  setHeight,
  removeHeight,
  onFocusDismissal,
}) {
  const ref = useRef(null);
  const gesture = useRef(null);
  const animation = useRef(null);
  const fallbackListeners = useRef(null);
  const suppressClick = useRef(false);
  const suppressClickTimer = useRef(null);
  const currentOffset = useRef(0);
  const remaining = useRef(0);
  const exitMode = useRef(null);
  const currentAxis = useRef(null);
  const lastLayout = useRef({ frontIndex, expandedOffset });
  const [mounted, setMounted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [swipingOut, setSwipingOut] = useState(false);

  const removing = entry.status === "removing";
  const ttl = entry.duration ?? duration;
  const sign = bottom ? 1 : -1;
  const dismissible = entry.dismissible !== false;
  const hasHorizontalDirection = directions.left || directions.right;
  const hasVerticalDirection = directions.up || directions.down;
  const defaultAxis = hasHorizontalDirection && !hasVerticalDirection
    ? "x"
    : hasVerticalDirection && !hasHorizontalDirection
      ? "y"
      : null;
  if (!gesture.current && currentOffset.current === 0) currentAxis.current = defaultAxis;
  const isAllowed = (offset, axis) =>
    axis === "x"
      ? (offset > 0 && directions.right) || (offset < 0 && directions.left)
      : (offset > 0 && directions.down) || (offset < 0 && directions.up);
  const resist = (offset) => (offset * 0.55) / (1 + Math.abs(offset) / 120);
  // A re-grab can begin while a resisted toast is returning. Convert the
  // painted value back into pointer space so resistance is not applied twice
  // on the first move (which would visibly jump the toast toward its origin).
  const unresist = (offset) => {
    const magnitude = Math.min(Math.abs(offset), 65.99);
    const raw = magnitude / Math.max(0.001, 0.55 - magnitude / 120);
    return Math.sign(offset) * raw;
  };

  if (!removing) lastLayout.current = { frontIndex, expandedOffset };
  const layout = removing ? lastLayout.current : { frontIndex, expandedOffset };

  const clearFallbackListeners = () => {
    fallbackListeners.current?.();
    fallbackListeners.current = null;
  };
  const paint = (offset, axis = currentAxis.current || defaultAxis) => {
    if (!axis) return;
    currentOffset.current = offset;
    const previousAxis = currentAxis.current;
    currentAxis.current = axis;
    const element = ref.current;
    if (!element) return;
    if (previousAxis && previousAxis !== axis) {
      element.style.removeProperty(previousAxis === "x" ? "--vt-dx" : "--vt-dy");
    }
    element.style.setProperty(axis === "x" ? "--vt-dx" : "--vt-dy", `${offset}px`);
    element.style.setProperty("--vt-op", String(Math.max(0, 1 - Math.abs(offset) / 300)));
  };
  const clearGestureStyles = () => {
    if (animation.current) { animation.current.cancel(); animation.current = null; }
    clearFallbackListeners();
    gesture.current = null;
    currentOffset.current = 0;
    currentAxis.current = defaultAxis;
    const element = ref.current;
    if (!element) return;
    element.style.transition = "";
    element.style.removeProperty("--vt-dx");
    element.style.removeProperty("--vt-dy");
    element.style.removeProperty("--vt-op");
    element.style.removeProperty("--vt-exit-y");
    element.style.removeProperty("--vt-exit-op");
  };

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => setHeight(entry.id, element.offsetHeight);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
        removeHeight(entry.id);
      };
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      removeHeight(entry.id);
    };
  }, [entry.id, removeHeight, setHeight]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => () => {
    clearTimeout(suppressClickTimer.current);
    clearGestureStyles();
  }, []);

  useEffect(() => {
    remaining.current = ttl;
  }, [entry.revision, ttl]);
  useEffect(() => {
    if (removing || ttl === Infinity || paused || dragging) return undefined;
    const startedAt = Date.now();
    const timer = setTimeout(() => dismissToast(entry.id, "timeout"), Math.max(0, remaining.current));
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
    };
  }, [dragging, entry.id, entry.revision, paused, removing, ttl]);

  const addFallbackListeners = () => {
    if (typeof window === "undefined" || fallbackListeners.current) return;
    const move = (event) => moveGesture(event);
    const up = (event) => releaseGesture(event);
    const cancel = (event) => cancelGesture(event);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    fallbackListeners.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  };

  const onPointerDown = (event) => {
    if (
      event.button !== 0 ||
      gesture.current ||
      (event.pointerType !== "mouse" && event.isPrimary === false) ||
      !dismissible ||
      removing ||
      (!hasHorizontalDirection && !hasVerticalDirection)
    ) return;
    if (event.target instanceof Element && event.target.closest(SWIPE_IGNORE)) return;
    const element = ref.current;
    if (!element) return;
    animation.current?.cancel();
    animation.current = null;
    exitMode.current = null;
    setSwipingOut(false);
    const axis = currentAxis.current || defaultAxis;
    const point = axis === "x" ? event.clientX : axis === "y" ? event.clientY : null;
    const now = performance.now();
    gesture.current = {
      pointerId: event.pointerId,
      axis,
      startX: event.clientX,
      startY: event.clientY,
      rawOrigin: axis && isAllowed(currentOffset.current, axis)
        ? currentOffset.current
        : unresist(currentOffset.current),
      point,
      offset: currentOffset.current,
      startedAt: now,
      activated: false,
      samples: point == null ? [] : [{ point, time: now }],
      lastNativeEvent: null,
    };
    element.style.transition = "none";
    // Always keep the window fallback active. Pointer capture can be reported
    // as acquired and still be lost when a portalled toast is re-grabbed
    // during its return spring; duplicate bubbled moves are idempotent.
    addFallbackListeners();
  };

  function updateGesture(event) {
    const state = gesture.current;
    if (!state || event.pointerId !== state.pointerId) return false;
    const nativeEvent = event.nativeEvent || event;
    if (state.lastNativeEvent === nativeEvent) return false;
    state.lastNativeEvent = nativeEvent;
    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    const distanceX = Math.abs(deltaX);
    const distanceY = Math.abs(deltaY);
    if (!state.activated) {
      if (Math.max(distanceX, distanceY) < GESTURE_SLOP) return false;
      const intendedAxis = state.axis || (distanceX >= distanceY ? "x" : "y");
      // Leave cross-axis movement to the browser. This is what keeps vertical
      // page scrolling natural when a touch begins on a corner toast.
      if (
        (intendedAxis === "x" && distanceY > distanceX) ||
        (intendedAxis === "y" && distanceX > distanceY)
      ) return false;
      state.axis = intendedAxis;
      state.point = state.axis === "x" ? state.startX : state.startY;
      state.samples = [{ point: state.point, time: state.startedAt }];
      currentAxis.current = state.axis;
      state.activated = true;
      setDragging(true);
      try {
        ref.current?.setPointerCapture(state.pointerId);
      } catch { }
    }
    const point = state.axis === "x" ? event.clientX : event.clientY;
    const raw = state.rawOrigin + point - state.point;
    const offset = isAllowed(raw, state.axis) ? raw : resist(raw);
    recordGestureSample(state, point);
    state.offset = offset;
    paint(offset, state.axis);
    if (event.cancelable) event.preventDefault();
    return true;
  }

  function moveGesture(event) {
    const state = gesture.current;
    if (!state || event.pointerId !== state.pointerId) return;
    // `buttons` is meaningful for a mouse, but browsers commonly report zero
    // for active touch and pen streams. A mouse move with no held button is a
    // missed pointerup, so settle it as a release instead of stranding it.
    if (event.pointerType === "mouse" && event.buttons === 0 && event.type === "pointermove") {
      releaseGesture(event);
      return;
    }
    updateGesture(event);
  }

  function releaseGesture(event) {
    const state = gesture.current;
    if (!state || event.pointerId !== state.pointerId) return;
    // Some devices coalesce the final move into pointerup. Include that final
    // coordinate before deciding on distance or velocity.
    updateGesture(event);
    if (state.activated) {
      suppressClick.current = true;
      clearTimeout(suppressClickTimer.current);
      // A compatibility click, when one is generated, follows pointerup before
      // the next timer task. Clear immediately afterward so the next real tap
      // is never swallowed.
      suppressClickTimer.current = setTimeout(() => {
        suppressClick.current = false;
        suppressClickTimer.current = null;
      }, 0);
    }
    gesture.current = null;
    clearFallbackListeners();
    setDragging(false);
    const element = ref.current;
    try {
      if (element?.hasPointerCapture(state.pointerId)) element.releasePointerCapture(state.pointerId);
    } catch { }

    if (!state.axis) {
      clearGestureStyles();
      return;
    }
    const offset = state.offset;
    const velocity = gestureVelocity(state.samples);
    const shouldDismiss =
      isAllowed(offset, state.axis) &&
      (Math.abs(offset) > SWIPE_DISTANCE ||
        (Math.sign(velocity) === Math.sign(offset) &&
          isAllowed(velocity, state.axis) &&
          Math.abs(velocity) > SWIPE_VELOCITY));
    if (shouldDismiss) {
      exitMode.current = "swipe";
      setSwipingOut(true);
      dismissToast(entry.id, "swipe");
      const span = (typeof window !== "undefined" && (state.axis === "x" ? window.innerWidth : window.innerHeight)) || 600;
      const target = Math.sign(offset || velocity || 1) * (span + 80);
      const velocityTowardTarget = Math.max(0, Math.sign(target - offset) * velocity);
      animation.current = springValue(offset, target, "snappy", {
        v0: velocityTowardTarget,
        onValue: (value) => paint(value, state.axis),
        onDone: () => {
          animation.current = null;
          finalizeToast(entry.id);
        },
      });
      return;
    }

    const velocityTowardRest = Math.max(0, Math.sign(-offset) * velocity);
    animation.current = springValue(offset, 0, "smooth", {
      v0: velocityTowardRest,
      onValue: (value) => paint(value, state.axis),
      onDone: () => {
        animation.current = null;
        clearGestureStyles();
      },
    });
  }

  function cancelGesture(event) {
    const state = gesture.current;
    if (!state || (event?.pointerId != null && event.pointerId !== state.pointerId)) return;
    gesture.current = null;
    clearFallbackListeners();
    setDragging(false);
    if (!state.axis) {
      clearGestureStyles();
      return;
    }
    const offset = state.offset;
    animation.current = springValue(offset, 0, "smooth", {
      onValue: (value) => paint(value, state.axis),
      onDone: () => {
        animation.current = null;
        clearGestureStyles();
      },
    });
  }

  function retainGestureAfterCaptureLoss(event) {
    const state = gesture.current;
    if (!state || event.pointerId !== state.pointerId) return;
    // The window listeners are the ownership fallback. Losing element capture
    // must not be interpreted as cancellation; pointercancel remains the
    // browser's explicit cancellation signal.
    addFallbackListeners();
  }

  useEffect(() => {
    if (!removing || exitMode.current === "swipe") return undefined;
    const element = ref.current;
    if (!element) return undefined;
    const activeGesture = gesture.current;
    gesture.current = null;
    clearFallbackListeners();
    setDragging(false);
    try {
      if (activeGesture && element.hasPointerCapture(activeGesture.pointerId)) {
        element.releasePointerCapture(activeGesture.pointerId);
      }
    } catch { }
    animation.current?.cancel();
    element.style.transition = "none";
    animation.current = springValue(0, sign * 56, "snappy", {
      onValue: (value) => {
        element.style.setProperty("--vt-exit-y", `${value}px`);
        element.style.setProperty("--vt-exit-op", String(Math.max(0, 1 - Math.abs(value) / 56)));
      },
      onDone: () => {
        animation.current = null;
        finalizeToast(entry.id);
      },
    });
    return () => animation.current?.cancel();
  }, [entry.id, removing, sign]);

  let baseY = 0;
  let scale = 1;
  let opacity = 1;
  if (layoutExpanded) baseY = -sign * layout.expandedOffset;
  else {
    baseY = -sign * layout.frontIndex * 14;
    scale = 1 - Math.min(layout.frontIndex, 3) * 0.05;
    if (layout.frontIndex >= 3) opacity = 0;
  }
  if (!mounted || !measured) {
    baseY += sign * 56;
    opacity = 0;
  }

  const state = removing ? "exiting" : dragging ? "dragging" : mounted && measured ? "open" : "entering";
  const showClose = (entry.closeButton ?? closeButton) && dismissible;
  const itemClassNames = classNames || {};
  const itemStyle = {
    ...entry.style,
    transform: `translate3d(var(--vt-dx, 0px), calc(${baseY}px + var(--vt-dy, 0px) + var(--vt-exit-y, 0px)), 0) scale(${scale})`,
    opacity: `calc(${opacity} * var(--vt-op, 1) * var(--vt-exit-op, 1))`,
    zIndex: 1000 - layout.frontIndex,
    cursor: dismissible ? undefined : "default",
    touchAction: dismissible
      ? hasHorizontalDirection && hasVerticalDirection
        ? "none"
        : hasHorizontalDirection
          ? "pan-y"
          : hasVerticalDirection
            ? "pan-x"
            : "auto"
      : "auto",
  };

  return (
    <li
      ref={ref}
      tabIndex={0}
      aria-atomic="true"
      aria-label={announcementFor(entry) || undefined}
      className={cx(
        "Toast",
        `Toast--${entry.type}`,
        entry.custom && "Toast--custom",
        itemClassNames.toast,
        entry.className
      )}
      data-slot="toast"
      data-toast-id={entry.id}
      data-state={state}
      data-type={entry.type}
      data-position={position}
      data-front={layout.frontIndex === 0 && !removing}
      data-exiting={removing || undefined}
      data-dragging={dragging || undefined}
      data-swipe-out={swipingOut || undefined}
      data-unstyled={unstyled || entry.custom || undefined}
      style={itemStyle}
      onPointerDown={onPointerDown}
      onPointerMove={moveGesture}
      onPointerUp={releaseGesture}
      onPointerCancel={cancelGesture}
      onLostPointerCapture={retainGestureAfterCaptureLoss}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        clearTimeout(suppressClickTimer.current);
        suppressClickTimer.current = null;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {entry.custom ? (
        typeof entry.message === "function" ? entry.message(entry.id) : entry.message
      ) : (
        <>
          <span className={cx("Toast-icon", itemClassNames.icon)} data-slot="icon" aria-hidden>
            {entry.icon || icons?.[entry.type] || (entry.type === "loading"
              ? (icons?.loading || <span className="Toast-spinner" data-slot="spinner" />)
              : GLYPH[entry.type] || "•")}
          </span>
          <div className={cx("Toast-body", itemClassNames.body)} data-slot="body">
            <div className={cx("Toast-title", itemClassNames.title)} data-slot="title">{entry.message}</div>
            {entry.description != null && (
              <div
                className={cx("Toast-desc", itemClassNames.description, entry.descriptionClassName)}
                data-slot="description"
              >
                {entry.description}
              </div>
            )}
          </div>
          {entry.action && (
            <button
              type="button"
              className={cx("Toast-act", itemClassNames.action)}
              data-slot="action"
              onClick={(event) => {
                const result = entry.action.onClick?.(event);
                if (result !== false) {
                  dismissToast(entry.id, "action");
                  if (event.detail === 0) onFocusDismissal?.();
                }
              }}
            >
              {entry.action.label}
            </button>
          )}
          {entry.cancel && (
            <button
              type="button"
              className={cx("Toast-cancel", itemClassNames.cancel)}
              data-slot="cancel"
              onClick={(event) => {
                entry.cancel.onClick?.(event);
                dismissToast(entry.id, "cancel");
                if (event.detail === 0) onFocusDismissal?.();
              }}
            >
              {entry.cancel.label}
            </button>
          )}
          {showClose && (
            <button
              type="button"
              className={cx("Toast-x", itemClassNames.closeButton)}
              data-slot="close-button"
              aria-label={entry.closeButtonAriaLabel || "Dismiss notification"}
              onClick={(event) => {
                dismissToast(entry.id, "close-button");
                if (event.detail === 0) onFocusDismissal?.();
              }}
            >
              {icons?.close || "✕"}
            </button>
          )}
        </>
      )}
    </li>
  );
}

export const Toaster = ({
  position = "bottom-right",
  duration = 4000,
  gap = 14,
  stack = true,
  expand = false,
  visibleToasts = 3,
  closeButton = true,
  richColors = false,
  swipeDirections,
  hotkey = DEFAULT_HOTKEY,
  pauseWhenPageIsHidden = true,
  dir = "auto",
  offset = 24,
  containerAriaLabel = "Notifications",
  icons,
  toastOptions = {},
  className,
  classNames = {},
  style,
  unstyled = false,
}) => {
  const [toasts, setToasts] = useState([]);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [direction, setDirection] = useState(() => resolveDirection(dir));
  const [politeAnnouncement, setPoliteAnnouncement] = useState({ sequence: 0, text: "" });
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState({ sequence: 0, text: "" });
  const [portalHost, setPortalHost] = useState(null);
  const heights = useRef(new Map());
  const mountedIds = useRef(new Set());
  const announced = useRef(new Map());
  const regionRef = useRef(null);
  const previousFocus = useRef(null);
  const restoringFocus = useRef(false);
  const [, rerenderLayout] = useState(0);

  useLayoutEffect(() => {
    setPortalHost(document.body);
  }, []);

  useEffect(() => subscribeToasts(setToasts), []);
  useEffect(() => {
    const ownerDocument = portalHost?.ownerDocument;
    if (!ownerDocument) return undefined;
    const nextCount = (toasterCounts.get(ownerDocument) || 0) + 1;
    toasterCounts.set(ownerDocument, nextCount);
    if (nextCount > 1 && !warnedToasterDocuments.has(ownerDocument)) {
      warnedToasterDocuments.add(ownerDocument);
      console.warn(
        "Velvet UI: multiple <Toaster> instances share one global toast store and will render duplicate notifications. Mount one <Toaster> per document."
      );
    }
    return () => {
      const count = (toasterCounts.get(ownerDocument) || 1) - 1;
      if (count > 0) toasterCounts.set(ownerDocument, count);
      else toasterCounts.delete(ownerDocument);
    };
  }, [portalHost]);
  useEffect(() => {
    setDirection(resolveDirection(dir));
    if (dir !== "auto" || typeof MutationObserver === "undefined") return undefined;
    const observer = new MutationObserver(() => setDirection(resolveDirection("auto")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, [dir]);
  useEffect(() => {
    if (!pauseWhenPageIsHidden) { setHidden(false); return undefined; }
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [pauseWhenPageIsHidden]);

  const resolvedPosition = resolvePosition(position, direction);
  const bottom = resolvedPosition.startsWith("bottom");
  const horizontalEdge = resolvedPosition.endsWith("left")
    ? "left"
    : resolvedPosition.endsWith("right")
      ? "right"
      : null;
  // The default reserves only the natural dismissal axis, so vertical page
  // scrolling remains available over corner toasts. Both directions on that
  // axis are accepted: users should not have to discover one invisible edge.
  const requestedDirections = swipeDirections ?? (horizontalEdge
    ? ["left", "right"]
    : ["top", "bottom"]);
  const directionFlagsFor = (values) => {
    const directionList = values.map((value) => resolveSwipeDirection(value, direction));
    return {
      up: directionList.includes("top"),
      down: directionList.includes("bottom"),
      left: directionList.includes("left"),
      right: directionList.includes("right"),
    };
  };

  const activeToasts = toasts.filter((entry) => entry.status === "active");
  const cap = visibleToasts === Infinity ? activeToasts.length : Math.max(0, Number(visibleToasts) || 0);
  const visibleActive = cap ? activeToasts.slice(-cap) : [];
  const visibleIds = new Set(visibleActive.map((entry) => entry.id));
  visibleIds.forEach((id) => mountedIds.current.add(id));
  const renderedToasts = toasts.filter(
    (entry) => visibleIds.has(entry.id) || (entry.status === "removing" && mountedIds.current.has(entry.id))
  );

  useEffect(() => {
    const liveIds = new Set(toasts.map((entry) => entry.id));
    const byId = new Map(toasts.map((entry) => [entry.id, entry]));
    mountedIds.current.forEach((id) => {
      const entry = byId.get(id);
      if (!liveIds.has(id) || (entry?.status === "active" && !visibleIds.has(id))) {
        mountedIds.current.delete(id);
      }
    });
    announced.current.forEach((_, id) => { if (!liveIds.has(id)) announced.current.delete(id); });
    // A queued toast has no visual node to animate, so finalize it immediately.
    toasts.forEach((entry) => {
      if (entry.status === "removing" && !mountedIds.current.has(entry.id)) finalizeToast(entry.id);
    });
  }, [toasts, visibleToasts]);

  useEffect(() => {
    const fresh = toasts.filter(
      (entry) => entry.status === "active" && announced.current.get(entry.id) !== entry.revision
    );
    if (!fresh.length) return;
    fresh.forEach((entry) => announced.current.set(entry.id, entry.revision));
    const polite = fresh.filter((entry) => entry.type !== "error" && !entry.important)
      .map(announcementFor).filter(Boolean).join(". ");
    const assertive = fresh.filter((entry) => entry.type === "error" || entry.important)
      .map(announcementFor).filter(Boolean).join(". ");
    if (polite) setPoliteAnnouncement((value) => ({ sequence: value.sequence + 1, text: polite }));
    if (assertive) setAssertiveAnnouncement((value) => ({ sequence: value.sequence + 1, text: assertive }));
  }, [toasts]);

  useEffect(() => {
    if (!hotkey || typeof window === "undefined") return undefined;
    const onKeyDown = (event) => {
      if (!matchesHotkey(event, hotkey) || !visibleActive.length) return;
      event.preventDefault();
      if (!regionRef.current?.contains(document.activeElement)) {
        previousFocus.current = document.activeElement;
      }
      const target = regionRef.current?.querySelector('[data-slot="toast"][data-front="true"]');
      target?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkey, visibleActive.length]);

  const setHeight = useCallback((id, height) => {
    if (heights.current.get(id) === height) return;
    heights.current.set(id, height);
    rerenderLayout((value) => value + 1);
  }, []);
  const removeHeight = useCallback((id) => {
    if (!heights.current.delete(id)) return;
    rerenderLayout((value) => value + 1);
  }, []);

  const layoutExpanded = expand || !stack || hovered || focused;
  const paused = hovered || focused || (pauseWhenPageIsHidden && hidden);
  const mergedToastClassNames = { ...classNames, ...(toastOptions.classNames || {}) };
  const rootStyle = {
    "--velvet-toast-offset": cssLength(offset || 0),
    "--velvet-toast-stack-gap": `${gap}px`,
    ...style,
  };

  const focusAfterDismissal = () => {
    restoringFocus.current = true;
    requestAnimationFrame(() => {
      const next = regionRef.current?.querySelector('[data-slot="toast"][data-front="true"]');
      if (next) next.focus({ preventScroll: true });
      else {
        if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus({ preventScroll: true });
        previousFocus.current = null;
      }
      restoringFocus.current = false;
    });
  };

  const contents = (
    <>
      <ol
        ref={regionRef}
        tabIndex={-1}
        aria-label={containerAriaLabel}
        className={cx("Toaster", `Toaster--${resolvedPosition}`, richColors && "Toaster--rich", classNames.toaster, className)}
        data-slot="toaster"
        data-position={resolvedPosition}
        data-expanded={layoutExpanded || undefined}
        data-unstyled={unstyled || undefined}
        data-visible-count={visibleActive.length}
        data-queue-count={Math.max(0, activeToasts.length - visibleActive.length)}
        dir={direction}
        style={rootStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocused(false);
            if (!restoringFocus.current) previousFocus.current = null;
          }
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          const toastNode = event.target instanceof Element ? event.target.closest('[data-slot="toast"]') : null;
          const requestedId = toastNode?.getAttribute("data-toast-id");
          const target = visibleActive.find((entry) => String(entry.id) === requestedId) || visibleActive[visibleActive.length - 1];
          if (!target || (target.dismissible ?? toastOptions.dismissible ?? true) === false) return;
          event.preventDefault();
          event.stopPropagation();
          dismissToast(target.id, "escape");
          focusAfterDismissal();
        }}
      >
        {renderedToasts.map((entry) => {
          const activeIndex = visibleActive.findIndex((candidate) => candidate.id === entry.id);
          let expandedOffset = 0;
          if (activeIndex >= 0) {
            for (let index = activeIndex + 1; index < visibleActive.length; index++) {
              expandedOffset += (heights.current.get(visibleActive[index].id) || 0) + gap;
            }
          }
          const perToastClassNames = {
            ...mergedToastClassNames,
            ...(entry.classNames || {}),
          };
          const item = {
            ...toastOptions,
            ...entry,
            style: { ...(toastOptions.style || {}), ...(entry.style || {}) },
            className: cx(toastOptions.className, entry.className),
            descriptionClassName: cx(toastOptions.descriptionClassName, entry.descriptionClassName),
          };
          return (
            <ToastItem
              key={entry.id}
              entry={item}
              frontIndex={activeIndex >= 0 ? visibleActive.length - 1 - activeIndex : 0}
              expandedOffset={expandedOffset}
              layoutExpanded={layoutExpanded}
              paused={paused}
              bottom={bottom}
              duration={toastOptions.duration ?? duration}
              directions={directionFlagsFor(item.swipeDirections ?? requestedDirections)}
              position={resolvedPosition}
              closeButton={toastOptions.closeButton ?? closeButton}
              icons={icons}
              classNames={perToastClassNames}
              unstyled={entry.unstyled ?? toastOptions.unstyled ?? unstyled}
              measured={heights.current.has(entry.id)}
              setHeight={setHeight}
              removeHeight={removeHeight}
              onFocusDismissal={focusAfterDismissal}
            />
          );
        })}
      </ol>
      <div
        className={cx("Toast-liveRegion", classNames.liveRegion)}
        data-slot="live-region"
        data-live="polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span key={politeAnnouncement.sequence}>{politeAnnouncement.text}</span>
      </div>
      <div
        className={cx("Toast-liveRegion", classNames.liveRegion)}
        data-slot="live-region"
        data-live="assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <span key={assertiveAnnouncement.sequence}>{assertiveAnnouncement.text}</span>
      </div>
    </>
  );
  return portalHost ? createPortal(contents, portalHost) : null;
};
