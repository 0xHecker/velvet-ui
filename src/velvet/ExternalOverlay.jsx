import { forwardRef } from "react";
import { Polymorph } from "./core/Slot.jsx";
import { useSheetScope } from "./core/sheetScope.js";

// Wraps a third-party overlay so it is treated as part of the sheet's modality.
const Root = forwardRef(function ExternalOverlayRoot(
  { asChild, className, style, children, ...rest },
  ref
) {
  const scopeId = useSheetScope();
  return (
    <Polymorph
      asChild={asChild}
      ref={ref}
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

export const ExternalOverlay = { Root };
