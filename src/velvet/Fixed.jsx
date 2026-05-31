import { forwardRef } from "react";
import { Polymorph } from "./core/Slot.jsx";

// An element that stays fixed in the viewport while a Sheet's content travels.
export const Fixed = forwardRef(function Fixed(
  { asChild, className, style, children, ...rest },
  ref
) {
  return (
    <Polymorph asChild={asChild} ref={ref} data-velvet="fixed" className={className} style={style} {...rest}>
      {children}
    </Polymorph>
  );
});
