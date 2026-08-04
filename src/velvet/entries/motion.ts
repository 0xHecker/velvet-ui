import {
  SPRING_PRESETS as springPresetsRuntime,
  decimateSpring as decimateSpringRuntime,
  linearEasingFromSamples as linearEasingFromSamplesRuntime,
  prefersReducedMotion as prefersReducedMotionRuntime,
  sampleSpring as sampleSpringRuntime,
  springEasing as springEasingRuntime,
} from "../core/spring.js";
import {
  animate as animateRuntime,
  resolveTiming as resolveMotionTimingRuntime,
} from "../core/waapi.js";
import {
  applyTravel as applyTravelStylesRuntime,
  travelStyles as resolveTravelStylesRuntime,
} from "../core/travel.js";

export const SPRING_PRESETS = springPresetsRuntime as {
  readonly gentle: { readonly stiffness: 560; readonly damping: 68; readonly mass: 1.85 };
  readonly smooth: { readonly stiffness: 580; readonly damping: 60; readonly mass: 1.35 };
  readonly snappy: { readonly stiffness: 350; readonly damping: 34; readonly mass: 0.9 };
  readonly brisk: { readonly stiffness: 350; readonly damping: 28; readonly mass: 0.65 };
  readonly bouncy: { readonly stiffness: 240; readonly damping: 19; readonly mass: 0.7 };
  readonly elastic: { readonly stiffness: 260; readonly damping: 20; readonly mass: 1 };
};

export type SpringPreset = keyof typeof SPRING_PRESETS;
export type MotionEasing =
  | "spring"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "linear"
  | (string & {});

export interface SpringSettings {
  preset?: SpringPreset;
  easing?: MotionEasing;
  stiffness?: number;
  damping?: number;
  mass?: number;
  precision?: number;
  initialVelocity?: number;
  duration?: number;
  delay?: number;
  /** `auto` follows the current media query; `never` explicitly opts out. */
  skip?: boolean | "auto" | "never";
}

export type MotionSettings = SpringPreset | SpringSettings;

export interface SpringSampleOptions {
  from?: number;
  to?: number;
  v0?: number;
}

export interface SpringSample {
  values: number[];
  duration: number;
}

export interface MotionTiming {
  duration: number;
  easing: string;
}

export type MotionPlaybackStatus = "finished" | "cancelled" | "skipped";

export interface MotionPlayback {
  readonly animation: Animation | null;
  /** Always resolves, including after normal interruption or cancellation. */
  readonly finished: Promise<MotionPlaybackStatus>;
  cancel(): void;
  finish(): void;
  pause(): void;
  play(): void;
  reverse(): void;
}

export interface MotionPlaybackDetail {
  status: MotionPlaybackStatus;
  animation: Animation | null;
}

export interface MotionOptions extends SpringSettings {
  /**
   * Animations with the same id on one element interrupt each other.
   * Pass false only when concurrent effects are intentional.
   */
  id?: string | number | false | null;
  /** Persist the authored final keyframe as inline styles. Defaults to true. */
  commit?: boolean;
  endDelay?: number;
  fill?: FillMode;
  iterationStart?: number;
  iterations?: number;
  direction?: PlaybackDirection;
  composite?: CompositeOperation;
  iterationComposite?: IterationCompositeOperation;
  onFinish?: (detail: MotionPlaybackDetail) => void;
  onCancel?: (detail: MotionPlaybackDetail) => void;
}

export type TravelPrimitive = string | number;
export interface TravelContext {
  progress: number;
  tween(from: TravelPrimitive, to: TravelPrimitive): string;
  [name: string]: unknown;
}
export type TravelValue =
  | TravelPrimitive
  | false
  | null
  | readonly [TravelPrimitive, TravelPrimitive]
  | ((context: TravelContext) => TravelPrimitive | null | undefined);
export type TravelAnimation =
  | Record<string, TravelValue>
  | { properties: Record<string, TravelValue> };

export interface ResolveTravelContext {
  onError?: (
    error: unknown,
    detail: { property: string; progress: number },
  ) => void;
  [name: string]: unknown;
}

export const sampleSpring = sampleSpringRuntime as (
  settings?: MotionSettings,
  options?: SpringSampleOptions,
) => SpringSample;
export const springEasing = springEasingRuntime as (
  settings?: MotionSettings,
  options?: SpringSampleOptions,
) => MotionTiming;
export const resolveMotionTiming = resolveMotionTimingRuntime as (
  settings?: MotionSettings,
) => MotionTiming;
export const prefersReducedMotion = prefersReducedMotionRuntime as (
  target?: Element | Document | Window | null,
) => boolean;
export const linearEasingFromSamples = linearEasingFromSamplesRuntime as (
  values: readonly number[],
) => string;
export const decimateSpring = decimateSpringRuntime as (
  values: readonly number[],
  amount?: number,
) => number[];
export const animate = animateRuntime as (
  element: Element | null | undefined,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: MotionOptions,
) => MotionPlayback;
export const resolveTravelStyles = resolveTravelStylesRuntime as (
  animation: TravelAnimation | null | undefined,
  progress: number,
  context?: ResolveTravelContext,
) => Record<string, string>;
export const applyTravelStyles = applyTravelStylesRuntime as (
  element: HTMLElement | SVGElement | null | undefined,
  animation: TravelAnimation | null | undefined,
  progress: number,
  context?: ResolveTravelContext,
) => Record<string, string>;
