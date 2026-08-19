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
const isDevelopment = import.meta.env?.DEV === true;
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

const familyLabel = (family) => (family === "lightbox" ? "Lightbox" : "Sheet");

// Public compound parts use this stricter hook so a visually plausible but
// contextually invalid composition fails at the authoring site in development.
export const useSheetPart = (part, expectedFamily = "sheet") => {
  const context = useContext(SheetContext);
  const expectedLabel = familyLabel(expectedFamily);
  if (!context) {
    throw new Error(
      `[Velvet UI] ${expectedLabel}.${part} must be rendered under ${expectedLabel}.Root.`
    );
  }
  if (isDevelopment && context.componentFamily !== expectedFamily) {
    const actualLabel = familyLabel(context.componentFamily);
    throw new Error(
      `[Velvet UI] ${expectedLabel}.${part} must be rendered under ${expectedLabel}.Root. ` +
        `This element is currently inside ${actualLabel}.Root; use ${actualLabel}.${part} instead.`
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
    (next, detail) => {
      const resolved = typeof next === "function" ? next(value) : next;
      if (!isControlled) setUncontrolled(resolved);
      onChange?.(resolved, detail);
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
  onDismissRequest,
  onEnterComplete,
  onExitComplete,
  initialFocusRef,
  restoreFocusRef,
  snap,
  defaultSnap,
  onSnapChange,
  sheetRole = "dialog",
  componentFamily = "sheet",
}) => {
  const parentSheet = useContext(SheetContext);
  const preview = useContext(SheetPreviewContext);
  const depth = (parentSheet?.depth ?? -1) + 1;
  const controlledPresented = preview
    ? Boolean(preview.layers?.[depth])
    : open;
  const controlledPresentedChange = preview
    ? (next, detail) => preview.onLayerPresentedChange?.(depth, next, detail)
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
  const onDismissRequestRef = useRef(onDismissRequest);
  const onEnterCompleteRef = useRef(onEnterComplete);
  const onExitCompleteRef = useRef(onExitComplete);
  onDismissRequestRef.current = onDismissRequest;
  onEnterCompleteRef.current = onEnterComplete;
  onExitCompleteRef.current = onExitComplete;
  const enterCompletedRef = useRef(false);
  const exitCompletedRef = useRef(!presented);
  const dismissRequestRef = useRef(null);
  const [dismissPending, setDismissPending] = useState(false);
  const [lastDismissReason, setLastDismissReason] = useState(null);
  useEffect(() => {
    if (presented) {
      setMounted(true);
      exitCompletedRef.current = false;
    }
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

  const finishEnter = useCallback(() => {
    if (!presentedRef.current || enterCompletedRef.current) return;
    enterCompletedRef.current = true;
    onEnterCompleteRef.current?.();
  }, []);

  const finishExit = useCallback(() => {
    if (presentedRef.current || exitCompletedRef.current) return;
    exitCompletedRef.current = true;
    enterCompletedRef.current = false;
    setMounted(false);
    setActiveDetent(defaultSnap ?? (defaultOpen ? 1 : 0));
    onExitCompleteRef.current?.();
  }, [defaultOpen, defaultSnap, setActiveDetent]);

  const performAction = useCallback(
    (action, stateOverride) => {
      const state = { ...actionStateRef.current, ...stateOverride };
      if (action.type === "present") {
        setPresented(true, action.detail ?? { reason: "programmatic" });
        return true;
      }
      if (action.type === "dismiss") {
        const detail = action.detail ?? { reason: "programmatic" };
        setLastDismissReason(detail.reason);
        setPresented(false, detail);
        return true;
      }
      if (action.type === "toggle") {
        const detail = action.detail ?? { reason: "programmatic" };
        if (state.presented) setLastDismissReason(detail.reason);
        setPresented((value) => !value, detail);
        return true;
      }
      if (action.type !== "step") return false;
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
        const detail = action.detail ?? { reason: "programmatic" };
        setLastDismissReason(detail.reason);
        setPresented(false, detail);
        return true;
      }
      if (!state.presented) {
        setPresented(true, action.detail ?? { reason: "programmatic" });
      }
      setActiveDetent(next);
      return true;
    },
    [setActiveDetent, setPresented]
  );

  const dispatchAction = useCallback(
    (action) => {
      const dispatch = actionDispatcherRef.current;
      const result = dispatch ? dispatch(action) : performAction(action);
      return result !== false;
    },
    [performAction]
  );

  const requestAction = useCallback(
    (action) => {
      if (action.type !== "dismiss") return dispatchAction(action);

      const detail = action.detail ?? { reason: "programmatic" };
      const dismissal = { ...action, detail };
      const commit = () =>
        action.deferCommit ? true : dispatchAction(dismissal);
      setLastDismissReason(detail.reason);
      if (dismissRequestRef.current) return dismissRequestRef.current;

      const request = onDismissRequestRef.current;
      if (!request) return commit();

      let result;
      try {
        result = request(detail);
      } catch (error) {
        if (isDevelopment) {
          console.error("[Velvet UI] onDismissRequest threw; dismissal was rejected.", error);
        }
        return false;
      }

      if (!result || typeof result.then !== "function") {
        return result === false ? false : commit();
      }

      setDismissPending(true);
      const pending = Promise.resolve(result)
        .then(
          (allowed) => (allowed === false ? false : commit()),
          (error) => {
            if (isDevelopment) {
              console.error(
                "[Velvet UI] onDismissRequest rejected; dismissal was rejected.",
                error
              );
            }
            return false;
          }
        )
        .finally(() => {
          if (dismissRequestRef.current === pending) {
            dismissRequestRef.current = null;
            setDismissPending(false);
          }
        });
      dismissRequestRef.current = pending;
      return pending;
    },
    [dispatchAction]
  );

  const context = useMemo(
    () => ({
      presented,
      setPresented,
      activeDetent,
      setActiveDetent,
      mounted,
      finishEnter,
      finishExit,
      sheetRole,
      componentFamily,
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
      parentScopeId: parentSheet?.scopeId ?? null,
      titleCount,
      descriptionCount,
      registerTitle,
      registerDescription,
      detentCount,
      lastFocused,
      initialFocusRef,
      restoreFocusRef,
      dismissPending,
      lastDismissReason,
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
      finishEnter,
      finishExit,
      sheetRole,
      componentFamily,
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
      parentSheet?.scopeId,
      titleCount,
      descriptionCount,
      registerTitle,
      registerDescription,
      initialFocusRef,
      restoreFocusRef,
      dismissPending,
      lastDismissReason,
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
