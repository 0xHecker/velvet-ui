import { forwardRef } from "react";
import { Polymorph } from "./core/Slot.jsx";

const Root = forwardRef(function VisuallyHiddenRoot({ asChild, children, ...rest }, ref) {
  return (
    <Polymorph asChild={asChild} ref={ref} data-velvet="visually-hidden" {...rest}>
      {children}
    </Polymorph>
  );
});

export const VisuallyHidden = { Root };
