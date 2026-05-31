import { forwardRef } from "react";
import { Polymorph } from "./core/Slot.jsx";

// Marks the element the Sheet should focus on open (instead of the first focusable).
export const AutoFocusTarget = forwardRef(function AutoFocusTarget(
  { asChild, className, style, children, ...rest },
  ref
) {
  return (
    <Polymorph
      asChild={asChild}
      ref={ref}
      data-velvet-autofocus=""
      tabIndex={-1}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Polymorph>
  );
});
