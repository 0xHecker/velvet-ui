import * as React from "react";
import { CardExpansion as cardExpansionRuntime } from "../CardExpansion.jsx";
import type {
  PrimitiveProps,
  SheetBackdropProps,
  SheetComponent,
  SheetComposedViewProps,
  SheetContentProps,
  SheetPortalProps,
  SheetPartSlot,
  SheetRootProps,
  SheetTriggerProps,
} from "./sheet.js";
import type {
  ScrollContentProps,
  ScrollRootProps,
  ScrollViewProps,
} from "./utilities.js";

export interface CardExpansionTriggerProps extends SheetTriggerProps {}

export interface CardExpansionContentProps extends SheetContentProps {
  from?: "trigger" | React.RefObject<Element | null> | Element | false | null;
  portalProps?: SheetPortalProps;
  view?: React.ReactElement | null;
  viewProps?: SheetComposedViewProps;
  backdrop?: SheetPartSlot;
  backdropProps?: SheetBackdropProps;
  scroll?: boolean;
  scrollRootProps?: ScrollRootProps;
  scrollViewProps?: ScrollViewProps;
  scrollContentProps?: ScrollContentProps;
}

type CardExpansionDivPart<P = PrimitiveProps<HTMLDivElement>> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<HTMLDivElement>
>;
type CardExpansionButtonPart<P = React.ButtonHTMLAttributes<HTMLButtonElement>> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<HTMLButtonElement>
  >;

export const CardExpansion = cardExpansionRuntime as {
  Root: React.FC<SheetRootProps>;
  Trigger: CardExpansionButtonPart<CardExpansionTriggerProps>;
  Content: CardExpansionDivPart<CardExpansionContentProps>;
  Close: CardExpansionButtonPart<SheetTriggerProps>;
  Title: SheetComponent["Title"];
  Description: SheetComponent["Description"];
};
