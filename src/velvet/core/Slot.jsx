import {
  Children,
  Fragment,
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  version,
} from "react";
import { composeEventHandlers } from "./events.js";
import { composeRefs } from "./refs.js";

// React 19 exposes ref as a normal prop; React 18 keeps it on element.ref.
// Reading the right one keeps the library compatible with both (no warnings).
const REACT_19 = Number((version || "18").split(".")[0]) >= 19;
const isDevelopment = import.meta.env?.DEV === true;
const childRefOf = (child) => (REACT_19 ? child.props.ref : child.ref);

const onlySlottableChild = (children, owner = "A Velvet component") => {
  const childList = Children.toArray(children);
  const child = childList[0];
  if (
    childList.length !== 1 ||
    !isValidElement(child) ||
    child.type === Fragment
  ) {
    throw new Error(
      `[Velvet UI] ${owner} with asChild requires exactly one non-Fragment React element. ` +
        "Wrap sibling content in a ref-forwarding component or DOM element."
    );
  }
  return child;
};

// Merge props from the Slot onto the single child element. The child's event
// handler runs first and may prevent the Slot's behavior with preventDefault.
// className/style are concatenated.
const mergeProps = (slotProps, childProps) => {
  const merged = { ...childProps };
  for (const key in slotProps) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    if (/^on[A-Z]/.test(key)) {
      merged[key] = composeEventHandlers(childValue, slotValue);
    } else if (key === "style") {
      merged.style = { ...slotValue, ...childValue };
    } else if (key === "className") {
      merged.className = [slotValue, childValue].filter(Boolean).join(" ");
    } else if (slotValue !== undefined) {
      merged[key] = slotValue;
    }
  }
  return merged;
};

// Renders its single child, merging the Slot's own props/ref onto it. Used to
// implement the `asChild` prop available on every element-rendering sub-component.
export const Slot = forwardRef(function Slot(
  {
    children,
    __slotOwner = "A Velvet component",
    __slotDiagnosticActive = true,
    ...slotProps
  },
  forwardedRef
) {
  const child = onlySlottableChild(children, __slotOwner);
  const childRef = childRefOf(child);
  const nodeRef = useRef(null);
  const firstNodeRef = useRef(null);
  const ownerRef = useRef(__slotOwner);
  const warnedRef = useRef(new Set());
  ownerRef.current = __slotOwner;

  const warn = useCallback((code, message, path) => {
    if (!isDevelopment || warnedRef.current.has(code)) return;
    warnedRef.current.add(code);
    console.error(
      `[Velvet UI] ${code}: ${message} https://velvetui.co/errors/${path}`
    );
  }, []);

  const diagnosticRef = useCallback((node) => {
    if (!node) {
      nodeRef.current = null;
      return;
    }
    if (typeof Element !== "undefined" && !(node instanceof Element)) {
      warn(
        "VELVET_AS_CHILD_NON_DOM",
        `${ownerRef.current} resolved its ref to a non-DOM value.`,
        "as-child-non-dom"
      );
      return;
    }
    if (
      firstNodeRef.current &&
      firstNodeRef.current !== node &&
      firstNodeRef.current.isConnected
    ) {
      warn(
        "VELVET_AS_CHILD_IDENTITY_CHANGED",
        `${ownerRef.current} changed its DOM element identity while mounted.`,
        "as-child-identity-changed"
      );
    }
    firstNodeRef.current ||= node;
    nodeRef.current = node;
  }, [warn]);

  useEffect(() => {
    if (!isDevelopment || !__slotDiagnosticActive) return undefined;
    const schedule =
      globalThis.requestAnimationFrame ?? ((callback) => setTimeout(callback, 0));
    const cancel = globalThis.cancelAnimationFrame ?? clearTimeout;
    const frame = schedule(() => {
      const node = nodeRef.current;
      if (!node) {
        const external = ownerRef.current.startsWith("ExternalOverlay");
        warn(
          external
            ? "VELVET_EXTERNAL_OVERLAY_NON_DOM"
            : "VELVET_AS_CHILD_REF_DROPPED",
          external
            ? `${ownerRef.current} must wrap the DOM-bearing popup surface, not a Portal or controller component.`
            : `${ownerRef.current}'s child did not forward the received ref to one DOM element.`,
          external ? "external-overlay-non-dom" : "as-child-ref-dropped"
        );
        return;
      }
      const missing = Object.keys(slotProps).filter((key) => {
        if (!/^data-|^aria-/.test(key) || slotProps[key] == null) return false;
        return !node.hasAttribute(key);
      });
      if (missing.length > 0) {
        warn(
          "VELVET_AS_CHILD_PROPS_DROPPED",
          `${ownerRef.current}'s child dropped required attributes: ${missing.join(", ")}.`,
          "as-child-props-dropped"
        );
      }
    });
    return () => cancel(frame);
  }, [__slotDiagnosticActive, slotProps, warn]);

  return cloneElement(child, {
    ...mergeProps(slotProps, child.props),
    ref: composeRefs(forwardedRef, childRef, diagnosticRef),
  });
});

// Compositions insert mechanics such as handles, backgrounds, and coordinated
// scroll wrappers inside the consumer's surface. When that surface uses
// `asChild`, keep it as the one slotted element and map its authored children
// into the composition instead of handing Slot several siblings.
export const mapSlottedChildren = (
  asChild,
  children,
  mapChildren,
  owner
) => {
  if (!asChild) return mapChildren(children);
  const child = onlySlottableChild(children, owner);
  return cloneElement(child, undefined, mapChildren(child.props.children));
};

// Helper: render either the Slot (asChild) or a default element with the given props.
export const Polymorph = forwardRef(function Polymorph(
  {
    asChild,
    as: Tag = "div",
    children,
    slotOwner,
    slotDiagnosticActive,
    ...props
  },
  ref
) {
  if (asChild) {
    return (
      <Slot
        ref={ref}
        __slotOwner={slotOwner}
        __slotDiagnosticActive={slotDiagnosticActive}
        {...props}
      >
        {children}
      </Slot>
    );
  }
  return (
    <Tag ref={ref} {...props}>
      {children}
    </Tag>
  );
});
