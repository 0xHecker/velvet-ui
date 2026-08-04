import * as React from "react";
import {
  depthSheetDefaultTokens as depthSheetDefaultTokensRuntime,
  depthSheetStackingAnimation as depthSheetStackingAnimationRuntime,
  depthSheetVariables as depthSheetVariablesRuntime,
  DepthSheet as depthSheetRuntime,
} from "../DepthSheet.jsx";
import type {
  PrimitiveProps,
  SheetBackdropProps,
  SheetComponent,
  SheetComposedViewProps,
  SheetContentProps,
  SheetHandleProps,
  SheetPartSlot,
  SheetPortalProps,
  SheetRootProps,
  SheetStackOutletProps,
  SheetStepProps,
  SheetTriggerProps,
} from "./sheet.js";
import type { TravelAnimation } from "./motion.js";
import type {
  ScrollContentProps,
  ScrollRootProps,
  ScrollViewProps,
} from "./utilities.js";

export interface DepthSheetTokens {
  inset?: string;
  radius?: string;
  shift?: string;
  shiftLimit?: string;
  scaleLoss?: string | number;
  scaleMinimum?: string | number;
  radiusStep?: string;
  radiusLimit?: string;
  dimming?: string | number;
  brightnessMinimum?: string | number;
  pageBackground?: string;
  surfaceBackground?: string;
  backdropBackground?: string;
  handleBackground?: string;
  shadow?: string;
}

export interface DepthSheetRootProps extends SheetRootProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  sheetProps?: SheetRootProps;
  tokens?: DepthSheetTokens;
}

export interface DepthSheetPageProps extends SheetStackOutletProps {}

export interface DepthSheetContentProps extends SheetContentProps {
  portalProps?: SheetPortalProps;
  view?: React.ReactElement | null;
  viewProps?: SheetComposedViewProps;
  backdrop?: SheetPartSlot;
  backdropProps?: SheetBackdropProps;
  handle?: SheetPartSlot;
  handleProps?: SheetHandleProps;
  bleedingBackground?: SheetPartSlot;
  bleedingBackgroundProps?: PrimitiveProps<HTMLDivElement>;
  scrollRootProps?: ScrollRootProps;
  scrollViewProps?: ScrollViewProps;
  scrollContentProps?: ScrollContentProps;
}

type DepthSheetDivPart<P = PrimitiveProps<HTMLDivElement>> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<HTMLDivElement>
>;
type DepthSheetButtonPart<P = React.ButtonHTMLAttributes<HTMLButtonElement>> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<HTMLButtonElement>
  >;

/** CSS custom-property names accepted by DepthSheet.Root's `tokens` prop. */
export const depthSheetVariables = depthSheetVariablesRuntime as Readonly<{
  [Name in keyof DepthSheetTokens]-?: `--velvet-depth-${string}`;
}>;
/** Values supplied by depth-sheet.css before responsive overrides. */
export const depthSheetDefaultTokens =
  depthSheetDefaultTokensRuntime as Readonly<Required<DepthSheetTokens>>;
/** Bounded page-recession animation used by DepthSheet.Page and nested content. */
export const depthSheetStackingAnimation =
  depthSheetStackingAnimationRuntime as TravelAnimation;

export const DepthSheet = depthSheetRuntime as {
  Root: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<DepthSheetRootProps> & React.RefAttributes<HTMLDivElement>
  >;
  Page: DepthSheetDivPart<DepthSheetPageProps>;
  Content: DepthSheetDivPart<DepthSheetContentProps>;
  Trigger: DepthSheetButtonPart<SheetTriggerProps>;
  Close: DepthSheetButtonPart<SheetTriggerProps>;
  Step: DepthSheetButtonPart<SheetStepProps>;
  Title: SheetComponent["Title"];
  Description: SheetComponent["Description"];
  Handle: DepthSheetButtonPart<SheetHandleProps>;
};
