import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Native scroll-snap gesture surface and the primitive parts that attach to it.
import { createPortal } from "react-dom";
import { mapSlottedChildren, Polymorph } from "../core/Slot.jsx";
import { composeEventHandlers } from "../core/events.js";
import { useComposedRefs } from "../core/refs.js";
import {
  SPRING_PRESETS,
  decimateSpring,
  linearEasingFromSamples,
  resolveSpringSettings,
} from "../core/spring.js";
import { applyTravel, travelStyles } from "../core/travel.js";
import { SheetScrollHandoffContext } from "../core/scrollHandoff.js";
import { useSheetStack } from "../SheetStack.jsx";
import {
  focusFirst,
  restoreFocus,
  scopedFocusableElements,
} from "./FocusScope.js";
import {
  isFrontmostDismissLayer,
  isFrontmostModal,
  lockDocumentScroll,
  registerDismissLayer,
  registerModalLayer,
  unlockDocumentScroll,
} from "./ModalManager.js";
import {
  captureElementGeometry,
  clamp01,
  clientOf,
  DEFAULT_EXIT_SPRING,
  DETENT_TOLERANCE_PX,
  getMorphAnimation,
  hasMorphAnimation,
  isLeadingTrack,
  maxOf,
  NATIVE_TRAVEL_CAPABLE,
  offOf,
  registerActiveView,
  resolveSnapOutAcceleration,
  restoreProgrammaticOverflow,
  sampleMotion,
  SCROLL_IDLE_MS,
  setOff,
  supportsLinearEasing,
  TRACK,
  trackFromSettings,
} from "./SheetMotion.js";
import {
  SheetPreviewEnvironment,
  SheetRoot as Root,
  useSheet,
  useSheetPart,
  useStacking,
  useTravel,
} from "./SheetState.jsx";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
// Vite replaces this at build time, allowing Terser to remove the diagnostic
// copy entirely from the published production chunks.
const isDevelopment = import.meta.env?.DEV === true;

// ---- Portal ---------------------------------------------------------------
const isPortalContainerRef = (value) =>
  value != null &&
  typeof value === "object" &&
  !("nodeType" in value) &&
  "current" in value;

const resolvePortalContainer = (value) =>
  isPortalContainerRef(value) ? value.current : value;

const Portal = ({ children, container }) => {
  const { mounted, preview } = useSheet();
  const [, retryContainer] = useState(0);
  const configuredContainer = container ?? preview?.container;
  const target = resolvePortalContainer(configuredContainer);

  // A DOM ref is assigned after render. If a sheet is already mounted on that
  // first commit, render once more after refs have settled so consumers can
  // pass `container={hostRef}` without storing the element in React state.
  useIso(() => {
    if (
      !mounted ||
      !isPortalContainerRef(configuredContainer) ||
      target ||
      !configuredContainer.current
    ) {
      return;
    }
    retryContainer((version) => version + 1);
  }, [configuredContainer, mounted, target]);

  if (!mounted || typeof document === "undefined") return null;
  if (isPortalContainerRef(configuredContainer) && !target) return null;
  if (preview && !target) return null;
  return createPortal(children, target || document.body);
};

const NestedPortalContext = createContext(null);

const NestedPortalHost = forwardRef(function NestedPortalHost(
  { asChild, children, className, style, ...rest },
  forwardedRef
) {
  const hostRef = useRef(null);
  const composed = useComposedRefs(forwardedRef, hostRef);
  return (
    <NestedPortalContext.Provider value={hostRef}>
      <Polymorph
        asChild={asChild}
        ref={composed}
        data-velvet="nested-host"
        className={className}
        {...rest}
        style={{
          ...style,
          position: "relative",
          overflow: "clip",
        }}
      >
        {children}
      </Polymorph>
    </NestedPortalContext.Provider>
  );
});

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
    side = "bottom",
    tracks,
    snapPoints,
    draggable = true,
    dismissible: dismissibleProp = true,
    swipeOvershoot = true,
    swipeTrap,
    snapOutAcceleration = "auto",
    snapToEndDetentsAcceleration = "auto",
    modal: modalProp = true,
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
    id: viewIdProp,
    ...rest
  },
  forwardedRef
) {
  const contentPlacement = side;
  const detents = snapPoints;
  const swipe = draggable;
  const swipeDismissal = dismissibleProp;
  const inertOutside = modalProp;
  const sheet = useSheet();
  const {
    presented,
    activeDetent,
    setActiveDetent,
    sheetRole,
    emitTravel,
    emitStacking,
    getTravelAnimations,
    getStackingAnimations,
    finishEnter,
    finishExit,
    titleId,
    descriptionId,
    viewId,
    setViewId,
    generatedViewId,
    scopeId,
    parentScopeId,
    titleCount,
    descriptionCount,
    lastFocused,
    initialFocusRef,
    restoreFocusRef,
    dismissPending,
    lastDismissReason,
    actionDispatcherRef,
    performAction,
    requestAction,
  } = sheet;

  const renderedViewId = viewIdProp ?? generatedViewId;
  useIso(() => {
    setViewId(renderedViewId);
  }, [renderedViewId, setViewId]);

  const isPreview = Boolean(sheet.preview);
  const swipeEnabled = !isPreview && swipe;
  const modal = isPreview ? false : inertOutside;
  const dismissible = swipeDismissal !== false && sheetRole !== "alertdialog";
  const detentList = useMemo(
    () => (detents == null ? [] : Array.isArray(detents) ? detents : [detents]),
    [detents]
  );
  const hasDetents = detentList.length > 0;
  const automaticTracks = tracks === "auto";
  // A no-detent auto sheet can keep one stable native runway. The nested
  // scroller already hands movement to its parent only at the matching edge,
  // so the browser naturally chooses bottom at the start and top at the end.
  // Keeping both tracks mounted avoids changing layout geometry in response
  // to an ordinary content scroll (which can otherwise cancel the click that
  // caused scrollIntoView).
  const stableAutomaticTracks = automaticTracks && !hasDetents;
  const [automaticTrack, setAutomaticTrack] = useState("bottom");
  const [restingInside, setRestingInside] = useState(false);

  const restoreCapturedFocus = useCallback(() => {
    const element = restoreFocusRef?.current || lastFocused.current;
    lastFocused.current = null;
    // Exit can complete synchronously when motion is skipped. Restore after
    // the click/default-action task and modal-layer cleanup have finished, or
    // removing the pressed close control can move focus back to <body>.
    queueMicrotask(() => {
      if (element?.isConnected) restoreFocus(element);
    });
  }, [lastFocused, restoreFocusRef]);
  useEffect(() => {
    if (!presented) {
      setRestingInside(false);
      setAutomaticTrack("bottom");
    }
  }, [presented]);
  // Silk only switches to persistent snap geometry after the sheet has
  // finished entering. During entering/exiting it uses the ordinary outside
  // geometry so the first/last programmatic travel has a real distance.
  const actualSwipeOutDisabledWithDetent =
    swipeEnabled && !dismissible && hasDetents && presented && restingInside;

  const trackList = useMemo(() => {
    if (stableAutomaticTracks) {
      return contentPlacement === "left" || contentPlacement === "right"
        ? ["left", "right"]
        : ["top", "bottom"];
    }
    if (automaticTracks) return [automaticTrack];
    if (Array.isArray(tracks)) return tracks;
    if (tracks) return [tracks];
    if (contentPlacement && contentPlacement !== "center") return [contentPlacement];
    return ["bottom"];
  }, [automaticTrack, automaticTracks, contentPlacement, stableAutomaticTracks, tracks]);
  const reportNestedScroll = useCallback(
    ({ progress, availableDistance }) => {
      if (!automaticTracks || stableAutomaticTracks || !(availableDistance > 0)) return;
      const nextTrack = progress < 0.5 ? "bottom" : "top";
      setAutomaticTrack((current) => (current === nextTrack ? current : nextTrack));
    },
    [automaticTracks, stableAutomaticTracks]
  );
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
  const requestedSwipeTrap =
    swipeTrap && typeof swipeTrap === "object"
      ? swipeTrap
      : { x: swipeTrap === true, y: swipeTrap === true };
  const swipeTrapAxes = {
    x:
      modal ||
      requestedSwipeTrap.x === true ||
      (axis === "x" && swipeOvershoot === false),
    y:
      modal ||
      requestedSwipeTrap.y === true ||
      (axis === "y" && swipeOvershoot === false),
  };
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
  const presentedLatestRef = useRef(presented);
  presentedLatestRef.current = presented;
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
  const ignoredProgrammaticOffsetRef = useRef(null);
  const touchOngoingRef = useRef(false);
  const progressFilterRef = useRef({ previous: 0, delta: 0 });
  const observerRef = useRef(null);
  const observerWheelCleanupRef = useRef(null);
  const wheelSeenRef = useRef(false);
  const nativeDismissRef = useRef(false);
  const nativeDismissRafRef = useRef(0);
  const nativeObservationArmedRef = useRef(false);
  const nativeObservationArmRafRef = useRef(0);
  const nativeInputObservedRef = useRef(false);
  const lastNativeInputEventRef = useRef(null);
  const movedRef = useRef(false);
  const pointerDownTargetRef = useRef(null);
  const pendingStepRef = useRef(null);
  const pendingStepRafRef = useRef([0, 0]);
  const liveDetentRef = useRef(activeDetent);
  liveDetentRef.current = activeDetent;
  const titleCountRef = useRef(titleCount);
  titleCountRef.current = titleCount;
  const missingTitleWarnedRef = useRef(false);
  const [travelStatus, setTravelStatus] = useState(
    presented ? "entering" : "idleOutside"
  );
  const travelStatusRef = useRef(travelStatus);
  const dismissPendingRef = useRef(dismissPending);
  const lastDismissReasonRef = useRef(lastDismissReason);
  travelStatusRef.current = travelStatus;
  dismissPendingRef.current = dismissPending;
  lastDismissReasonRef.current = lastDismissReason;
  const publishTravelStatus = useCallback(
    (status) => {
      setTravelStatus(status);
      onTravelStatusChange?.(status);
    },
    [onTravelStatusChange]
  );
  const hasExplicitAccessibleName = Boolean(
    rest["aria-label"] || rest["aria-labelledby"]
  );

  useEffect(() => {
    if (!isDevelopment) return undefined;
    if (!presented) {
      missingTitleWarnedRef.current = false;
      return undefined;
    }
    if (hasExplicitAccessibleName) return undefined;

    const timer = setTimeout(() => {
      if (titleCountRef.current > 0 || missingTitleWarnedRef.current) return;
      missingTitleWarnedRef.current = true;
      console.warn(
        "[Velvet UI] A presented <Sheet.View> has no <Sheet.Title> registered with its <Sheet.Root>. " +
          "In nested sheets, keep the parent title outside the child <Sheet.Root> so each dialog receives its own accessible name."
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [hasExplicitAccessibleName, presented, renderedViewId]);

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
    restoreProgrammaticOverflow(motion);
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
    // Associate the one suppressed event with its destination. A browser may
    // clamp the requested offset by half a layout pixel and emit no event; a
    // blind boolean would then eat the first (possibly only) event from the
    // next real swipe. Destination matching retains the reference's one-event
    // suppression without letting a stale marker hide native input.
    ignoredProgrammaticOffsetRef.current = reachableDestination;
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
      const reachableDestinationOffset = Math.min(
        Math.max(destinationOffset, 0),
        maxOf(scroll, axis)
      );
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
      const leadingTrack = isLeadingTrack(track);
      const originProgress = Math.max(
        leadingTrack
          ? 1 + originCoordinate / travelLength
          : 1 - originCoordinate / travelLength,
        0
      );
      const progressDistance = destinationProgress - originProgress;
      const contentMove = !(Object.hasOwn(config, "contentMove") && !config.contentMove);

      const destinationVisualCoordinate =
        (leadingTrack ? -1 : 1) * (1 - destinationProgress) * travelLength;
      const translateAxis = axis === "x" ? "X" : "Y";
      const transformForTranslation = (translation) =>
        `translate${translateAxis}(${translation}px)`;

      // Reverse from the rendered pose. commitStyles() keeps the current WAAPI
      // frame alive while the replacement travel takes ownership in the next
      // double-rAF, so hover enter/leave never teleports to the old endpoint.
      cancelMotion({ preserveVisual: true });
      const previousOverflow = scroll.style.getPropertyValue("overflow");
      const previousOverflowPriority = scroll.style.getPropertyPriority("overflow");
      const previousTouchAction = scroll.style.getPropertyValue("touch-action");
      const previousTouchActionPriority =
        scroll.style.getPropertyPriority("touch-action");
      scroll.style.setProperty("overflow", "hidden", "important");
      // Overflow alone does not cancel an already compositor-routed touch
      // gesture in every browser. Disable gesture negotiation while WAAPI owns
      // travel so a swipe begun during entrance cannot release a momentum tail
      // onto the native runway when overflow is restored. Taps/clicks continue
      // to dispatch normally.
      scroll.style.setProperty("touch-action", "none", "important");

      let startTranslation = originCoordinate;
      let endTranslation = destinationVisualCoordinate;
      if (contentMove) {
        // The hidden native runway may include acceleration space that is not
        // part of visible sheet travel. Measure its real destination layout
        // synchronously, then restore the rendered pose with a FLIP before the
        // browser can paint. A short translation probe also accounts for an
        // authored transform between View and the content-area wrapper.
        wrapper.style.removeProperty("transform");
        suppressAsyncScrollEvent(reachableDestinationOffset);
        setOff(scroll, axis, reachableDestinationOffset);
        const coordinateOf = () => {
          const currentWrapperRect = wrapper.getBoundingClientRect();
          const currentViewRect = view.getBoundingClientRect();
          const currentRenderedViewLength =
            axis === "y" ? currentViewRect.height : currentViewRect.width;
          const currentCoordinateScale =
            currentRenderedViewLength / geometry.viewLength || coordinateScale;
          return (
            (axis === "y"
              ? currentWrapperRect.top - currentViewRect.top
              : currentWrapperRect.left - currentViewRect.left) / currentCoordinateScale
          );
        };
        const baseDestinationCoordinate = coordinateOf();
        wrapper.style.transform = transformForTranslation(100);
        const translatedCoordinate = coordinateOf();
        const translationScale =
          Math.abs(translatedCoordinate - baseDestinationCoordinate) > 0.0001
            ? (translatedCoordinate - baseDestinationCoordinate) / 100
            : 1;
        startTranslation =
          (originCoordinate - baseDestinationCoordinate) / translationScale;
        endTranslation =
          (destinationVisualCoordinate - baseDestinationCoordinate) / translationScale;
        wrapper.style.transform = transformForTranslation(startTranslation);
      } else {
        wrapper.style.removeProperty("transform");
      }

      const transformAt = (value) =>
        transformForTranslation(
          startTranslation + (endTranslation - startTranslation) * value
        );
      const settleWrapperTransform = () => {
        if (!contentMove || Math.abs(endTranslation) < 0.0001) {
          wrapper.style.removeProperty("transform");
        } else {
          wrapper.style.transform = transformForTranslation(endTranslation);
        }
      };

      if (runStart) {
        publishTravelStatus(travelStatus);
        onTravelStart?.();
      }
      if (config.skip) {
        settleWrapperTransform();
        programmaticRef.current = true;
        suppressAsyncScrollEvent(destinationOffset);
        setOff(scroll, axis, destinationOffset);
        reportTravel(destinationProgress, { start: targetDetent, end: targetDetent });
        lastVisualCoordinateRef.current = readVisualCoordinate();
        programmaticRef.current = false;
        if (previousOverflow) {
          scroll.style.setProperty("overflow", previousOverflow, previousOverflowPriority);
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
        onComplete?.();
        onTravelEnd?.();
        return;
      }

      if (
        !Number.isFinite(startTranslation) ||
        !Number.isFinite(endTranslation) ||
        Math.abs(originProgress - destinationProgress) < 0.0001
      ) {
        settleWrapperTransform();
        programmaticRef.current = true;
        suppressAsyncScrollEvent(destinationOffset);
        setOff(scroll, axis, destinationOffset);
        reportTravel(destinationProgress, { start: targetDetent, end: targetDetent });
        lastVisualCoordinateRef.current = readVisualCoordinate();
        programmaticRef.current = false;
        if (previousOverflow) {
          scroll.style.setProperty("overflow", previousOverflow, previousOverflowPriority);
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
        onComplete?.();
        onTravelEnd?.();
        return;
      }
      const { values: rawValues, duration } = sampleMotion(
        config,
        contentMove ? startTranslation : originProgress * travelLength,
        contentMove ? endTranslation : destinationProgress * travelLength
      );
      const decimated = decimateSpring(rawValues, 8);
      const visualValues = decimated.length ? decimated : [1];
      const mappedValues = visualValues.map(
        (value) => originProgress + progressDistance * value
      );
      const firstVisualValue = visualValues[0] ?? 0;
      const lastVisualValue = visualValues[visualValues.length - 1] ?? 1;
      const visualDistance = lastVisualValue - firstVisualValue || 1;
      const normalizedVisualValues = visualValues.map((value) =>
        Math.min(Math.max((value - firstVisualValue) / visualDistance, 0), 1)
      );
      const morphProgressValues =
        travelStatus === "entering"
          ? normalizedVisualValues
          : travelStatus === "exiting"
            ? normalizedVisualValues.map((value) => 1 - value)
            : normalizedVisualValues.map(() => 1);
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
        scroll,
        previousOverflow,
        previousOverflowPriority,
        previousTouchAction,
        previousTouchActionPriority,
        overflowRestored: false,
      };
      motionRef.current = motion;
      programmaticRef.current = true;
      // The reference runtime gives WAAPI exclusive ownership during
      // programmatic travel. Native scroll-snap is re-enabled only after the
      // spring settles, so a quick user swipe cannot move the hidden track
      // underneath an entrance/step/exit animation.
      scroll.style.setProperty("overflow", "hidden", "important");

      if (contentMove || targetDetent !== 0) {
        // Stage the destination scroll base and its compensating transform in
        // this layout effect, before the browser can paint changed detent
        // geometry. Waiting for the animation rAF would expose one raw-layout
        // frame (persistent close: down, then up, then down again).
        if (contentMove) wrapper.style.transform = transformAt(0);
        suppressAsyncScrollEvent(destinationOffset);
        setOff(scroll, axis, destinationOffset);
      }

      motion.raf = requestAnimationFrame(() => {
        motion.raf2 = requestAnimationFrame(() => {
          if (token !== motionTokenRef.current) return;
          if (contentMove || targetDetent !== 0) {
            // Reassert the staged FLIP pose at WAAPI startup. This also holds
            // the exact origin throughout a configured delay without
            // stranding a committed pose from a replaced animation.
            if (contentMove) wrapper.style.transform = transformAt(0);
            suppressAsyncScrollEvent(destinationOffset);
            scroll.scrollTo({
              left: axis === "x" ? destinationOffset : 0,
              top: axis === "y" ? destinationOffset : 0,
            });
          }

          const timing = {
            easing: useLinear ? linearEasingFromSamples(visualValues) : "linear",
            duration,
            delay: config.delay ?? 0,
          };
          const waitForAnimation = (
            target,
            keyframes,
            persistFinal = false,
            clearAfter = [],
            clearAtStart = []
          ) =>
            new Promise((resolve) => {
              if (!target || keyframes.length === 0) {
                resolve();
                return;
              }
              const animation = target.animate(
                keyframes,
                clearAtStart.length > 0
                  ? { ...timing, fill: "backwards" }
                  : timing
              );
              motion.animations.push({
                animation,
                target,
                properties: Object.keys(keyframes[0] || {}),
              });
              // Once WAAPI owns the first frame, remove the synchronous FLIP
              // hold. Leaving it underneath the animation would briefly
              // resurface the origin transform at finish, just before detent
              // geometry rebases, producing a one-frame hover reversal.
              clearAtStart.forEach((property) =>
                target.style.removeProperty(property)
              );
              let settled = false;
              const cleanup = () => {
                animation.removeEventListener("finish", finish);
                animation.removeEventListener("cancel", cancel);
              };
              const settle = (completed) => {
                if (settled) return;
                settled = true;
                cleanup();
                if (!completed) {
                  resolve();
                  return;
                }
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
                resolve();
              };
              const finish = () => {
                settle(true);
              };
              const cancel = () => settle(false);
              animation.addEventListener("finish", finish);
              animation.addEventListener("cancel", cancel);
              // A one-sample spring can finish before the event listener is
              // observed. The finished promise is stateful, so it closes that
              // race while cancellation still resolves the obsolete motion
              // without committing its final frame.
              animation.finished.then(finish, cancel);
            });

          const visualPromise = contentMove
            ? waitForAnimation(
                wrapper,
                visualKeyframes,
                Math.abs(endTranslation) >= 0.0001,
                Math.abs(endTranslation) < 0.0001 ? ["transform"] : [],
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
            ...[...wrapper.querySelectorAll('[data-velvet-morph]')]
              .filter(hasMorphAnimation)
              .map((target) => ({
                ref: { current: target },
                getAnimation: getMorphAnimation(target),
                progressValues: morphProgressValues,
                parentOffset:
                  (startTranslation - endTranslation) * (1 - firstVisualValue),
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
                keyframes: frameValues.map((progress) =>
                  travelStyles(map, progress, {
                    axis,
                    parentOffset:
                      entry.parentOffset ?? startTranslation - endTranslation,
                  })
                ),
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
                suppressAsyncScrollEvent(reachableDestination);
                setOff(scroll, axis, reachableDestination);
              }
            }
            restoreProgrammaticOverflow(motion);
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
      publishTravelStatus,
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
        return true;
      }
      if (action.type === "dismiss") {
        const range = lastRangeRef.current;
        const atClosedDetent =
          range.start === 0 && range.end === 0;
        const persistentBetweenDetents =
          !dismissible && range.start !== range.end;
        // Match the reference CLOSE gate: semantic close cannot compete with
        // physical swipe-out at detent zero, and a persistent sheet rejects a
        // close while native travel is between detents.
        if (
          !programmaticRef.current &&
          !action.nativeCommit &&
          (atClosedDetent || persistentBetweenDetents)
        ) return false;
      }
      if (action.type === "step" && presented) {
        nativeObservationArmedRef.current = true;
      }
      return performAction(action);
    };
    actionDispatcherRef.current = dispatch;
    return () => {
      if (actionDispatcherRef.current === dispatch) actionDispatcherRef.current = null;
    };
  }, [actionDispatcherRef, dismissible, performAction, presented]);

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

  const beginNativeDismiss = useCallback(() => {
    const view = viewRef.current;
    const scroll = scrollRef.current;
    const content = scroll?.querySelector('[data-velvet="content"]');
    if (
      !view ||
      !scroll ||
      !content ||
      !activeRef.current ||
      !nativeObservationArmedRef.current ||
      nativeDismissRef.current ||
      programmaticRef.current ||
      !dismissible
    ) {
      return false;
    }

    // Match Silk's SWIPED_OUT -> GO_OUT ordering: stop native snap ownership,
    // publish an exact final travel frame, end the travel sequence, then move
    // the sheet out of the stack. Rapid flings can cross the closed boundary
    // between rAF samples; removing the layer before this zero frame makes the
    // backdrop and the sheet underneath jump from an intermediate pose.
    nativeDismissRef.current = true;
    activeRef.current = false;
    scroll.style.setProperty("scroll-snap-type", "none", "important");
    pendingStepRef.current = null;
    reportTravel(0, { start: 0, end: 0 });
    endNativeTravel();

    // Prevent the already-dismissed native runway from receiving the tail of
    // the same gesture. Keep its final zero-travel frame paintable for one
    // frame, as Silk does before its after-paint layer removal, instead of
    // collapsing the view geometry and causing a compositor flash.
    view.inert = true;
    view.style.setProperty("pointer-events", "none", "important");
    content.style.setProperty("pointer-events", "none", "important");
    scroll.style.setProperty("pointer-events", "none", "important");

    const recoveryDetent = Math.max(activeDetent || 1, 1);
    const dismissalAction = {
      type: "dismiss",
      nativeCommit: true,
      detail: {
        reason: "swipe",
        nativeEvent: lastNativeInputEventRef.current ?? undefined,
      },
    };
    const restoreDismissedRunway = () => {
      const geometry = measureGeometry();
      nativeDismissRef.current = false;
      activeRef.current = true;
      nativeObservationArmedRef.current = true;
      nativeInputObservedRef.current = false;
      view.inert = false;
      view.style.removeProperty("pointer-events");
      content.style.removeProperty("pointer-events");
      scroll.style.removeProperty("pointer-events");
      scroll.style.removeProperty("scroll-snap-type");
      previousDetentRef.current = recoveryDetent;
      liveDetentRef.current = recoveryDetent;
      if (geometry) {
        const offset = targetOffset(recoveryDetent, primaryTrack);
        programmaticRef.current = true;
        suppressAsyncScrollEvent(offset);
        setOff(scroll, axis, offset);
        reportTravel(geometry.exactProgressAtDetents[recoveryDetent], {
          start: recoveryDetent,
          end: recoveryDetent,
        });
        programmaticRef.current = false;
      }
      setRestingInside(true);
      publishTravelStatus("idleInside");
    };

    const settleDismissRequest = (accepted) => {
      if (accepted === false) {
        restoreDismissedRunway();
        return;
      }
      cancelAnimationFrame(nativeDismissRafRef.current);
      nativeDismissRafRef.current = requestAnimationFrame(() => {
        nativeDismissRafRef.current = requestAnimationFrame(() => {
          // Keep the exact zero-progress stack/backdrop frame through a full
          // paint boundary before React can remove the layer. A single rAF can
          // still share the rendering update that published the zero frame
          // when a compositor fling crosses the boundary between samples.
          performAction(dismissalAction);
          nativeDismissRafRef.current = requestAnimationFrame(() => {
            nativeDismissRafRef.current = 0;
            // A controlled owner rejects by leaving `open` true. Return to the
            // last inside detent after giving React a frame to commit its choice.
            if (presentedLatestRef.current && nativeDismissRef.current) {
              restoreDismissedRunway();
            }
          });
        });
      });
    };
    if (wheelSeenRef.current) {
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
      }, 100);
    }
    const requested = requestAction({ ...dismissalAction, deferCommit: true });
    if (requested && typeof requested.then === "function") {
      requested.then(settleDismissRequest);
    } else {
      settleDismissRequest(requested);
    }
    return true;
  }, [
    activeDetent,
    axis,
    dismissible,
    endNativeTravel,
    measureGeometry,
    primaryTrack,
    performAction,
    publishTravelStatus,
    reportTravel,
    requestAction,
    suppressAsyncScrollEvent,
    targetOffset,
  ]);

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
      !nativeObservationArmedRef.current ||
      !nativeScrollEnabled ||
      !dismissible ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }
    wheelSeenRef.current = false;
    const markWheel = (event) => {
      wheelSeenRef.current = true;
      nativeInputObservedRef.current = true;
      lastNativeInputEventRef.current = event;
    };
    window.addEventListener("wheel", markWheel, { passive: true, once: true });
    observerWheelCleanupRef.current = () =>
      window.removeEventListener("wheel", markWheel, { passive: true });

    let firstObservation = true;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const ignoreInitialGeometry =
          firstObservation &&
          !nativeInputObservedRef.current &&
          !scrollSequenceRef.current;
        firstObservation = false;
        for (const entry of entries) {
          if (ignoreInitialGeometry) continue;
          if (entry.isIntersecting || programmaticRef.current) continue;
          beginNativeDismiss();
        }
      },
      { root: view, threshold: [0] }
    );
    observerRef.current.observe(content);
  }, [
    beginNativeDismiss,
    disarmDismissObserver,
    dismissible,
    nativeScrollEnabled,
  ]);

  const scheduleNativeObservationArm = useCallback(() => {
    cancelAnimationFrame(nativeObservationArmRafRef.current);
    nativeObservationArmRafRef.current = requestAnimationFrame(() => {
      nativeObservationArmRafRef.current = 0;
      if (!activeRef.current || !presented) return;
      nativeObservationArmedRef.current = true;
      nativeInputObservedRef.current = false;
      armDismissObserver();
    });
  }, [armDismissObserver, presented]);

  const sampleNativeTravel = useCallback(() => {
    if (!scrollSequenceRef.current) return;
    const progress = progressOf();
    reportTravel(progress);
    if (progress <= 0 && beginNativeDismiss()) return;
    updateLiveDetent(progress);
    travelRafRef.current = requestAnimationFrame(sampleNativeTravel);
  }, [beginNativeDismiss, progressOf, reportTravel, updateLiveDetent]);

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
    if (settledIndex === 0 && dismissible) {
      pendingStepRef.current = null;
      if (!beginNativeDismiss()) endNativeTravel();
      return;
    }
    if (settledIndex > 0 && settledIndex !== activeDetent) {
      setActiveDetent(settledIndex);
    }
    if (settledIndex > 0) {
      lastVisualCoordinateRef.current = readVisualCoordinate();
      setRestingInside(true);
      publishTravelStatus("idleInside");
      finishEnter();
      scheduleNativeObservationArm();
    }
    endNativeTravel();
    if (settledIndex > 0) flushPendingStep(settledIndex);
    else pendingStepRef.current = null;
  }, [
    activeDetent,
    beginNativeDismiss,
    dismissible,
    endNativeTravel,
    flushPendingStep,
    finishEnter,
    publishTravelStatus,
    progressOf,
    readVisualCoordinate,
    reportTravel,
    scheduleNativeObservationArm,
    setActiveDetent,
  ]);

  const onScroll = useCallback(() => {
    const ignoredOffset = ignoredProgrammaticOffsetRef.current;
    if (ignoredOffset !== null) {
      ignoredProgrammaticOffsetRef.current = null;
      const currentOffset = scrollRef.current ? offOf(scrollRef.current, axis) : null;
      if (currentOffset !== null && Math.abs(currentOffset - ignoredOffset) <= 1) {
        if (scrollSequenceRef.current) {
          clearTimeout(scrollEndTimerRef.current);
          scrollEndTimerRef.current = window.setTimeout(settleNativeTravel, SCROLL_IDLE_MS);
        }
        return;
      }
    }
    if (
      !activeRef.current ||
      programmaticRef.current ||
      !nativeScrollEnabled ||
      !nativeObservationArmedRef.current
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
      publishTravelStatus("stepping");
      onTravelStart?.();
    }
    cancelAnimationFrame(travelRafRef.current);
    travelRafRef.current = requestAnimationFrame(sampleNativeTravel);
    clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = window.setTimeout(settleNativeTravel, SCROLL_IDLE_MS);
  }, [axis, nativeScrollEnabled, onTravelStart, publishTravelStatus, sampleNativeTravel, settleNativeTravel]);

  const onTouchStart = useCallback((event) => {
    touchOngoingRef.current = true;
    nativeInputObservedRef.current = true;
    lastNativeInputEventRef.current = event.nativeEvent ?? event;
    nativeObservationArmedRef.current = true;
    armDismissObserver();
  }, [armDismissObserver]);
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
    if (presented && previous === 0) {
      cancelAnimationFrame(nativeObservationArmRafRef.current);
      nativeObservationArmRafRef.current = 0;
      nativeObservationArmedRef.current = false;
      nativeInputObservedRef.current = false;
    }
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
    if (
      presented &&
      previous === 0 &&
      !isPreview &&
      (!lastFocused.current || !lastFocused.current.isConnected)
    ) {
      lastFocused.current = document.activeElement;
    }
    if (!presented && nativeDismissRef.current) {
      cancelAnimationFrame(nativeObservationArmRafRef.current);
      nativeObservationArmedRef.current = false;
      cancelMotion();
      nativeDismissRef.current = false;
      previousDetentRef.current = 0;
      if (!isPreview) restoreCapturedFocus();
      finishExit();
      publishTravelStatus("idleOutside");
      return undefined;
    }
    if (!presented && previous === 0) {
      // A closed native snap may have updated the live detent before the
      // presented state follows. Never leave that already-closed View mounted
      // merely because no programmatic exit distance remains.
      cancelMotion();
      disarmDismissObserver();
      cancelAnimationFrame(nativeObservationArmRafRef.current);
      nativeObservationArmedRef.current = false;
      if (!isPreview) restoreCapturedFocus();
      finishExit();
      publishTravelStatus("idleOutside");
      return undefined;
    }

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
      publishTravelStatus("idleInside");
      finishEnter();
      scheduleNativeObservationArm();
      return undefined;
    }

    if (presented && previous === target) {
      cancelMotion();
      scheduleNativeObservationArm();
      return undefined;
    }

    if (presented && previous === 0) {
      publishTravelStatus("entering");
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
      setRestingInside(true);
      publishTravelStatus("idleInside");
      finishEnter();
      scheduleNativeObservationArm();
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
          if (!isPreview) restoreCapturedFocus();
          finishExit();
          publishTravelStatus("idleOutside");
          return;
        }
        activeRef.current = true;
        setRestingInside(true);
        if (target !== activeDetent) setActiveDetent(target);
        if (previous === 0 && !isPreview) {
          // Let the settled sheet commit before moving focus. The panel itself
          // is the safe fallback, so opening a form never summons the mobile
          // keyboard unless the author explicitly marks a field for autofocus.
          requestAnimationFrame(() => {
            if (activeRef.current) {
              focusFirst(viewRef.current, initialFocusRef?.current);
            }
          });
        }
        publishTravelStatus("idleInside");
        finishEnter();
        scheduleNativeObservationArm();
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
    dismissible,
    enteringAnimationSettings,
    exitingAnimationSettings,
    endNativeTravel,
    finishExit,
    finishEnter,
    isPreview,
    initialFocusRef,
    lastFocused,
    measureGeometry,
    onTravelStart,
    publishTravelStatus,
    presented,
    primaryTrack,
    reportTravel,
    readVisualCoordinate,
    restoreCapturedFocus,
    runProgrammaticTravel,
    setActiveDetent,
    scheduleNativeObservationArm,
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
        cancelAnimationFrame(nativeDismissRafRef.current);
        cancelAnimationFrame(nativeObservationArmRafRef.current);
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
      element: viewRef.current,
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
      inspect: () => {
        const element = viewRef.current;
        return {
          scopeId,
          parentScopeId,
          layerKind: "sheet",
          portalContainer: element?.parentElement || null,
          open: presentedLatestRef.current,
          travelStatus: travelStatusRef.current,
          lastDismissReason: lastDismissReasonRef.current,
          dismissPending: dismissPendingRef.current,
          capturedFocusElement: lastFocused.current,
          plannedRestoreTarget:
            restoreFocusRef?.current || lastFocused.current || null,
          initialFocusTarget: initialFocusRef?.current || null,
        };
      },
    };
    return registerActiveView(api);
  }, [axis, cancelMotion, initialFocusRef, isPreview, lastFocused, measureGeometry, parentScopeId, primaryTrack, rawProgressOf, reportTravel, restoreFocusRef, scopeId, suppressAsyncScrollEvent, targetOffset]);

  // Body scroll lock for modal sheets (ref-counted across stacked sheets).
  useEffect(() => {
    const view = viewRef.current;
    if (!modal || !view) return;
    lockDocumentScroll(view);
    return () => unlockDocumentScroll(view);
  }, [modal]);

  // The frontmost modal is the only interactive document branch. This is a
  // DOM property rather than an aria-hidden approximation, so pointer, focus,
  // assistive technology and programmatic tab order all agree.
  useIso(() => {
    if (!modal || isPreview || !viewRef.current) return undefined;
    return registerModalLayer(viewRef.current);
  }, [isPreview, modal]);

  useIso(() => {
    if (isPreview || !viewRef.current) return undefined;
    return registerDismissLayer(viewRef.current);
  }, [isPreview]);

  // Loop Tab within the frontmost modal. `inert` prevents focus from escaping
  // by ordinary navigation; the loop keeps the keyboard sequence continuous
  // at the first and last focusable controls.
  useEffect(() => {
    if (!modal || isPreview) return undefined;
    const onKey = (event) => {
      const view = viewRef.current;
      if (event.key !== "Tab" || !view || !isFrontmostModal(view)) return;
      const focusable = scopedFocusableElements(view).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0
      );
      if (focusable.length === 0) {
        event.preventDefault();
        view.querySelector('[data-velvet="content"]')?.focus({ preventScroll: true });
        return;
      }
      const active = document.activeElement;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeIsOwned = focusable.includes(active);
      if (
        event.shiftKey
          ? active === first || !activeIsOwned
          : active === last || !activeIsOwned
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPreview, modal]);

  // Escape key.
  useEffect(() => {
    if (isPreview) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (!isFrontmostDismissLayer(viewRef.current)) return;
      const behavior = { nativePreventDefault: true, dismiss: sheetRole !== "alertdialog" };
      if (typeof onEscapeKeyDown === "function")
        onEscapeKeyDown({ changeDefault: (b) => Object.assign(behavior, b), nativeEvent: e });
      else if (onEscapeKeyDown) Object.assign(behavior, onEscapeKeyDown);
      if (behavior.nativePreventDefault) e.preventDefault();
      if (behavior.dismiss) {
        requestAction({
          type: "dismiss",
          detail: { reason: "escape", nativeEvent: e },
        });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPreview, onEscapeKeyDown, requestAction, sheetRole]);

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

  const requestOutsideDismiss = useCallback(
    (event) => {
      if (!isFrontmostDismissLayer(viewRef.current)) return;
      const behavior = {
        dismiss: sheetRole !== "alertdialog",
        stopOverlayPropagation: true,
      };
      if (typeof onClickOutside === "function") {
        onClickOutside({
          changeDefault: (next) => Object.assign(behavior, next),
          nativeEvent: event,
        });
      } else if (onClickOutside) {
        Object.assign(behavior, onClickOutside);
      }
      if (behavior.stopOverlayPropagation) event.stopPropagation();
      if (behavior.dismiss) {
        requestAction({
          type: "dismiss",
          detail: { reason: "outside-press", nativeEvent: event.nativeEvent ?? event },
        });
      }
    },
    [onClickOutside, requestAction, sheetRole]
  );

  // Click outside: a click on the scroll runway but not on the panel.
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
      requestOutsideDismiss(e);
    },
    [requestOutsideDismiss]
  );
  // Backdrop is portalled into a sibling host so it stays fixed behind the
  // moving scroll runway. Its native composed path therefore cannot include
  // the runway; route that real outside click explicitly through the same
  // dismissal policy instead of dropping it at the path guard above.
  const onBackdropClick = useCallback(
    (event) => requestOutsideDismiss(event),
    [requestOutsideDismiss]
  );
  const onScrollPointerDown = useCallback((event) => {
    pointerDownTargetRef.current = event.target;
    movedRef.current = false;
    nativeInputObservedRef.current = true;
    lastNativeInputEventRef.current = event.nativeEvent ?? event;
    nativeObservationArmedRef.current = true;
    armDismissObserver();
  }, [armDismissObserver]);

  const ariaProps = {
    role: sheetRole,
    "aria-modal": modal ? true : undefined,
    "aria-labelledby": titleCount > 0 ? titleId : undefined,
    "aria-describedby": descriptionCount > 0 ? descriptionId : undefined,
  };
  const renderedViewBody = mapSlottedChildren(
    asChild,
    children,
    (authoredChildren) => (
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
        swipeTrapAxes={swipeTrapAxes}
        nativeEdgeSwipePrevention={nativeEdgeSwipePrevention}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPointerDown={onScrollPointerDown}
        onClick={onScrollClick}
        onBackdropClick={onBackdropClick}
      >
        {authoredChildren}
      </ViewInner>
    ),
    "Sheet.View"
  );

  return (
    <SheetScrollHandoffContext.Provider
      value={automaticTracks && !stableAutomaticTracks ? reportNestedScroll : null}
    >
      <Polymorph
        asChild={asChild}
        slotOwner="Sheet.View"
        ref={composedView}
        data-velvet="view"
        data-velvet-preview={isPreview ? "" : undefined}
        data-velvet-track={actualTrack}
        data-velvet-placement={placement}
        data-velvet-tracks={trackList.join(" ")}
        data-velvet-modal={modal ? "true" : "false"}
        data-velvet-scope={scopeId}
        data-velvet-parent-scope={parentScopeId || undefined}
        data-velvet-travel={travelStatus}
        data-velvet-dismiss-reason={lastDismissReason || undefined}
        data-velvet-dismiss-pending={dismissPending ? "true" : undefined}
        className={className}
        style={style}
        {...rest}
        id={renderedViewId}
        {...ariaProps}
      >
        {renderedViewBody}
      </Polymorph>
    </SheetScrollHandoffContext.Provider>
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
  swipeTrapAxes,
  nativeEdgeSwipePrevention,
  onScroll,
  onTouchStart,
  onTouchEnd,
  onPointerDown,
  onClick,
  onBackdropClick,
  children,
}) => {
  const backdropHostRef = useRef(null);
  const [host, setHost] = useState(null);
  useIso(() => setHost(backdropHostRef.current), []);
  const backdropHost = useMemo(
    () => ({ element: host, onClick: onBackdropClick }),
    [host, onBackdropClick]
  );
  return (
    <BackdropHostCtx.Provider value={backdropHost}>
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
        data-velvet-swipe-trap={[
          swipeTrapAxes.x ? "x" : null,
          swipeTrapAxes.y ? "y" : null,
        ].filter(Boolean).join(" ") || undefined}
        style={{
          overscrollBehaviorX: swipeTrapAxes.x ? "contain" : "auto",
          overscrollBehaviorY: swipeTrapAxes.y ? "contain" : "auto",
        }}
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
  {
    className,
    style,
    asChild,
    travelAnimation,
    onClick,
    ...rest
  },
  forwardedRef
) {
  const backdropHost = useContext(BackdropHostCtx);
  const host = backdropHost?.element;
  const ref = useRef(null);
  const composed = useComposedRefs(forwardedRef, ref);
  useTravel(ref, travelAnimation, DEFAULT_BACKDROP);

  if (!host) return null;
  return createPortal(
    <Polymorph
      asChild={asChild}
      slotOwner="Sheet.Backdrop"
      ref={composed}
      data-velvet="backdrop"
      className={className}
      style={style}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) backdropHost.onClick?.(event);
      }}
      {...rest}
    />,
    host
  );
});

// ---- Content --------------------------------------------------------------
const Content = forwardRef(function Content(
  {
    className,
    style,
    asChild,
    travelAnimation,
    stackingAnimation,
    children,
    tabIndex = -1,
    ...rest
  },
  forwardedRef
) {
  const ref = useRef(null);
  const composed = useComposedRefs(forwardedRef, ref);
  useTravel(ref, travelAnimation, null);
  useStacking(ref, stackingAnimation);
  return (
    <Polymorph
      asChild={asChild}
      slotOwner="Sheet.Content"
      ref={composed}
      data-velvet="content"
      className={className}
      style={style}
      tabIndex={tabIndex}
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
  {
    className,
    style,
    asChild,
    action = "step",
    disabled,
    onClick,
    children,
    "aria-label": ariaLabel,
    ...rest
  },
  forwardedRef
) {
  const { requestAction } = useSheetPart("Handle");
  const activate = (event) => {
    if (disabled) return;
    if (action === "close") {
      requestAction({
        type: "dismiss",
        detail: {
          reason: "close-trigger",
          nativeEvent: event?.nativeEvent ?? event,
        },
      });
      return;
    }
    const isStep = action === "step" || (action && action.type === "step");
    if (!isStep) return;
    const spec = action === "step" ? {} : action;
    requestAction({ type: "step", detent: spec.snapTo, direction: spec.direction });
  };
  const slottedAriaLabel =
    asChild && isValidElement(children)
      ? children.props["aria-label"]
      : undefined;
  return (
    <Polymorph
      as="button"
      asChild={asChild}
      slotOwner="Sheet.Handle"
      ref={forwardedRef}
      type="button"
      aria-label={
        ariaLabel ??
        slottedAriaLabel ??
        (action === "close" ? "Close" : "Step sheet")
      }
      data-velvet="handle"
      className={className}
      style={style}
      onClick={composeEventHandlers(onClick, activate)}
      aria-disabled={disabled || undefined}
      {...rest}
      disabled={disabled}
    >
      {children}
    </Polymorph>
  );
});

// ---- Trigger --------------------------------------------------------------
const Trigger = forwardRef(function Trigger(
  {
    className,
    style,
    asChild,
    action: actionProp,
    snapTo,
    children,
    onClick,
    onPress,
    disabled,
    __velvetFamily = "sheet",
    __velvetPart = "Trigger",
    ...rest
  },
  forwardedRef
) {
  const {
    requestAction,
    preview,
    presented,
    motionOriginRef,
    lastFocused,
    sheetRole,
    viewId,
  } = useSheetPart(__velvetPart, __velvetFamily);
  const action =
    actionProp !== undefined
      ? actionProp
      : snapTo !== undefined
        ? { type: "step", detent: snapTo }
        : "open";
  const activate = (e) => {
    if (disabled) return;
    const actionType = typeof action === "string" ? action : action?.type;
    const isStep = actionType === "step";
    if (actionType === "open") {
      lastFocused.current = e.currentTarget;
      motionOriginRef.current = captureElementGeometry(e.currentTarget);
      requestAction({
        type: "present",
        detail: { reason: "trigger", nativeEvent: e.nativeEvent ?? e },
      });
    } else if (actionType === "close") {
      const view = typeof document === "undefined" ? null : document.getElementById(viewId);
      if (
        isDevelopment &&
        view &&
        !isFrontmostDismissLayer(view)
      ) {
        console.warn(
          "[Velvet UI] VELVET_CLOSE_NOT_FRONTMOST: a close control targeted a layer " +
            "that is not frontmost. Close the active child layer first. " +
            "https://velvetui.co/errors/close-not-frontmost"
        );
      }
      requestAction({
        type: "dismiss",
        detail: { reason: "close-trigger", nativeEvent: e.nativeEvent ?? e },
      });
    } else if (isStep) {
      const spec = action === "step" ? {} : action;
      requestAction({
        type: "step",
        detent: spec.snapTo,
        direction: spec.direction,
      });
    } else {
      if (!presented) {
        lastFocused.current = e.currentTarget;
        motionOriginRef.current = captureElementGeometry(e.currentTarget);
      }
      requestAction({
        type: "toggle",
        detail: {
          reason: presented ? "close-trigger" : "trigger",
          nativeEvent: e.nativeEvent ?? e,
        },
      });
    }
  };
  const handle = composeEventHandlers(
    onClick,
    composeEventHandlers(onPress, activate)
  );
  const actionType = typeof action === "string" ? action : action?.type;
  const isOpeningAction =
    actionType === "open" ||
    actionType === "toggle";
  return (
    <Polymorph
      as="button"
      asChild={asChild}
      slotOwner={`${__velvetFamily === "lightbox" ? "Lightbox" : "Sheet"}.${__velvetPart}`}
      ref={forwardedRef}
      type="button"
      data-velvet-trigger=""
      data-velvet-action={actionType}
      data-velvet-preview-trigger={preview ? "" : undefined}
      className={className}
      style={style}
      onClick={handle}
      aria-disabled={disabled || undefined}
      aria-expanded={isOpeningAction ? presented : undefined}
      aria-controls={isOpeningAction ? viewId : undefined}
      aria-haspopup={isOpeningAction ? "dialog" : undefined}
      {...rest}
      disabled={disabled}
    >
      {children}
    </Polymorph>
  );
});

// Intent-revealing action conveniences. They intentionally reuse Trigger so
// focus, preview routing, polymorphism and event behavior stay identical.
const Close = forwardRef(function Close(
  { action: _action, snapTo: _snapTo, ...props },
  forwardedRef
) {
  return (
    <Trigger
      {...props}
      ref={forwardedRef}
      action="close"
      __velvetPart={props.__velvetPart ?? "Close"}
    />
  );
});

const Step = forwardRef(function Step(
  { action: _action, snapTo, direction, ...props },
  forwardedRef
) {
  return (
    <Trigger
      {...props}
      ref={forwardedRef}
      action={{ type: "step", snapTo, direction }}
      __velvetPart={props.__velvetPart ?? "Step"}
    />
  );
});

// ---- Title / Description --------------------------------------------------
const Title = forwardRef(function Title(
  {
    className,
    asChild,
    children,
    id: titleIdProp,
    __velvetFamily = "sheet",
    __velvetPart = "Title",
    ...rest
  },
  forwardedRef
) {
  const { setTitleId, generatedTitleId, registerTitle } = useSheetPart(
    __velvetPart,
    __velvetFamily
  );
  const renderedTitleId = titleIdProp ?? generatedTitleId;
  useIso(() => registerTitle(), [registerTitle]);
  useIso(() => setTitleId(renderedTitleId), [renderedTitleId, setTitleId]);
  return (
    <Polymorph as="h2" asChild={asChild} slotOwner={`${__velvetFamily === "lightbox" ? "Lightbox" : "Sheet"}.${__velvetPart}`} ref={forwardedRef} {...rest} id={renderedTitleId} className={className}>
      {children}
    </Polymorph>
  );
});

const Description = forwardRef(function Description(
  {
    className,
    asChild,
    children,
    id: descriptionIdProp,
    __velvetFamily = "sheet",
    __velvetPart = "Description",
    ...rest
  },
  forwardedRef
) {
  const { setDescriptionId, generatedDescriptionId, registerDescription } = useSheetPart(
    __velvetPart,
    __velvetFamily
  );
  const renderedDescriptionId = descriptionIdProp ?? generatedDescriptionId;
  useIso(() => registerDescription(), [registerDescription]);
  useIso(
    () => setDescriptionId(renderedDescriptionId),
    [renderedDescriptionId, setDescriptionId]
  );
  return (
    <Polymorph as="p" asChild={asChild} slotOwner={`${__velvetFamily === "lightbox" ? "Lightbox" : "Sheet"}.${__velvetPart}`} ref={forwardedRef} {...rest} id={renderedDescriptionId} className={className}>
      {children}
    </Polymorph>
  );
});

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

// Common-case composition. Behavioral props are routed only to View, portal
// props only to Portal, and the remaining DOM/component props to Content. The
// primitive parts remain available for layouts that need a different tree.
const Panel = forwardRef(function Panel(
  {
    children,
    side,
    snapPoints,
    modal,
    dismissible,
    draggable,
    portal = true,
    container,
    portalProps,
    view: viewSlot,
    viewProps,
    backdrop = true,
    backdropProps,
    handle = true,
    handleProps,
    contentProps: explicitContentProps,
    ...contentProps
  },
  forwardedRef
) {
  const { mounted } = useSheet();
  // Portal normally owns the mount/unmount gate. Preserve that exact
  // lifecycle when consumers opt into inline rendering so a closed panel
  // cannot leave a fixed scroll runway or backdrop in the document.
  if (!portal && !mounted) return null;

  const backdropNode =
    backdrop === false || backdrop == null
      ? null
      : backdrop === true
        ? <Backdrop {...backdropProps} />
        : isValidElement(backdrop) && backdrop.type === Backdrop
          ? cloneElement(backdrop, { ...backdropProps, ...backdrop.props })
          : (
              <Backdrop {...backdropProps} asChild>
                {backdrop}
              </Backdrop>
            );
  const handleNode =
    handle === false || handle == null
      ? null
      : handle === true
        ? <Handle {...handleProps} />
        : isValidElement(handle) && handle.type === Handle
          ? cloneElement(handle, { ...handleProps, ...handle.props })
          : (
              <Handle {...handleProps} asChild>
                {handle}
              </Handle>
            );
  const resolvedContentProps = {
    ...contentProps,
    ...explicitContentProps,
  };
  const renderedContentChildren = mapSlottedChildren(
    resolvedContentProps.asChild,
    children,
    (authoredChildren) => (
      <>
        {handleNode}
        {authoredChildren}
      </>
    ),
    "Sheet.Panel"
  );
  const contentNode = (
    <Content
      {...resolvedContentProps}
      ref={forwardedRef}
      data-velvet-panel=""
    >
      {renderedContentChildren}
    </Content>
  );
  const authoredViewChildren = (
    <>
      {backdropNode}
      {contentNode}
    </>
  );
  const renderedViewChildren = viewSlot
    ? mapSlottedChildren(
        true,
        viewSlot,
        (viewChildren) => (
          <>
            {viewChildren}
            {authoredViewChildren}
          </>
        ),
        "Sheet.Panel view slot"
      )
    : authoredViewChildren;
  const view = (
    <View
      side={side}
      snapPoints={snapPoints}
      modal={modal}
      dismissible={dismissible}
      draggable={draggable}
      {...viewProps}
      asChild={Boolean(viewSlot)}
    >
      {renderedViewChildren}
    </View>
  );

  if (!portal) return view;
  const portalContainer =
    container !== undefined ? container : portalProps?.container;
  return (
    <Portal {...portalProps} container={portalContainer}>
      {view}
    </Portal>
  );
});

const NestedPanel = forwardRef(function NestedPanel(
  { container, viewProps, ...props },
  forwardedRef
) {
  const nestedHostRef = useContext(NestedPortalContext);
  const resolvedContainer = container ?? nestedHostRef;
  if (isDevelopment && !resolvedContainer) {
    throw new Error(
      "[Velvet UI] Sheet.NestedPanel must be rendered inside Sheet.NestedPortalHost."
    );
  }
  return (
    <Panel
      {...props}
      ref={forwardedRef}
      container={resolvedContainer}
      viewProps={{
        ...viewProps,
        "data-velvet-nested": "",
        style: {
          ...viewProps?.style,
          position: "absolute",
          inset: 0,
        },
      }}
    />
  );
});

// A function is a valid React component and can also carry the familiar
// compound-part properties. This makes <Sheet> an additive Root shorthand
// while preserving Sheet.Root and every existing import/call site.
export const Sheet = Object.assign(Root, {
  Root,
  Portal,
  Panel,
  NestedPortalHost,
  NestedPanel,
  View,
  Backdrop,
  Content,
  BleedingBackground,
  Handle,
  Trigger,
  Close,
  Step,
  Title,
  Description,
  Outlet,
});

export { SheetPreviewEnvironment };
