import * as React from "react";
import {
  VelvetAriaPopover as ariaPopoverRuntime,
  VelvetAriaSelect as ariaSelectRuntime,
  VelvetAriaTooltip as ariaTooltipRuntime,
  VelvetBaseUIMenu as baseMenuRuntime,
  VelvetBaseUIPopover as basePopoverRuntime,
  VelvetBaseUISelect as baseSelectRuntime,
  VelvetRadixDropdownMenu as radixDropdownMenuRuntime,
  VelvetRadixPopover as radixPopoverRuntime,
  createExternalOverlayAdapter as createAdapterRuntime,
} from "../adapters.jsx";

export type ExternalDismissReason = "escape" | "outside-press" | "programmatic";

export interface ExternalDismissDetail {
  reason: ExternalDismissReason;
  nativeEvent?: Event;
}

export interface ExternalOverlayAdapterProps
  extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  open?: boolean;
  onDismiss?: (
    detail: ExternalDismissDetail,
  ) => boolean | void | Promise<boolean | void>;
  onEnterComplete?: () => void;
  onExitComplete?: () => void;
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  children?: React.ReactNode;
}

export type ExternalOverlayAdapter = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<ExternalOverlayAdapterProps> &
    React.RefAttributes<HTMLElement>
>;

export const VelvetRadixPopover = radixPopoverRuntime as ExternalOverlayAdapter;
export const VelvetRadixDropdownMenu =
  radixDropdownMenuRuntime as ExternalOverlayAdapter;
export const VelvetAriaPopover = ariaPopoverRuntime as ExternalOverlayAdapter;
export const VelvetAriaTooltip = ariaTooltipRuntime as ExternalOverlayAdapter;
export const VelvetAriaSelect = ariaSelectRuntime as ExternalOverlayAdapter;
export const VelvetBaseUIPopover = basePopoverRuntime as ExternalOverlayAdapter;
export const VelvetBaseUIMenu = baseMenuRuntime as ExternalOverlayAdapter;
export const VelvetBaseUISelect = baseSelectRuntime as ExternalOverlayAdapter;

export const createExternalOverlayAdapter = createAdapterRuntime as (
  name: string,
  defaults?: Partial<ExternalOverlayAdapterProps>,
) => ExternalOverlayAdapter;
