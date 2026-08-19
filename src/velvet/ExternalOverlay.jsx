import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Polymorph } from "./core/Slot.jsx";
import { useComposedRefs } from "./core/refs.js";
import { useSheetScope } from "./core/sheetScope.js";
import { restoreFocus } from "./internal/FocusScope.js";
import {
  isFrontmostDismissLayer,
  registerDismissLayer,
  registerModalScopeElement,
} from "./internal/ModalManager.js";

const isDevelopment = import.meta.env?.DEV === true;

// Wraps a third-party overlay so it is treated as part of the sheet's modality.
const Root = forwardRef(function ExternalOverlayRoot(
  { asChild, className, style, children, ...rest },
  ref
) {
  const scopeId = useSheetScope();
  const rootRef = useRef(null);
  const composedRef = useComposedRefs(ref, rootRef);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    return registerModalScopeElement(root);
  }, [scopeId]);

  return (
    <Polymorph
      asChild={asChild}
      slotOwner="ExternalOverlay.Root"
      ref={composedRef}
      data-velvet="external-overlay"
      data-velvet-scope={scopeId || undefined}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Polymorph>
  );
});

const DismissLayer = forwardRef(function ExternalOverlayDismissLayer(
  {
    asChild,
    className,
    style,
    children,
    open = true,
    onDismiss,
    onEnterComplete,
    onExitComplete,
    restoreFocusRef,
    dismissOnEscape = true,
    dismissOnOutsidePress = true,
    ...rest
  },
  forwardedRef
) {
  const scopeId = useSheetScope();
  const layerRef = useRef(null);
  const composedRef = useComposedRefs(forwardedRef, layerRef);
  const capturedFocusRef = useRef(null);
  const openRef = useRef(open);
  const requestRef = useRef(null);
  const exitTokenRef = useRef(0);
  const [lastDismissReason, setLastDismissReason] = useState(null);
  const [dismissPending, setDismissPending] = useState(false);

  if (isDevelopment && !scopeId) {
    throw new Error(
      "[Velvet UI] ExternalOverlay.DismissLayer must be rendered under Sheet.Root."
    );
  }

  const requestDismiss = useCallback(
    (detail) => {
      if (!onDismiss || requestRef.current) return requestRef.current ?? false;
      setLastDismissReason(detail.reason);
      let result;
      try {
        result = onDismiss(detail);
      } catch (error) {
        if (isDevelopment) {
          console.error("[Velvet UI] ExternalOverlay onDismiss threw.", error);
        }
        return false;
      }
      if (!result || typeof result.then !== "function") return result !== false;
      setDismissPending(true);
      const pending = Promise.resolve(result)
        .then(
          (accepted) => accepted !== false,
          (error) => {
            if (isDevelopment) {
              console.error("[Velvet UI] ExternalOverlay onDismiss rejected.", error);
            }
            return false;
          }
        )
        .finally(() => {
          if (requestRef.current === pending) {
            requestRef.current = null;
            setDismissPending(false);
          }
        });
      requestRef.current = pending;
      return pending;
    },
    [onDismiss]
  );

  useEffect(() => {
    const layer = layerRef.current;
    if (!open || !layer) return undefined;
    capturedFocusRef.current = layer.ownerDocument.activeElement;
    const unregister = registerDismissLayer(layer);
    const schedule =
      globalThis.requestAnimationFrame ?? ((callback) => setTimeout(callback, 0));
    const cancel = globalThis.cancelAnimationFrame ?? clearTimeout;
    const frame = schedule(() => onEnterComplete?.());
    return () => {
      cancel(frame);
      unregister();
    };
  }, [onEnterComplete, open]);

  useEffect(() => {
    if (!open) return undefined;
    const ownerDocument = layerRef.current?.ownerDocument;
    if (!ownerDocument) return undefined;

    const onKeyDown = (event) => {
      const layer = layerRef.current;
      if (
        event.key !== "Escape" ||
        !dismissOnEscape ||
        !layer ||
        !isFrontmostDismissLayer(layer)
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      requestDismiss({ reason: "escape", nativeEvent: event });
    };
    const onPointerDown = (event) => {
      const layer = layerRef.current;
      if (
        !dismissOnOutsidePress ||
        !layer ||
        !isFrontmostDismissLayer(layer) ||
        event.composedPath().includes(layer)
      ) {
        return;
      }
      // Consume the frontmost layer's outside gesture so the owning Sheet
      // cannot interpret the same pointer as a backdrop dismissal.
      event.stopPropagation();
      requestDismiss({ reason: "outside-press", nativeEvent: event });
    };

    ownerDocument.addEventListener("keydown", onKeyDown, true);
    ownerDocument.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      ownerDocument.removeEventListener("keydown", onKeyDown, true);
      ownerDocument.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [dismissOnEscape, dismissOnOutsidePress, open, requestDismiss]);

  useEffect(() => {
    const wasOpen = openRef.current;
    openRef.current = open;
    if (!wasOpen || open) return undefined;

    const token = ++exitTokenRef.current;
    const layer = layerRef.current;
    const animations = layer?.getAnimations?.({ subtree: true }) ?? [];
    const completion = animations.length
      ? Promise.allSettled(animations.map((animation) => animation.finished))
      : Promise.resolve();
    completion.then(() => {
      if (token !== exitTokenRef.current || openRef.current) return;
      const target = restoreFocusRef?.current || capturedFocusRef.current;
      queueMicrotask(() => {
        if (target?.isConnected) restoreFocus(target);
        onExitComplete?.();
      });
    });
    return () => {
      exitTokenRef.current += 1;
    };
  }, [onExitComplete, open, restoreFocusRef]);

  return (
    <Polymorph
      asChild={asChild}
      slotOwner="ExternalOverlay.DismissLayer"
      slotDiagnosticActive={open}
      ref={composedRef}
      data-velvet="external-overlay"
      data-velvet-dismiss-layer=""
      data-velvet-scope={scopeId || undefined}
      data-velvet-open={open ? "true" : "false"}
      data-velvet-dismiss-reason={lastDismissReason || undefined}
      data-velvet-dismiss-pending={dismissPending ? "true" : undefined}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Polymorph>
  );
});

export const ExternalOverlay = { Root, DismissLayer };
