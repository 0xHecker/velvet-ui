import * as React from "react";

export type SheetSide = "top" | "right" | "bottom" | "left" | "center";
export type SheetTrack = Exclude<SheetSide, "center">;
export type SheetDetent = number | string;
export type SheetStepDirection = "up" | "down";

export interface SpringSettings {
  preset?: keyof typeof SPRING_PRESETS;
  easing?: "spring" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  stiffness?: number;
  damping?: number;
  mass?: number;
  precision?: number;
  initialVelocity?: number;
  duration?: number;
  delay?: number;
  skip?: boolean | "auto";
}

export type SpringPreset = keyof typeof SPRING_PRESETS;
export type AnimationSettings = SpringPreset | SpringSettings;
export type TravelValue =
  | string
  | number
  | false
  | null
  | readonly [string | number, string | number]
  | ((context: {
      progress: number;
      tween(from: string | number, to: string | number): string;
    }) => string | number | null | undefined);
export type TravelAnimation =
  | Record<string, TravelValue>
  | { properties: Record<string, TravelValue> };

export interface SheetRootProps {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  snap?: number;
  defaultSnap?: number;
  onSnapChange?: (snap: number) => void;
  /** @deprecated Use `open`. */
  presented?: boolean;
  /** @deprecated Use `defaultOpen`. */
  defaultPresented?: boolean;
  /** @deprecated Use `onOpenChange`. */
  onPresentedChange?: (presented: boolean) => void;
  /** @deprecated Use `snap`. */
  activeDetent?: number;
  /** @deprecated Use `defaultSnap`. */
  defaultActiveDetent?: number;
  /** @deprecated Use `onSnapChange`. */
  onActiveDetentChange?: (detent: number) => void;
  sheetRole?: "dialog" | "alertdialog";
  license?: string;
}

export interface PrimitiveProps<T extends HTMLElement = HTMLDivElement>
  extends React.HTMLAttributes<T> {
  asChild?: boolean;
}

export interface SheetPortalProps {
  children?: React.ReactNode;
  container?: Element | DocumentFragment | null;
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

export interface SheetViewProps extends PrimitiveProps<HTMLDivElement> {
  side?: SheetSide;
  snapPoints?: SheetDetent | readonly SheetDetent[];
  draggable?: boolean;
  dismissible?: boolean;
  modal?: boolean;
  /** @deprecated Use `side`. */
  contentPlacement?: SheetSide;
  tracks?: SheetTrack | readonly SheetTrack[];
  /** @deprecated Use `snapPoints`. */
  detents?: SheetDetent | readonly SheetDetent[];
  /** @deprecated Use `draggable`. */
  swipe?: boolean;
  /** @deprecated Use `dismissible`. */
  swipeDismissal?: boolean;
  swipeOvershoot?: boolean;
  swipeTrap?: boolean | string;
  snapOutAcceleration?: "auto" | number;
  snapToEndDetentsAcceleration?: "auto" | number;
  /** @deprecated Use `modal`. */
  inertOutside?: boolean;
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

export interface SheetBackdropProps extends PrimitiveProps<HTMLDivElement> {
  swipeable?: boolean;
  themeColorDimming?: boolean;
  travelAnimation?: TravelAnimation;
}

export interface SheetContentProps extends PrimitiveProps<HTMLDivElement> {
  travelAnimation?: TravelAnimation;
  stackingAnimation?: TravelAnimation;
}

export interface SheetHandleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  action?: "dismiss" | "step" | {
    type: "step";
    detent?: number;
    direction?: SheetStepDirection;
  };
}

export type SheetTriggerAction =
  | "present"
  | "dismiss"
  | "open"
  | "close"
  | "toggle"
  | "step"
  | {
      type: "step";
      detent?: number;
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
  detent?: number;
  direction?: SheetStepDirection;
}

export interface SheetPanelProps extends SheetContentProps {
  side?: SheetSide;
  snapPoints?: SheetDetent | readonly SheetDetent[];
  modal?: boolean;
  dismissible?: boolean;
  draggable?: boolean;
  portal?: boolean;
  container?: Element | DocumentFragment | null;
  portalProps?: SheetPortalProps;
  viewProps?: SheetViewProps;
  backdrop?: boolean | React.ReactElement;
  backdropProps?: SheetBackdropProps;
  handle?: boolean | React.ReactElement;
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
  PreviewEnvironment: React.ComponentType<any>;
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

export const Sheet: SheetComponent;

export interface SheetStackRootProps extends PrimitiveProps<HTMLDivElement> {
  componentId?: React.Context<unknown>;
}
export interface SheetStackOutletProps extends PrimitiveProps<HTMLDivElement> {
  stackingAnimation?: TravelAnimation;
}
export const SheetStack: {
  Root: DivPart<SheetStackRootProps>;
  Outlet: DivPart<SheetStackOutletProps>;
};

export const SPRING_PRESETS: {
  readonly gentle: { readonly stiffness: 560; readonly damping: 68; readonly mass: 1.85 };
  readonly smooth: { readonly stiffness: 580; readonly damping: 60; readonly mass: 1.35 };
  readonly snappy: { readonly stiffness: 350; readonly damping: 34; readonly mass: 0.9 };
  readonly brisk: { readonly stiffness: 350; readonly damping: 28; readonly mass: 0.65 };
  readonly bouncy: { readonly stiffness: 240; readonly damping: 19; readonly mass: 0.7 };
  readonly elastic: { readonly stiffness: 260; readonly damping: 20; readonly mass: 1 };
};
