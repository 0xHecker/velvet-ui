import { forwardRef, useEffect, useRef } from "react";
import { Polymorph } from "./core/Slot.jsx";
import { useComposedRefs } from "./core/refs.js";
import { useSheetScope } from "./core/sheetScope.js";
import { registerModalScopeElement } from "./internal/ModalManager.js";

// A region that stays interactive and is treated as part of the frontmost sheet.
export const Island = forwardRef(function Island(
  { asChild, className, style, children, ...rest },
  ref
) {
  const scopeId = useSheetScope();
  const islandRef = useRef(null);
  const composedRef = useComposedRefs(ref, islandRef);

  useEffect(() => {
    const island = islandRef.current;
    if (!island) return undefined;
    return registerModalScopeElement(island);
  }, [scopeId]);

  return (
    <Polymorph
      asChild={asChild}
      ref={composedRef}
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
