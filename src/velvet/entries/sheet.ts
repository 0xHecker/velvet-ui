import * as React from "react";
// Runtime modules stay framework-native JSX; this typed boundary is the
// canonical public contract from which package declarations are generated.
import { Sheet as SheetRuntime } from "../Sheet.jsx";
import { SheetStack as SheetStackRuntime } from "../SheetStack.jsx";
import type {
  MotionSettings,
  TravelAnimation,
} from "./motion.js";

export type SheetSide = "top" | "right" | "bottom" | "left" | "center";
export type SheetTrack = Exclude<SheetSide, "center">;
export type SheetDetent = number | string;
export type SheetStepDirection = "up" | "down";

export type AnimationSettings = MotionSettings;

export interface SheetRootProps {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  snap?: number;
  defaultSnap?: number;
  onSnapChange?: (snap: number) => void;
  sheetRole?: "dialog" | "alertdialog";
}

export interface PrimitiveProps<T extends HTMLElement = HTMLDivElement>
  extends React.HTMLAttributes<T> {
  asChild?: boolean;
}

export type SheetPortalContainer =
  | Element
  | DocumentFragment
  | React.RefObject<Element | DocumentFragment | null>;

/**
 * A composition slot. `true` renders Velvet's default part, `false`/`null`
 * removes it, and a React element becomes the visual node while Velvet keeps
 * the part's behavior, accessibility props, events, and ref.
 */
export type SheetPartSlot = boolean | React.ReactElement | null;

export interface SheetPortalProps {
  children?: React.ReactNode;
  /** A resolved portal host or a React ref whose current value is the host. */
  container?: SheetPortalContainer | null;
}

export interface SheetTravelDetail {
  progress: number;
  range: { start: number; end: number };
  progressAtDetents: readonly number[];
}

export type SheetTravelStatus =
  | "idleOutside"
  | "entering"
  | "idleInside"
  | "stepping"
  | "exiting";

export interface SheetDismissBehavior {
  dismiss?: boolean;
}

export interface SheetInteractionDetail<E = Event> {
  nativeEvent: E;
  changeDefault(behavior: SheetDismissBehavior): void;
}

export type SheetInteractionHandler<E = Event> =
  | SheetDismissBehavior
  | ((detail: SheetInteractionDetail<E>) => void);

export interface SheetViewProps extends Omit<
  PrimitiveProps<HTMLDivElement>,
  "role" | "aria-modal" | "aria-labelledby" | "aria-describedby"
> {
  side?: SheetSide;
  snapPoints?: SheetDetent | readonly SheetDetent[];
  draggable?: boolean;
  dismissible?: boolean;
  modal?: boolean;
  /** Use `auto` with Scroll.View for stable, native boundary handoff in either direction. */
  tracks?: SheetTrack | readonly SheetTrack[] | "auto";
  swipeOvershoot?: boolean;
  swipeTrap?: boolean | { x?: boolean; y?: boolean };
  snapOutAcceleration?: "auto" | number;
  snapToEndDetentsAcceleration?: "auto" | number;
  enteringAnimationSettings?: AnimationSettings;
  exitingAnimationSettings?: AnimationSettings;
  steppingAnimationSettings?: AnimationSettings;
  onTravel?: (detail: SheetTravelDetail) => void;
  onTravelStart?: () => void;
  onTravelEnd?: () => void;
  onTravelStatusChange?: (status: SheetTravelStatus) => void;
  onClickOutside?: SheetInteractionHandler<React.MouseEvent<HTMLDivElement>>;
  onEscapeKeyDown?: SheetInteractionHandler<KeyboardEvent>;
  nativeEdgeSwipePrevention?: boolean;
}

/** View props accepted by Panel and styled compositions. Replace the actual
 * View element with the dedicated `view` slot instead of `viewProps.asChild`. */
export type SheetComposedViewProps = Omit<
  SheetViewProps,
  "asChild" | "children"
>;

export interface SheetBackdropProps extends PrimitiveProps<HTMLDivElement> {
  travelAnimation?: TravelAnimation;
}

export interface SheetContentProps extends PrimitiveProps<HTMLDivElement> {
  travelAnimation?: TravelAnimation;
  stackingAnimation?: TravelAnimation;
}

export interface SheetHandleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  action?: "close" | "step" | {
    type: "step";
    snapTo?: number;
    direction?: SheetStepDirection;
  };
}

export type SheetTriggerAction =
  | "open"
  | "close"
  | "toggle"
  | "step"
  | {
      type: "step";
      snapTo?: number;
      direction?: SheetStepDirection;
    };

export interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  action?: SheetTriggerAction;
  snapTo?: number;
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
}

export interface SheetStepProps extends Omit<SheetTriggerProps, "action"> {
  snapTo?: number;
  direction?: SheetStepDirection;
}

export interface SheetPanelProps extends SheetContentProps {
  side?: SheetSide;
  snapPoints?: SheetDetent | readonly SheetDetent[];
  modal?: boolean;
  dismissible?: boolean;
  draggable?: boolean;
  portal?: boolean;
  container?: SheetPortalContainer | null;
  portalProps?: SheetPortalProps;
  /** Optional ref-forwarding element used as the real Sheet.View node. */
  view?: React.ReactElement | null;
  viewProps?: SheetComposedViewProps;
  backdrop?: SheetPartSlot;
  backdropProps?: SheetBackdropProps;
  handle?: SheetPartSlot;
  handleProps?: SheetHandleProps;
  contentProps?: SheetContentProps;
}

export interface SheetOutletProps extends PrimitiveProps<HTMLDivElement> {
  travelAnimation?: TravelAnimation;
  stackingAnimation?: TravelAnimation;
}

type DivPart<P = PrimitiveProps<HTMLDivElement>> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<HTMLDivElement>
>;
type ButtonPart<P = React.ButtonHTMLAttributes<HTMLButtonElement>> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<HTMLButtonElement>
  >;

export interface SheetComponent extends React.FC<SheetRootProps> {
  Root: React.FC<SheetRootProps>;
  Portal: React.FC<SheetPortalProps>;
  Panel: DivPart<SheetPanelProps>;
  View: DivPart<SheetViewProps>;
  Backdrop: DivPart<SheetBackdropProps>;
  Content: DivPart<SheetContentProps>;
  BleedingBackground: DivPart;
  Handle: ButtonPart<SheetHandleProps>;
  Trigger: ButtonPart<SheetTriggerProps>;
  Close: ButtonPart<SheetTriggerProps>;
  Step: ButtonPart<SheetStepProps>;
  Title: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<PrimitiveProps<HTMLHeadingElement>> &
      React.RefAttributes<HTMLHeadingElement>
  >;
  Description: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<PrimitiveProps<HTMLParagraphElement>> &
      React.RefAttributes<HTMLParagraphElement>
  >;
  Outlet: DivPart<SheetOutletProps>;
}

export const Sheet = SheetRuntime as SheetComponent;

export interface SheetStackRootProps extends PrimitiveProps<HTMLDivElement> {
}
export interface SheetStackOutletProps extends PrimitiveProps<HTMLDivElement> {
  stackingAnimation?: TravelAnimation;
}
export const SheetStack = SheetStackRuntime as {
  Root: DivPart<SheetStackRootProps>;
  Outlet: DivPart<SheetStackOutletProps>;
};
