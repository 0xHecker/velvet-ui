import * as React from "react";
import { Scroll as scrollRuntime } from "../Scroll.jsx";
import { VisuallyHidden as visuallyHiddenRuntime } from "../VisuallyHidden.jsx";
import { AutoFocusTarget as autoFocusTargetRuntime } from "../AutoFocusTarget.jsx";
import { Fixed as fixedRuntime } from "../Fixed.jsx";
import { Island as islandRuntime } from "../Island.jsx";
import { ExternalOverlay as externalOverlayRuntime } from "../ExternalOverlay.jsx";
import {
  updateThemeColor as updateThemeColorRuntime,
  useClientMediaQuery as useClientMediaQueryRuntime,
  useThemeColorDimmingOverlay as useThemeColorDimmingOverlayRuntime,
} from "../core/hooks.js";
import type { MotionSettings } from "./motion.js";

export interface UtilityProps<T extends HTMLElement = HTMLDivElement>
  extends React.HTMLAttributes<T> {
  asChild?: boolean;
}

type UtilityPart<T extends HTMLElement = HTMLDivElement> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<UtilityProps<T>> & React.RefAttributes<T>
  >;

export interface ScrollProgress {
  progress: number;
  distance: number;
  availableDistance: number;
}

export interface ScrollActionOptions {
  distance?: number;
  progress?: number;
  animationSettings?: MotionSettings;
}

export interface ScrollApi {
  getProgress(): number;
  getDistance(): number;
  getAvailableDistance(): number;
  scrollTo(options?: ScrollActionOptions): void;
  scrollBy(options?: ScrollActionOptions): void;
}

export interface ScrollRootProps extends UtilityProps<HTMLDivElement> {
  componentRef?: React.Ref<ScrollApi>;
}

export interface ScrollViewProps extends UtilityProps<HTMLDivElement> {
  axis?: "x" | "y";
  safeArea?: "none" | "layout-viewport" | "visual-viewport";
  /**
   * Contains overscroll inside this view. Do not enable it on page-sized
   * content in a left/right Sheet when swipe-back should remain available.
   */
  scrollGestureTrap?: boolean | { x?: boolean; y?: boolean };
  /**
   * Set false to contain overscroll, equivalent to scrollGestureTrap. Leave at
   * the default true when a parent Sheet should receive a boundary gesture.
   */
  scrollGestureOvershoot?: boolean;
  onScrollProgress?: (progress: ScrollProgress & ScrollApi) => void;
  onFocusInside?:
    | { scrollIntoView?: boolean }
    | ((event: {
        nativeEvent: FocusEvent;
        changeDefault(next: { scrollIntoView?: boolean }): void;
      }) => void);
  nativeFocusScrollPrevention?: boolean;
}

export interface ScrollContentProps extends UtilityProps<HTMLDivElement> {}

export interface ScrollTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  action?: ({ type: "scroll-to" } | { type: "scroll-by" }) &
    ScrollActionOptions;
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Scroll = scrollRuntime as {
  Root: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ScrollRootProps> &
      React.RefAttributes<HTMLDivElement>
  >;
  View: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ScrollViewProps> &
      React.RefAttributes<HTMLDivElement>
  >;
  Content: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ScrollContentProps> &
      React.RefAttributes<HTMLDivElement>
  >;
  Trigger: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ScrollTriggerProps> &
      React.RefAttributes<HTMLButtonElement>
  >;
};

export const VisuallyHidden = visuallyHiddenRuntime as {
  Root: UtilityPart<HTMLElement>;
};
export const AutoFocusTarget =
  autoFocusTargetRuntime as UtilityPart<HTMLElement>;
export const Fixed = fixedRuntime as UtilityPart<HTMLElement>;
export const Island = islandRuntime as UtilityPart<HTMLElement>;
export const ExternalOverlay = externalOverlayRuntime as {
  Root: UtilityPart<HTMLElement>;
};

export const useClientMediaQuery =
  useClientMediaQueryRuntime as (query: string) => boolean;
export const updateThemeColor =
  updateThemeColorRuntime as (color: string) => void;
export const useThemeColorDimmingOverlay =
  useThemeColorDimmingOverlayRuntime as (options?: {
    elementRef?: React.RefObject<HTMLElement | null>;
    dimmingColor?: string;
    applyToElement?: boolean;
  }) => {
    setDimmingOverlayOpacity(opacity: number): void;
    animateDimmingOverlayOpacity(options: {
      keyframes: readonly [number, number];
      duration?: number;
    }): void;
  };
