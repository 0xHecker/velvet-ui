import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Polymorph } from "./core/Slot.jsx";
import { useComposedRefs } from "./core/refs.js";
import { applyTravel } from "./core/travel.js";

const SheetStackCtx = createContext(null);
export const useSheetStack = () => useContext(SheetStackCtx);

// ---- Root: tracks the ordered stack and fans out progress ----
const Root = forwardRef(function SheetStackRoot(
  { children, asChild, className, style, componentId, ...rest },
  ref
) {
  const stack = useRef([]); // ordered [{ id, progress }], last = frontmost
  const aboveSubs = useRef(new Map()); // id -> Set(fn(aboveProgress))
  const stackSubs = useRef(new Set()); // fn(topProgress)

  const notify = useCallback(() => {
    const s = stack.current;
    s.forEach((entry, i) => {
      const above = i < s.length - 1 ? s[i + 1].progress : 0;
      const subs = aboveSubs.current.get(entry.id);
      if (subs) subs.forEach((fn) => fn(above));
    });
    const top = s.length ? s[s.length - 1].progress : 0;
    stackSubs.current.forEach((fn) => fn(top));
  }, []);

  const ctx = useMemo(
    () => ({
      register(id) {
        const entry = { id, progress: 0 };
        stack.current.push(entry);
        return {
          update(p) {
            entry.progress = p;
            notify();
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
  useEffect(() => {
    if (!stack) return;
    return stack.subscribeStack((progress) => {
      const el = localRef.current;
      if (el && animRef.current) applyTravel(el, animRef.current, progress);
    });
  }, [stack]);
  return (
    <Polymorph asChild={asChild} ref={composed} data-velvet="sheet-stack-outlet" className={className} style={style} {...rest}>
      {children}
    </Polymorph>
  );
});

export const SheetStack = { Root, Outlet };
