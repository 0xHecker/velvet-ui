import { forwardRef } from "react";
import { Polymorph } from "./core/Slot.jsx";

// A region that stays interactive and is treated as part of the frontmost sheet.
export const Island = forwardRef(function Island(
  { asChild, className, style, children, ...rest },
  ref
) {
  return (
    <Polymorph asChild={asChild} ref={ref} data-velvet="island" className={className} style={style} {...rest}>
      {children}
    </Polymorph>
  );
});
