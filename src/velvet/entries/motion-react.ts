import {
  useAnimate as useAnimateRuntime,
  useReducedMotion as useReducedMotionRuntime,
  useSpringEasing as useSpringEasingRuntime,
} from "../motion-react.js";
import type {
  MotionOptions,
  MotionPlayback,
  MotionSettings,
  MotionTiming,
  SpringSampleOptions,
} from "./motion.js";

export const useReducedMotion = useReducedMotionRuntime as () => boolean;
export const useAnimate = useAnimateRuntime as () => (
  element: Element | null | undefined,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: MotionOptions,
) => MotionPlayback;
export const useSpringEasing = useSpringEasingRuntime as (
  settings?: MotionSettings,
  options?: SpringSampleOptions,
) => MotionTiming;
