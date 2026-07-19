import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Polymorph } from "./core/Slot.jsx";
import { useComposedRefs } from "./core/refs.js";
import { applyTravel } from "./core/travel.js";

const SheetStackCtx = createContext(null);
export const useSheetStack = () => useContext(SheetStackCtx);
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// ---- Root: tracks the ordered stack and fans out progress ----
const Root = forwardRef(function SheetStackRoot(
  { children, asChild, className, style, componentId, ...rest },
  ref
) {
  const stack = useRef([]); // ordered [{ id, progress, getStackingAnimations }], last = frontmost
  const aboveSubs = useRef(new Map()); // id -> Set(fn(accumulatedAboveProgress, metadata))
  const stackSubs = useRef(new Set()); // fn(topProgress)
  const outletAnimations = useRef(new Set());

  const notify = useCallback((metadata) => {
    const s = stack.current;
    s.forEach((entry, i) => {
      const above = s.slice(i + 1).reduce((sum, item) => sum + item.progress, 0);
      const subs = aboveSubs.current.get(entry.id);
      if (subs) subs.forEach((fn) => fn(above, metadata));
    });
    const total = s.reduce((sum, entry) => sum + entry.progress, 0);
    stackSubs.current.forEach((fn) => fn(total, metadata));
  }, []);

  const ctx = useMemo(
    () => ({
      register(id, { getStackingAnimations } = {}) {
        const entry = { id, progress: 0, getStackingAnimations };
        stack.current.push(entry);
        return {
          update(p, metadata) {
            entry.progress = p;
            notify(metadata);
          },
          unregister() {
            stack.current = stack.current.filter((e) => e !== entry);
            notify();
          },
        };
      },
      subscribeAbove(id, fn) {
        let set = aboveSubs.current.get(id);
        if (!set) {
          set = new Set();
          aboveSubs.current.set(id, set);
        }
        set.add(fn);
        return () => set.delete(fn);
      },
      subscribeStack(fn) {
        stackSubs.current.add(fn);
        return () => stackSubs.current.delete(fn);
      },
      registerOutletAnimation(entry) {
        outletAnimations.current.add(entry);
        return () => outletAnimations.current.delete(entry);
      },
      // Return every stacking animation below `id`, together with the travel
      // already accumulated above that target. During a programmatic travel
      // the active sheet's sampled progress is added to this baseline, exactly
      // like the native stacking callback path.
      getAnimationsBelow(id) {
        const entries = stack.current;
        const activeIndex = entries.findIndex((entry) => entry.id === id);
        if (activeIndex < 0) return [];
        const animations = [];

        const outletBaseline = entries.reduce(
          (sum, entry, index) => sum + (index === activeIndex ? 0 : entry.progress),
          0
        );
        outletAnimations.current.forEach((animation) => {
          animations.push({ ...animation, baseline: outletBaseline });
        });

        for (let targetIndex = 0; targetIndex < activeIndex; targetIndex++) {
          const baseline = entries.reduce(
            (sum, entry, index) =>
              index > targetIndex && index !== activeIndex ? sum + entry.progress : sum,
            0
          );
          entries[targetIndex].getStackingAnimations?.().forEach((animation) => {
            animations.push({ ...animation, baseline });
          });
        }
        return animations;
      },
    }),
    [notify]
  );

  return (
    <SheetStackCtx.Provider value={ctx}>
      <Polymorph asChild={asChild} ref={ref} data-velvet="sheet-stack" className={className} style={style} {...rest}>
        {children}
      </Polymorph>
    </SheetStackCtx.Provider>
  );
});

// ---- Outlet: animates from the overall stack progress (e.g. a backing layer) ----
const Outlet = forwardRef(function SheetStackOutlet(
  { asChild, className, style, stackingAnimation, children, ...rest },
  ref
) {
  const stack = useContext(SheetStackCtx);
  const localRef = useRef(null);
  const composed = useComposedRefs(ref, localRef);
  const animRef = useRef(stackingAnimation);
  animRef.current = stackingAnimation;
  useIso(() => {
    if (!stack) return;
    return stack.subscribeStack((progress, { waapi } = {}) => {
      if (waapi) return;
      const el = localRef.current;
      if (el && animRef.current) applyTravel(el, animRef.current, progress);
    });
  }, [stack]);
  useIso(() => {
    if (!stack) return;
    return stack.registerOutletAnimation({
      ref: localRef,
      getAnimation: () => animRef.current,
    });
  }, [stack]);
  return (
    <Polymorph asChild={asChild} ref={composed} data-velvet="sheet-stack-outlet" className={className} style={style} {...rest}>
      {children}
    </Polymorph>
  );
});

export const SheetStack = { Root, Outlet };
