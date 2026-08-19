import { forwardRef } from "react";
import { ExternalOverlay } from "./ExternalOverlay.jsx";

const createAdapter = (name, defaults) => {
  const Adapter = forwardRef(function VelvetOverlayAdapter(props, forwardedRef) {
    return (
      <ExternalOverlay.DismissLayer
        {...defaults}
        {...props}
        ref={forwardedRef}
        data-velvet-adapter={name}
      />
    );
  });
  Adapter.displayName = name;
  return Adapter;
};

// These boundaries deliberately have no peer dependency on the integrated UI
// library. Render one inside that library's Portal and make its DOM-bearing
// popup/positioner the `asChild` node. The third-party component retains all
// positioning and styling while Velvet owns stack enrollment and dismissal.
export const VelvetRadixPopover = createAdapter("radix-popover");
export const VelvetRadixDropdownMenu = createAdapter("radix-dropdown-menu");

export const VelvetAriaPopover = createAdapter("react-aria-popover");
export const VelvetAriaTooltip = createAdapter("react-aria-tooltip", {
  dismissOnOutsidePress: false,
});
export const VelvetAriaSelect = createAdapter("react-aria-select");

export const VelvetBaseUIPopover = createAdapter("base-ui-popover");
export const VelvetBaseUIMenu = createAdapter("base-ui-menu");
export const VelvetBaseUISelect = createAdapter("base-ui-select");

export { createAdapter as createExternalOverlayAdapter };
