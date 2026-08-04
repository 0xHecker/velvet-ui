import * as React from "react";
import { BottomSheet as bottomSheetRuntime } from "../BottomSheet.jsx";
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
  SheetStepProps,
  SheetTriggerProps,
} from "./sheet.js";
import type {
  ScrollContentProps,
  ScrollRootProps,
  ScrollViewProps,
} from "./utilities.js";

export interface BottomSheetContentProps extends SheetContentProps {
  portalProps?: SheetPortalProps;
  view?: React.ReactElement | null;
  viewProps?: SheetComposedViewProps;
  backdrop?: SheetPartSlot;
  backdropProps?: SheetBackdropProps;
  handle?: SheetPartSlot;
  handleProps?: SheetHandleProps;
  bleedingBackground?: SheetPartSlot;
  bleedingBackgroundProps?: PrimitiveProps<HTMLDivElement>;
  scroll?: boolean;
  scrollRootProps?: ScrollRootProps;
  scrollViewProps?: ScrollViewProps;
  scrollContentProps?: ScrollContentProps;
}

type DivPart<P = PrimitiveProps<HTMLDivElement>> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<HTMLDivElement>
  >;
type ButtonPart<P = React.ButtonHTMLAttributes<HTMLButtonElement>> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<HTMLButtonElement>
  >;

export const BottomSheet = bottomSheetRuntime as {
  Root: React.FC<SheetRootProps>;
  Trigger: ButtonPart<SheetTriggerProps>;
  Content: DivPart<BottomSheetContentProps>;
  Close: ButtonPart<SheetTriggerProps>;
  Step: ButtonPart<SheetStepProps>;
  Title: SheetComponent["Title"];
  Description: SheetComponent["Description"];
  Handle: ButtonPart<SheetHandleProps>;
};
