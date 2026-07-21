import * as React from "react";

export * from "./sheet.js";
export * from "./toast.js";

import type { SpringPreset, SpringSettings } from "./sheet.js";

export interface ScrollProgress {
  progress: number;
  distance: number;
  availableDistance: number;
}

export interface ScrollActionOptions {
  distance?: number;
  progress?: number;
  animationSettings?: SpringPreset | ScrollSpringSettings;
}

export interface ScrollSpringSettings
  extends Omit<SpringSettings, "easing" | "duration"> {
  easing?: "spring";
}

export interface ScrollApi {
  getProgress(): number;
  getDistance(): number;
  getAvailableDistance(): number;
  scrollTo(options?: ScrollActionOptions): void;
  scrollBy(options?: ScrollActionOptions): void;
}

interface PolymorphicDivProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export interface ScrollRootProps extends PolymorphicDivProps {
  componentRef?: React.Ref<ScrollApi>;
}
export interface ScrollViewProps extends PolymorphicDivProps {
  axis?: "x" | "y";
  safeArea?: "none" | "layout-viewport" | "visual-viewport";
  scrollGestureTrap?: boolean | string;
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
export interface ScrollTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  action?: ({ type: "scroll-to" } | { type: "scroll-by" }) & ScrollActionOptions;
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
}

type DivPart<P = PolymorphicDivProps> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<HTMLDivElement>
>;

export const Scroll: {
  Root: DivPart<ScrollRootProps>;
  View: DivPart<ScrollViewProps>;
  Content: DivPart;
  Trigger: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<ScrollTriggerProps> & React.RefAttributes<HTMLButtonElement>
  >;
};

type GenericPart = React.ForwardRefExoticComponent<
  PolymorphicDivProps & React.RefAttributes<HTMLElement>
>;

export const VisuallyHidden: { Root: GenericPart };
export const AutoFocusTarget: GenericPart;
export const Fixed: GenericPart;
export const Island: GenericPart;
export const ExternalOverlay: { Root: GenericPart };

export function createComponentId<T = unknown>(): React.Context<T | null>;
export function useClientMediaQuery(query: string): boolean;
export function updateThemeColor(color: string): void;
export function useThemeColorDimmingOverlay(options?: {
  elementRef?: React.RefObject<HTMLElement | null>;
  dimmingColor?: string;
}): {
  setDimmingOverlayOpacity(opacity: number): void;
  animateDimmingOverlayOpacity(options: {
    keyframes: readonly [number, number];
    duration?: number;
  }): void;
};
