import { expectVelvetLayer as expectVelvetLayerRuntime } from "../testing.js";

export interface VelvetLayerExpectation {
  role?: "dialog" | "alertdialog" | string | null;
  nestedWithin?: Element;
  frontmost?: boolean;
  restoresFocusTo?: HTMLElement;
}

export interface VelvetLayerInspection {
  scopeId?: string;
  parentScopeId?: string;
  layerKind?: string;
  portalContainer?: Element | null;
  open?: boolean;
  travelStatus?: string;
  lastDismissReason?: string | null;
  dismissPending?: boolean;
  capturedFocusElement?: Element | null;
  plannedRestoreTarget?: Element | null;
  initialFocusTarget?: Element | null;
  element?: Element | null;
  frontmost?: boolean;
}

export const expectVelvetLayer = expectVelvetLayerRuntime as (
  target: Document | Element,
  expectations?: VelvetLayerExpectation,
) => Element;

declare global {
  interface Window {
    __velvet?: {
      freeze(progress: number): void;
      open(): void;
      progress(): number | undefined;
      idle(): boolean;
      count(): number;
      inspect(): VelvetLayerInspection[];
      setTimeScale(scale: number): number;
    };
  }
}
