import * as React from "react";
import { Lightbox as lightboxRuntime } from "../Lightbox.jsx";
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

export interface LightboxContentProps extends SheetContentProps {
  portalProps?: SheetPortalProps;
  view?: React.ReactElement | null;
  viewProps?: SheetComposedViewProps;
  backdrop?: SheetPartSlot;
  backdropProps?: SheetBackdropProps;
}

type DivPart<P = PrimitiveProps<HTMLDivElement>> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<HTMLDivElement>
  >;
type ButtonPart<P = React.ButtonHTMLAttributes<HTMLButtonElement>> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<HTMLButtonElement>
  >;

export const Lightbox = lightboxRuntime as {
  Root: React.FC<SheetRootProps>;
  Trigger: ButtonPart<SheetTriggerProps>;
  Content: DivPart<LightboxContentProps>;
  Close: ButtonPart<SheetTriggerProps>;
  Title: SheetComponent["Title"];
  Description: SheetComponent["Description"];
};
