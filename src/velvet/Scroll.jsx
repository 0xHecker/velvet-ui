import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Polymorph } from "./core/Slot.jsx";
import { composeEventHandlers } from "./core/events.js";
import { useComposedRefs } from "./core/refs.js";
import { useSheetScrollHandoff } from "./core/scrollHandoff.js";
import { springScroll } from "./core/spring.js";

const maxOf = (el, axis) =>
  axis === "y" ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
const offOf = (el, axis) => (axis === "y" ? el.scrollTop : el.scrollLeft);
const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);
const isTextEntry = (element) => {
  if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) return false;
  if (element instanceof HTMLTextAreaElement || element.isContentEditable) return true;
  if (!(element instanceof HTMLInputElement)) return false;
  return !NON_TEXT_INPUT_TYPES.has(element.type);
};
const visualViewportBounds = () => {
  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  return {
    top,
    bottom: top + (viewport?.height ?? window.innerHeight),
  };
};
const layoutViewportBounds = () => ({ top: 0, bottom: window.innerHeight });
const FOCUS_VIEWPORT_GAP = 16;
const DEVELOPMENT =
  typeof process !== "undefined" && process.env?.NODE_ENV
    ? process.env.NODE_ENV !== "production"
    : import.meta.env?.DEV === true;
const ScrollCtx = createContext(null);
const useScroll = () => {
  const ctx = useContext(ScrollCtx);
  if (!ctx) throw new Error("Velvet Scroll sub-components must be used within <Scroll.Root>");
  return ctx;
};

// ---- Root: owns the shared scroll element ref + imperative API ----
const Root = forwardRef(function Root(
  { children, asChild, className, style, componentRef, ...rest },
  forwardedRef
) {
  const viewRef = useRef(null);
  const axisRef = useRef("y");
  const animRef = useRef(null);
  const subscribers = useRef(new Set());

  const getAvailableDistance = useCallback(() => {
    const el = viewRef.current;
    return el ? Math.max(0, maxOf(el, axisRef.current)) : 0;
  }, []);
  const getDistance = useCallback(() => {
    const el = viewRef.current;
    return el ? offOf(el, axisRef.current) : 0;
  }, []);
  const getProgress = useCallback(() => {
    const avail = getAvailableDistance();
    return avail > 0 ? getDistance() / avail : 0;
  }, [getAvailableDistance, getDistance]);

  const emitProgress = useCallback(() => {
    const payload = {
      progress: getProgress(),
      distance: getDistance(),
      availableDistance: getAvailableDistance(),
    };
    subscribers.current.forEach((fn) => fn(payload));
    return payload;
  }, [getProgress, getDistance, getAvailableDistance]);

  const travelTo = useCallback(
    (target, animationSettings) => {
      const el = viewRef.current;
      if (!el) return;
      const axis = axisRef.current;
      const clamped = Math.max(0, Math.min(maxOf(el, axis), target));
      if (animRef.current) animRef.current.cancel();
      animRef.current = springScroll(el, axis, clamped, animationSettings || "smooth", {
        onUpdate: emitProgress,
      });
    },
    [emitProgress]
  );

  const targetOf = useCallback(
    (opts, base) => {
      if (!opts) return base;
      if (opts.distance != null) return base + opts.distance;
      if (opts.progress != null) return base + opts.progress * getAvailableDistance();
      return base;
    },
    [getAvailableDistance]
  );

  const api = useMemo(
    () => ({
      getProgress,
      getDistance,
      getAvailableDistance,
      scrollTo: (opts) => travelTo(targetOf(opts, 0), opts && opts.animationSettings),
      scrollBy: (opts) => travelTo(targetOf(opts, getDistance()), opts && opts.animationSettings),
    }),
    [getProgress, getDistance, getAvailableDistance, travelTo, targetOf]
  );
  useImperativeHandle(componentRef, () => api, [api]);

  const ctx = useMemo(
    () => ({
      viewRef,
      axisRef,
      api,
      emitProgress,
      subscribe: (fn) => {
        subscribers.current.add(fn);
        return () => subscribers.current.delete(fn);
      },
    }),
    [api, emitProgress]
  );

  return (
    <ScrollCtx.Provider value={ctx}>
      <Polymorph asChild={asChild} ref={forwardedRef} data-velvet-scroll-root="" className={className} style={style} {...rest}>
        {children}
      </Polymorph>
    </ScrollCtx.Provider>
  );
});

// ---- View: the scroll container ----
const View = forwardRef(function View(
  {
    children,
    asChild,
    className,
    style,
    axis = "y",
    safeArea = "visual-viewport",
    scrollGestureTrap = false,
    scrollGestureOvershoot = true,
    onScrollProgress,
    onFocusInside,
    nativeFocusScrollPrevention = true,
    onFocusCapture,
    onBlurCapture,
    ...rest
  },
  forwardedRef
) {
  const { viewRef, axisRef, emitProgress, api } = useScroll();
  const sheetScrollHandoff = useSheetScrollHandoff();
  const composed = useComposedRefs(forwardedRef, viewRef);
  const startSpacerRef = useRef(null);
  const endSpacerRef = useRef(null);
  const focusTimerRef = useRef(0);
  const focusScrollFrameRef = useRef(0);
  const focusWantsScrollRef = useRef(false);
  const focusOriginRef = useRef(null);
  const focusViewportBottomRef = useRef(null);
  const focusRestorePendingRef = useRef(false);
  axisRef.current = axis;

  const onScroll = useCallback(() => {
    const payload = emitProgress();
    sheetScrollHandoff?.(payload);
    onScrollProgress && onScrollProgress({ ...payload, ...api });
  }, [emitProgress, onScrollProgress, api, sheetScrollHandoff]);

  // Trapping a gesture at the edge keeps it inside this Scroll.View instead
  // of handing it to an ancestor Sheet, scroller, or the page.
  const requestedTrap =
    scrollGestureTrap && typeof scrollGestureTrap === "object"
      ? scrollGestureTrap
      : { x: scrollGestureTrap === true, y: scrollGestureTrap === true };
  const trapX = !scrollGestureOvershoot || requestedTrap.x === true;
  const trapY = !scrollGestureOvershoot || requestedTrap.y === true;
  const trappedAxes = [trapX ? "x" : null, trapY ? "y" : null]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!DEVELOPMENT || typeof window === "undefined") return undefined;

    const frame = requestAnimationFrame(() => {
      const view = viewRef.current;
      const sheetView = view?.closest('[data-velvet="view"]');
      const sheetContent = view?.closest('[data-velvet="content"]');
      if (!view || !sheetView || !sheetContent) return;

      const placement = sheetView.getAttribute("data-velvet-placement");
      const track = sheetView.getAttribute("data-velvet-track");
      const horizontalSheet =
        placement === "left" ||
        placement === "right" ||
        track === "left" ||
        track === "right" ||
        track === "horizontal";
      if (!horizontalSheet) return;

      const computed = getComputedStyle(view);
      const crossAxisBehavior =
        axis === "y"
          ? computed.overscrollBehaviorX
          : computed.overscrollBehaviorY;
      if (crossAxisBehavior !== "contain" && crossAxisBehavior !== "none") {
        return;
      }

      const viewRect = view.getBoundingClientRect();
      const contentRect = sheetContent.getBoundingClientRect();
      const pageSized =
        viewRect.width >= contentRect.width * 0.8 &&
        viewRect.height >= contentRect.height * 0.5;
      if (!pageSized) return;

      console.warn(
        "[Velvet UI] This page-sized Scroll.View traps gesture handoff inside a horizontal Sheet. " +
          "Remove scrollGestureTrap (and keep scrollGestureOvershoot at its default true) to preserve swipe-back. " +
          "Use trapping only on an isolated nested scroller that must contain overscroll."
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [axis, trapX, trapY, viewRef]);

  const updateSafeArea = useCallback(() => {
    const view = viewRef.current;
    const startSpacer = startSpacerRef.current;
    const endSpacer = endSpacerRef.current;
    if (!view || !startSpacer || !endSpacer || axis !== "y" || safeArea === "none") {
      if (startSpacer) startSpacer.style.height = "0px";
      if (endSpacer) endSpacer.style.height = "0px";
      return;
    }
    const viewRect = view.getBoundingClientRect();
    const sheetView = view.closest('[data-velvet="view"]');
    const sheetRect = sheetView?.getBoundingClientRect();
    const placement = sheetView?.getAttribute("data-velvet-placement");
    // A Sheet's live scroll track starts with its content outside the layout
    // viewport. Safe-area geometry must describe the content at its resting
    // detent, otherwise the off-screen entrance distance gets mistaken for a
    // keyboard inset and changes the panel size during its own animation.
    let scrollPortTop = viewRect.top;
    let scrollPortBottom = viewRect.bottom;
    if (sheetRect && placement === "bottom") {
      scrollPortBottom = sheetRect.bottom;
      scrollPortTop = scrollPortBottom - viewRect.height;
    } else if (sheetRect && placement === "top") {
      scrollPortTop = sheetRect.top;
      scrollPortBottom = scrollPortTop + viewRect.height;
    } else if (sheetRect && placement === "center") {
      scrollPortTop = sheetRect.top + (sheetRect.height - viewRect.height) / 2;
      scrollPortBottom = scrollPortTop + viewRect.height;
    }
    const bounds =
      safeArea === "layout-viewport" ? layoutViewportBounds() : visualViewportBounds();
    startSpacer.style.height = `${Math.max(0, bounds.top - scrollPortTop)}px`;
    endSpacer.style.height = `${Math.max(0, scrollPortBottom - bounds.bottom)}px`;
  }, [axis, safeArea, viewRef]);

  const scrollFocusedIntoView = useCallback(() => {
    const view = viewRef.current;
    const active = document.activeElement;
    if (!view || !isTextEntry(active) || !view.contains(active)) return;
    updateSafeArea();
    cancelAnimationFrame(focusScrollFrameRef.current);
    focusScrollFrameRef.current = requestAnimationFrame(() => {
      if (!viewRef.current?.contains(active)) return;
      const viewRect = viewRef.current.getBoundingClientRect();
      const elementRect = active.getBoundingClientRect();
      const bounds =
        safeArea === "visual-viewport"
          ? visualViewportBounds()
          : safeArea === "layout-viewport"
            ? layoutViewportBounds()
            : { top: viewRect.top, bottom: viewRect.bottom };
      const safeTop = Math.max(viewRect.top, bounds.top) + FOCUS_VIEWPORT_GAP;
      const safeBottom = Math.min(viewRect.bottom, bounds.bottom) - FOCUS_VIEWPORT_GAP;
      let delta = 0;
      if (elementRect.top < safeTop) delta = elementRect.top - safeTop;
      else if (elementRect.bottom > safeBottom) delta = elementRect.bottom - safeBottom;
      if (Math.abs(delta) < 1) return;
      viewRef.current.scrollTop += delta;
    });
  }, [safeArea, updateSafeArea, viewRef]);

  const restoreFocusPosition = useCallback(() => {
    const view = viewRef.current;
    if (!view || !focusRestorePendingRef.current) return;
    updateSafeArea();
    const active = document.activeElement;
    if (isTextEntry(active) && view.contains(active)) return;
    const baselineBottom = focusViewportBottomRef.current;
    if (
      safeArea === "visual-viewport" &&
      baselineBottom != null &&
      visualViewportBounds().bottom < baselineBottom - 1
    ) {
      return;
    }
    const origin = focusOriginRef.current;
    if (origin == null) {
      focusRestorePendingRef.current = false;
      return;
    }
    view.scrollTop = Math.min(Math.max(origin, 0), maxOf(view, "y"));
    focusOriginRef.current = null;
    focusViewportBottomRef.current = null;
    focusRestorePendingRef.current = false;
  }, [safeArea, updateSafeArea, viewRef]);

  useEffect(() => {
    if (axis !== "y" || typeof window === "undefined") return undefined;
    const viewport = window.visualViewport;
    const scheduleFocusScroll = () => {
      updateSafeArea();
      clearTimeout(focusTimerRef.current);
      cancelAnimationFrame(focusScrollFrameRef.current);
      if (!focusWantsScrollRef.current) {
        focusScrollFrameRef.current = requestAnimationFrame(restoreFocusPosition);
        return;
      }
      scrollFocusedIntoView();
    };
    updateSafeArea();
    viewport?.addEventListener("resize", scheduleFocusScroll);
    viewport?.addEventListener("scroll", scheduleFocusScroll);
    window.addEventListener("resize", scheduleFocusScroll);
    return () => {
      clearTimeout(focusTimerRef.current);
      cancelAnimationFrame(focusScrollFrameRef.current);
      viewport?.removeEventListener("resize", scheduleFocusScroll);
      viewport?.removeEventListener("scroll", scheduleFocusScroll);
      window.removeEventListener("resize", scheduleFocusScroll);
    };
  }, [axis, restoreFocusPosition, scrollFocusedIntoView, updateSafeArea]);

  const handleFocusCapture = useCallback(
    (event) => {
      onFocusCapture?.(event);
      if (!isTextEntry(event.target)) return;
      const behavior = { scrollIntoView: true };
      if (typeof onFocusInside === "function") {
        onFocusInside({
          nativeEvent: event.nativeEvent,
          changeDefault: (next) => Object.assign(behavior, next),
        });
      } else if (onFocusInside) {
        Object.assign(behavior, onFocusInside);
      }
      if (focusOriginRef.current == null) {
        focusOriginRef.current = viewRef.current?.scrollTop ?? 0;
        focusViewportBottomRef.current = visualViewportBounds().bottom;
      }
      focusRestorePendingRef.current = false;
      focusWantsScrollRef.current = behavior.scrollIntoView;
      if (nativeFocusScrollPrevention) event.target.focus({ preventScroll: true });
      clearTimeout(focusTimerRef.current);
      scrollFocusedIntoView();
      // Some mobile browsers publish their final visual viewport geometry
      // after focus without another resize event. This is a fallback, not the
      // primary path; normal keyboard motion is handled frame-for-frame above.
      focusTimerRef.current = window.setTimeout(scrollFocusedIntoView, 250);
    },
    [nativeFocusScrollPrevention, onFocusCapture, onFocusInside, scrollFocusedIntoView, viewRef]
  );

  const handleBlurCapture = useCallback(
    (event) => {
      onBlurCapture?.(event);
      // Only text-entry focus records an origin that should be restored after
      // keyboard avoidance. A button that opens a child Sheet also blurs, but
      // it has no saved origin; treating that as zero used to jump every
      // containing Scroll.View back to the top during ordinary navigation.
      if (focusOriginRef.current == null) return;
      if (isTextEntry(event.relatedTarget) && viewRef.current?.contains(event.relatedTarget)) return;
      focusWantsScrollRef.current = false;
      focusRestorePendingRef.current = true;
      clearTimeout(focusTimerRef.current);
      cancelAnimationFrame(focusScrollFrameRef.current);
      focusScrollFrameRef.current = requestAnimationFrame(restoreFocusPosition);
    },
    [onBlurCapture, restoreFocusPosition, viewRef]
  );

  const scrollChildren = (
    <>
      {axis === "y" && <div ref={startSpacerRef} data-velvet-scroll="start-spacer" aria-hidden="true" />}
      {asChild && isValidElement(children) ? children.props.children : children}
      {axis === "y" && <div ref={endSpacerRef} data-velvet-scroll="end-spacer" aria-hidden="true" />}
    </>
  );
  const renderedChildren =
    asChild && isValidElement(children)
      ? cloneElement(children, undefined, scrollChildren)
      : scrollChildren;

  return (
    <Polymorph
      asChild={asChild}
      ref={composed}
      data-velvet-scroll="view"
      data-velvet-axis={axis}
      data-velvet-scroll-handoff={trappedAxes || "open"}
      className={className}
      // `scrollGestureTrap={false}` is an actual behavior guarantee, not an
      // absence of styling. An explicit auto prevents a component class with
      // `overscroll-behavior: contain` from silently disabling Sheet handoff.
      // Authors can still override it deliberately through the style prop or
      // use scrollGestureTrap for the documented containment behavior.
      style={{
        overscrollBehaviorX: trapX ? "contain" : "auto",
        overscrollBehaviorY: trapY ? "contain" : "auto",
        ...style,
      }}
      onScroll={onScroll}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      {...rest}
    >
      {renderedChildren}
    </Polymorph>
  );
});

// ---- Content: the travelling content ----
const Content = forwardRef(function Content({ children, asChild, className, style, ...rest }, forwardedRef) {
  return (
    <Polymorph asChild={asChild} ref={forwardedRef} data-velvet-scroll="content" className={className} style={style} {...rest}>
      {children}
    </Polymorph>
  );
});

// ---- Trigger: runs scroll-to / scroll-by on press ----
const Trigger = forwardRef(function Trigger(
  { children, asChild, className, style, action, onClick, onPress, disabled, ...rest },
  forwardedRef
) {
  const { api } = useScroll();
  const activate = () => {
    if (disabled) return;
    if (!action) return;
    if (action.type === "scroll-to") api.scrollTo(action);
    else if (action.type === "scroll-by") api.scrollBy(action);
  };
  const handle = composeEventHandlers(
    onClick,
    composeEventHandlers(onPress, activate)
  );
  return (
    <Polymorph
      as="button"
      asChild={asChild}
      ref={forwardedRef}
      type="button"
      data-velvet-scroll="trigger"
      className={className}
      style={style}
      onClick={handle}
      aria-disabled={disabled || undefined}
      {...rest}
      disabled={disabled}
    >
      {children}
    </Polymorph>
  );
});

export const Scroll = { Root, View, Content, Trigger };
