import { forwardRef } from "react";
import { Polymorph } from "./core/Slot.jsx";
import { useSheetScope } from "./core/sheetScope.js";

// A region that stays interactive and is treated as part of the frontmost sheet.
export const Island = forwardRef(function Island(
  { asChild, className, style, children, ...rest },
  ref
) {
  const scopeId = useSheetScope();
  return (
    <Polymorph
      asChild={asChild}
      ref={ref}
      data-velvet="island"
      data-velvet-scope={scopeId || undefined}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Polymorph>
  );
});
