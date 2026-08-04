import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { applyTravel } from "../core/travel.js";
import { SheetScopeContext } from "../core/sheetScope.js";

const useIso =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
const SheetContext = createContext(null);
const SheetPreviewContext = createContext(null);

export const useSheet = () => {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error(
      "Velvet Sheet sub-components must be used within <Sheet.Root>"
    );
  }
  return context;
};

export const SheetPreviewEnvironment = ({
  container,
  layers,
  onLayerPresentedChange,
  children,
}) => {
  const value = useMemo(
    () => ({ container, layers, onLayerPresentedChange }),
    [container, layers, onLayerPresentedChange]
  );
  return (
    <SheetPreviewContext.Provider value={value}>
      {children}
    </SheetPreviewContext.Provider>
  );
};

export const useTravel = (
  ref,
  travelAnimation,
  fallback,
  { register = true } = {}
) => {
  const { subscribeTravel, registerTravelAnimation } = useSheet();
  const animationRef = useRef(travelAnimation);
  animationRef.current = travelAnimation;
  useIso(
    () =>
      subscribeTravel(({ progress }, metadata = {}) => {
        if (metadata.waapi) return;
        const element = ref.current;
        const map = animationRef.current || fallback;
        if (element && map) applyTravel(element, map, progress, metadata);
      }),
    [subscribeTravel]
  );
  useIso(() => {
    if (!register) return undefined;
    return registerTravelAnimation({
      ref,
      getAnimation: () => animationRef.current || fallback,
    });
  }, [fallback, ref, register, registerTravelAnimation]);
};

export const useStacking = (ref, stackingAnimation) => {
  const { subscribeStacking, registerStackingAnimation } = useSheet();
  const animationRef = useRef(stackingAnimation);
  animationRef.current = stackingAnimation;
  useIso(
    () =>
      subscribeStacking((progress, { waapi } = {}) => {
        if (waapi) return;
        const element = ref.current;
        if (element && animationRef.current) {
          applyTravel(element, animationRef.current, progress);
        }
      }),
    [subscribeStacking]
  );
  useIso(
    () =>
      registerStackingAnimation({
        ref,
        getAnimation: () => animationRef.current,
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
      onChange?.(resolved);
    },
    [isControlled, onChange, value]
  );
  return [value, setValue];
};

export const SheetRoot = ({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  snap,
  defaultSnap,
  onSnapChange,
  sheetRole = "dialog",
}) => {
  const parentSheet = useContext(SheetContext);
  const preview = useContext(SheetPreviewContext);
  const depth = (parentSheet?.depth ?? -1) + 1;
  const controlledPresented = preview
    ? Boolean(preview.layers?.[depth])
    : open;
  const controlledPresentedChange = preview
    ? (next) => preview.onLayerPresentedChange?.(depth, next)
    : onOpenChange;
  const [presented, setPresented] = useControllable(
    controlledPresented,
    defaultOpen,
    controlledPresentedChange
  );
  const [activeDetent, setActiveDetent] = useControllable(
    snap,
    defaultSnap ?? (defaultOpen ? 1 : 0),
    onSnapChange
  );
  const [mounted, setMounted] = useState(presented);
  const presentedRef = useRef(presented);
  presentedRef.current = presented;
  useEffect(() => {
    if (presented) setMounted(true);
  }, [presented]);

  const travelListeners = useRef(new Set());
  const travelAnimations = useRef(new Set());
  const lastTravel = useRef({
    payload: {
      progress: presented ? 1 : 0,
      range: { start: presented ? 1 : 0, end: presented ? 1 : 0 },
      progressAtDetents: [0, 1],
    },
    metadata: {},
  });
  const emitTravel = useCallback((payload, metadata) => {
    lastTravel.current = { payload, metadata: metadata || {} };
    travelListeners.current.forEach((listener) =>
      listener(payload, metadata)
    );
  }, []);
  const subscribeTravel = useCallback((listener) => {
    travelListeners.current.add(listener);
    listener(lastTravel.current.payload, lastTravel.current.metadata);
    return () => travelListeners.current.delete(listener);
  }, []);
  const registerTravelAnimation = useCallback((entry) => {
    travelAnimations.current.add(entry);
    return () => travelAnimations.current.delete(entry);
  }, []);
  const getTravelAnimations = useCallback(
    () => [...travelAnimations.current],
    []
  );

  const stackingListeners = useRef(new Set());
  const stackingAnimations = useRef(new Set());
  const emitStacking = useCallback((progress, metadata) => {
    stackingListeners.current.forEach((listener) =>
      listener(progress, metadata)
    );
  }, []);
  const subscribeStacking = useCallback((listener) => {
    stackingListeners.current.add(listener);
    return () => stackingListeners.current.delete(listener);
  }, []);
  const registerStackingAnimation = useCallback((entry) => {
    stackingAnimations.current.add(entry);
    return () => stackingAnimations.current.delete(entry);
  }, []);
  const getStackingAnimations = useCallback(
    () => [...stackingAnimations.current],
    []
  );

  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const generatedViewId = useId();
  const [titleId, setTitleId] = useState(generatedTitleId);
  const [descriptionId, setDescriptionId] = useState(generatedDescriptionId);
  const [viewId, setViewId] = useState(generatedViewId);
  const scopeId = useId();
  const [titleCount, setTitleCount] = useState(0);
  const [descriptionCount, setDescriptionCount] = useState(0);
  const registerTitle = useCallback(() => {
    setTitleCount((count) => count + 1);
    return () => setTitleCount((count) => Math.max(0, count - 1));
  }, []);
  const registerDescription = useCallback(() => {
    setDescriptionCount((count) => count + 1);
    return () =>
      setDescriptionCount((count) => Math.max(0, count - 1));
  }, []);
  const detentCount = useRef(1);
  const lastFocused = useRef(null);
  const actionDispatcherRef = useRef(null);
  const motionOriginRef = useRef(null);
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
      else if (action.direction === "down") {
        next = current <= 1 ? count : current - 1;
      } else {
        next = current >= count ? 1 : current + 1;
      }
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

  const context = useMemo(
    () => ({
      presented,
      setPresented,
      activeDetent,
      setActiveDetent,
      mounted,
      finishExit: () => {
        if (!presentedRef.current) {
          setMounted(false);
          setActiveDetent(
            defaultSnap ?? (defaultOpen ? 1 : 0)
          );
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
      setTitleId,
      generatedTitleId,
      descriptionId,
      setDescriptionId,
      generatedDescriptionId,
      viewId,
      setViewId,
      generatedViewId,
      scopeId,
      titleCount,
      descriptionCount,
      registerTitle,
      registerDescription,
      detentCount,
      lastFocused,
      actionDispatcherRef,
      motionOriginRef,
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
      generatedTitleId,
      descriptionId,
      generatedDescriptionId,
      viewId,
      generatedViewId,
      scopeId,
      titleCount,
      descriptionCount,
      registerTitle,
      registerDescription,
      defaultSnap,
      defaultOpen,
      performAction,
      requestAction,
      preview,
      depth,
    ]
  );

  return (
    <SheetScopeContext.Provider value={scopeId}>
      <SheetContext.Provider value={context}>
        {children}
      </SheetContext.Provider>
    </SheetScopeContext.Provider>
  );
};
