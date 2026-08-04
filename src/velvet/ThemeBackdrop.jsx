import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { Sheet } from "./Sheet.jsx";
import { useComposedRefs } from "./core/refs.js";
import { travelStyles } from "./core/travel.js";
import { useThemeColorDimmingOverlay } from "./core/hooks.js";
import { useSheet } from "./internal/SheetState.jsx";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const DEFAULT_BACKDROP = {
  opacity: ({ progress }) => Math.min(progress * 0.45, 0.45),
};

export const ThemeBackdrop = forwardRef(function ThemeBackdrop(
  {
    themeColor = "auto",
    travelAnimation,
    ...props
  },
  forwardedRef
) {
  const { subscribeTravel } = useSheet();
  const ref = useRef(null);
  const composed = useComposedRefs(forwardedRef, ref);
  const dimmingColor =
    typeof themeColor === "string" && themeColor !== "auto"
      ? themeColor
      : "rgb(0,0,0)";
  const { setDimmingOverlayOpacity } = useThemeColorDimmingOverlay({
    dimmingColor,
    applyToElement: false,
  });
  const setOpacityRef = useRef(setDimmingOverlayOpacity);
  setOpacityRef.current = setDimmingOverlayOpacity;

  useIso(() => {
    const unsubscribe = subscribeTravel(({ progress }) => {
      const authored = travelStyles(
        travelAnimation || DEFAULT_BACKDROP,
        progress
      ).opacity;
      let opacity = Number.parseFloat(authored ?? "");
      if (!Number.isFinite(opacity) && ref.current) {
        opacity = Number.parseFloat(getComputedStyle(ref.current).opacity);
      }
      setOpacityRef.current(Number.isFinite(opacity) ? opacity : 0);
    });
    return () => {
      unsubscribe();
      setOpacityRef.current(0);
    };
  }, [subscribeTravel, travelAnimation]);

  return (
    <Sheet.Backdrop
      ref={composed}
      travelAnimation={travelAnimation}
      {...props}
    />
  );
});
