import * as React from "react";
import { toast as toastRuntime } from "../toast.js";
import { Toaster as toasterRuntime } from "../Toaster.jsx";

export type ToastId = string | number;
export type ToastType =
  | "default"
  | "success"
  | "error"
  | "info"
  | "warning"
  | "loading";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end";
export type ToastSwipeDirection = "top" | "right" | "bottom" | "left" | "start" | "end";
export type ToastCloseButtonPosition = "left" | "right";
export type ToastDismissReason =
  | "programmatic"
  | "timeout"
  | "swipe"
  | "action"
  | "cancel"
  | "close-button"
  | "escape"
  | (string & {});

export interface ToastClassNames {
  toaster?: string;
  toast?: string;
  body?: string;
  title?: string;
  description?: string;
  icon?: string;
  action?: string;
  cancel?: string;
  closeButton?: string;
  closeIcon?: string;
  liveRegion?: string;
}

export interface ToastAction {
  label: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | false;
}

export interface ToastOptions {
  id?: ToastId;
  type?: ToastType;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  announcement?: string;
  duration?: number;
  dismissible?: boolean;
  swipeDirections?: readonly ToastSwipeDirection[];
  important?: boolean;
  action?: ToastAction;
  cancel?: Omit<ToastAction, "onClick"> & {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
  closeButton?: boolean;
  closeButtonPosition?: ToastCloseButtonPosition;
  closeButtonAriaLabel?: string;
  className?: string;
  descriptionClassName?: string;
  classNames?: ToastClassNames;
  style?: React.CSSProperties;
  unstyled?: boolean;
  onDismiss?: (toast: ToastRecord, detail: ToastDismissDetail) => void;
  onAutoClose?: (toast: ToastRecord, detail: ToastDismissDetail) => void;
}

export interface ToastRecord extends ToastOptions {
  id: ToastId;
  message: React.ReactNode | ((id: ToastId) => React.ReactNode);
  type: ToastType;
  status: "active" | "removing";
  createdAt: number;
  updatedAt: number;
  revision: number;
  custom?: boolean;
  dismissReason?: ToastDismissReason;
}

export interface ToastDismissDetail {
  id: ToastId;
  reason: ToastDismissReason;
}

export interface PromiseToastPhase<T = unknown>
  extends Omit<ToastOptions, "id" | "type" | "description"> {
  message?: React.ReactNode | ((value: T) => React.ReactNode);
  description?: React.ReactNode | ((value: T) => React.ReactNode);
}

type PromisePhase<T> =
  | React.ReactNode
  | PromiseToastPhase<T>
  | ((value: T) => React.ReactNode | PromiseToastPhase<T>);

export interface PromiseToastOptions<T> extends Omit<ToastOptions, "type"> {
  loading?: React.ReactNode | PromiseToastPhase<void> | (() => React.ReactNode | PromiseToastPhase<void>);
  success?: PromisePhase<T>;
  error?: PromisePhase<unknown>;
  finally?: () => void;
}

export interface ToastFunction {
  (message: React.ReactNode, options?: ToastOptions): ToastId;
  success(message: React.ReactNode, options?: ToastOptions): ToastId;
  error(message: React.ReactNode, options?: ToastOptions): ToastId;
  info(message: React.ReactNode, options?: ToastOptions): ToastId;
  warning(message: React.ReactNode, options?: ToastOptions): ToastId;
  message(message: React.ReactNode, options?: ToastOptions): ToastId;
  loading(message: React.ReactNode, options?: ToastOptions): ToastId;
  custom(
    content: React.ReactNode | ((id: ToastId) => React.ReactNode),
    options?: ToastOptions,
  ): ToastId;
  update(
    id: ToastId,
    patch:
      | Partial<ToastOptions & { message: React.ReactNode; type: ToastType }>
      | ((toast: ToastRecord) => Partial<ToastOptions & { message: React.ReactNode; type: ToastType }>),
  ): ToastId | undefined;
  dismiss(id?: ToastId, reason?: ToastDismissReason): void;
  promise<T>(
    task: PromiseLike<T> | (() => PromiseLike<T>),
    options?: PromiseToastOptions<T>,
  ): Promise<T>;
}

export const toast = toastRuntime as ToastFunction;

export interface ToasterProps {
  position?: ToastPosition;
  duration?: number;
  gap?: number;
  stack?: boolean;
  expand?: boolean;
  visibleToasts?: number;
  closeButton?: boolean;
  closeButtonPosition?: ToastCloseButtonPosition;
  richColors?: boolean;
  swipeDirections?: readonly ToastSwipeDirection[];
  hotkey?: readonly string[] | null;
  pauseWhenPageIsHidden?: boolean;
  dir?: "ltr" | "rtl" | "auto";
  offset?: number | string;
  containerAriaLabel?: string;
  icons?: Partial<Record<ToastType | "close", React.ReactNode>>;
  toastOptions?: ToastOptions;
  className?: string;
  classNames?: ToastClassNames;
  style?: React.CSSProperties;
  unstyled?: boolean;
}

export const Toaster = toasterRuntime as React.FC<ToasterProps>;
