import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { animate } from "./core/waapi.js";
import { springEasing } from "./core/spring.js";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

const mediaQuery = () => {
  try {
    return typeof window === "undefined"
      ? null
      : window.matchMedia(reducedMotionQuery);
  } catch {
    return null;
  }
};

const subscribeToReducedMotion = (notify) => {
  const query = mediaQuery();
  if (!query) return () => {};
  query.addEventListener?.("change", notify);
  return () => query.removeEventListener?.("change", notify);
};

const reducedMotionSnapshot = () => Boolean(mediaQuery()?.matches);

/**
 * Hydration-safe reduced motion preference that remains subscribed after the
 * first render. The server snapshot is deliberately false.
 */
export const useReducedMotion = () =>
  useSyncExternalStore(subscribeToReducedMotion, reducedMotionSnapshot, () => false);

/**
 * Returns Velvet's safe `animate` function with lifecycle ownership. Every
 * playback created by this hook is cancelled on unmount; calls using the same
 * element and id interrupt one another through the platform animation list.
 */
export const useAnimate = () => {
  const playbacks = useRef(new Set());

  useEffect(
    () => () => {
      for (const playback of playbacks.current) playback.cancel();
      playbacks.current.clear();
    },
    []
  );

  return useCallback((element, keyframes, options) => {
    const playback = animate(element, keyframes, options);
    playbacks.current.add(playback);
    playback.finished.then(() => playbacks.current.delete(playback));
    return playback;
  }, []);
};

/**
 * Memoizes the sampled CSS `linear()` easing and duration for React consumers.
 * Prefer a stable settings object when providing custom physics.
 */
export const useSpringEasing = (settings, options) =>
  useMemo(
    () => springEasing(settings, options),
    [
      settings,
      options?.from,
      options?.to,
      options?.v0,
    ]
  );
