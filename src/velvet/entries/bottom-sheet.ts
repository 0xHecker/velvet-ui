import * as React from "react";
import { BottomSheet as bottomSheetRuntime } from "../BottomSheet.jsx";
import type {
  PrimitiveProps,
  SheetBackdropProps,
  SheetComponent,
  SheetContentProps,
  SheetHandleProps,
  SheetPortalProps,
  SheetRootProps,
  SheetStepProps,
  SheetTriggerProps,
  SheetViewProps,
} from "./sheet.js";
import type {
  ScrollContentProps,
  ScrollRootProps,
  ScrollViewProps,
} from "./utilities.js";

export interface BottomSheetContentProps extends SheetContentProps {
  portalProps?: SheetPortalProps;
  viewProps?: SheetViewProps;
  backdrop?: boolean | React.ReactElement;
  backdropProps?: SheetBackdropProps;
  handle?: boolean | React.ReactElement;
  handleProps?: SheetHandleProps;
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
