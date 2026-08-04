import * as React from "react";
import { PersistentSheet as persistentSheetRuntime } from "../PersistentSheet.jsx";
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

export interface PersistentSheetContentProps extends SheetContentProps {
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

export const PersistentSheet = persistentSheetRuntime as {
  Root: React.FC<SheetRootProps>;
  Trigger: ButtonPart<SheetTriggerProps>;
  Content: DivPart<PersistentSheetContentProps>;
  Close: ButtonPart<SheetTriggerProps>;
  Step: ButtonPart<SheetStepProps>;
  Title: SheetComponent["Title"];
  Description: SheetComponent["Description"];
  Handle: ButtonPart<SheetHandleProps>;
};
