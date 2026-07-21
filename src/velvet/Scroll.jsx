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
import { useComposedRefs } from "./core/refs.js";
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
  const composed = useComposedRefs(forwardedRef, viewRef);
  const startSpacerRef = useRef(null);
  const endSpacerRef = useRef(null);
  const focusTimerRef = useRef(0);
  const focusWantsScrollRef = useRef(false);
  axisRef.current = axis;

  const onScroll = useCallback(() => {
    const payload = emitProgress();
    onScrollProgress && onScrollProgress({ ...payload, ...api });
  }, [emitProgress, onScrollProgress, api]);

  // Trapping a gesture at the edge = don't let it propagate to an ancestor sheet/scroller.
  const trap =
    scrollGestureTrap === true || !scrollGestureOvershoot
      ? "contain"
      : scrollGestureTrap
        ? "contain"
        : undefined;

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
    requestAnimationFrame(() => {
      if (!viewRef.current?.contains(active)) return;
      const viewRect = viewRef.current.getBoundingClientRect();
      const elementRect = active.getBoundingClientRect();
      const bounds =
        safeArea === "visual-viewport"
          ? visualViewportBounds()
          : safeArea === "layout-viewport"
            ? layoutViewportBounds()
            : { top: viewRect.top, bottom: viewRect.bottom };
      const safeTop = Math.max(viewRect.top, bounds.top) + 64;
      const keyboardMargin = /Android/i.test(navigator.userAgent) ? 102 : 54;
      const safeBottom = Math.min(viewRect.bottom, bounds.bottom) - keyboardMargin;
      let delta = 0;
      if (elementRect.top < safeTop) delta = elementRect.top - safeTop;
      else if (elementRect.bottom > safeBottom) delta = elementRect.bottom - safeBottom;
      if (Math.abs(delta) < 1) return;
      viewRef.current.scrollBy({
        top: delta,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });
  }, [safeArea, updateSafeArea, viewRef]);

  useEffect(() => {
    if (axis !== "y" || typeof window === "undefined") return undefined;
    const viewport = window.visualViewport;
    const scheduleFocusScroll = () => {
      updateSafeArea();
      if (!focusWantsScrollRef.current) return;
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = window.setTimeout(scrollFocusedIntoView, 60);
    };
    updateSafeArea();
    viewport?.addEventListener("resize", scheduleFocusScroll);
    viewport?.addEventListener("scroll", scheduleFocusScroll);
    window.addEventListener("resize", scheduleFocusScroll);
    return () => {
      clearTimeout(focusTimerRef.current);
      viewport?.removeEventListener("resize", scheduleFocusScroll);
      viewport?.removeEventListener("scroll", scheduleFocusScroll);
      window.removeEventListener("resize", scheduleFocusScroll);
    };
  }, [axis, scrollFocusedIntoView, updateSafeArea]);

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
      focusWantsScrollRef.current = behavior.scrollIntoView;
      if (nativeFocusScrollPrevention) event.target.focus({ preventScroll: true });
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = window.setTimeout(scrollFocusedIntoView, 900);
    },
    [nativeFocusScrollPrevention, onFocusCapture, onFocusInside, scrollFocusedIntoView]
  );

  const handleBlurCapture = useCallback(
    (event) => {
      onBlurCapture?.(event);
      if (isTextEntry(event.relatedTarget) && viewRef.current?.contains(event.relatedTarget)) return;
      focusWantsScrollRef.current = false;
      clearTimeout(focusTimerRef.current);
      window.setTimeout(updateSafeArea, 0);
    },
    [onBlurCapture, updateSafeArea, viewRef]
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
      className={className}
      style={{ overscrollBehavior: trap, ...style }}
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
  { children, asChild, className, style, action, onPress, ...rest },
  forwardedRef
) {
  const { api } = useScroll();
  const handle = (e) => {
    if (onPress) onPress(e);
    if (!action) return;
    if (action.type === "scroll-to") api.scrollTo(action);
    else if (action.type === "scroll-by") api.scrollBy(action);
  };
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
      {...rest}
    >
      {children}
    </Polymorph>
  );
});

export const Scroll = { Root, View, Content, Trigger };
