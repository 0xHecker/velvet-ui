import {
  createContext,
  forwardRef,
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
    scrollGestureTrap = false,
    scrollGestureOvershoot = true,
    onScrollProgress,
    ...rest
  },
  forwardedRef
) {
  const { viewRef, axisRef, emitProgress, api } = useScroll();
  const composed = useComposedRefs(forwardedRef, viewRef);
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

  return (
    <Polymorph
      asChild={asChild}
      ref={composed}
      data-velvet-scroll="view"
      data-velvet-axis={axis}
      className={className}
      style={{ overscrollBehavior: trap, ...style }}
      onScroll={onScroll}
      {...rest}
    >
      {children}
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
