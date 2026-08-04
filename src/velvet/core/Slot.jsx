import { Children, cloneElement, forwardRef, isValidElement, version } from "react";
import { composeEventHandlers } from "./events.js";
import { composeRefs } from "./refs.js";

// React 19 exposes ref as a normal prop; React 18 keeps it on element.ref.
// Reading the right one keeps the library compatible with both (no warnings).
const REACT_19 = Number((version || "18").split(".")[0]) >= 19;
const childRefOf = (child) => (REACT_19 ? child.props.ref : child.ref);

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
export const Slot = forwardRef(function Slot({ children, ...slotProps }, forwardedRef) {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  const childRef = childRefOf(child);
  return cloneElement(child, {
    ...mergeProps(slotProps, child.props),
    ref: forwardedRef ? composeRefs(forwardedRef, childRef) : childRef,
  });
});

// Helper: render either the Slot (asChild) or a default element with the given props.
export const Polymorph = forwardRef(function Polymorph(
  { asChild, as: Tag = "div", children, ...props },
  ref
) {
  if (asChild) {
    return (
      <Slot ref={ref} {...props}>
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
