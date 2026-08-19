# Utilities

> Utilities cover scroll coordination, visually hidden labels, autofocus targets, fixed surfaces, islands, and external overlays.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/utilities

Utilities solve focus, portal, fixed-layer, responsive, theme-color, and scroll integration problems without adding them to every Sheet or motion import.

## Focused import

```tsx
import {
  AutoFocusTarget,
  ExternalOverlay,
  Fixed,
  Island,
  Scroll,
  VisuallyHidden,
} from "@velvetui/react/utilities";
import "@velvetui/react/sheet.css";
```

The utilities entry does not pull Toast or any styled composition. Import motion from `@velvetui/react/motion` and SheetStack from `@velvetui/react/sheet`; those capabilities have separate bundle ownership.

## Utility components

| Export | Use |
| --- | --- |
| `VisuallyHidden.Root` | Accessible text without visual layout |
| `AutoFocusTarget` | Explicit initial focus destination |
| `Fixed` | Viewport-fixed content that ignores sheet travel |
| `Island` | Interactive region belonging to the frontmost sheet |
| `ExternalOverlay.Root` | Third-party portal joined to sheet modality |
| `ExternalOverlay.DismissLayer` | Scope enrollment plus frontmost Escape/outside ownership and exit lifecycle |
| `ThemeBackdrop` | Backdrop plus browser theme-color dimming |
| `SheetMorph.Content` | Shared-origin geometry |
| `SheetStack.Root/Outlet` | Nested layer coordination |

```tsx
<Sheet.Content>
  <VisuallyHidden.Root asChild>
    <Sheet.Title>Command palette</Sheet.Title>
  </VisuallyHidden.Root>
  <AutoFocusTarget asChild><input aria-label="Search" /></AutoFocusTarget>
</Sheet.Content>
```

## Portalled third-party UI

```tsx
<ThirdParty.Portal>
  <ExternalOverlay.DismissLayer
    asChild
    open={open}
    onDismiss={() => setOpen(false)}
    restoreFocusRef={triggerRef}
    onExitComplete={releaseOverlaySession}
  >
    <ThirdParty.Positioner />
  </ExternalOverlay.DismissLayer>
</ThirdParty.Portal>
```

Wrap the DOM-bearing popup or positioner inside the third-party Portal, never the Portal or controller itself. `ExternalOverlay.Root` is still available when scope enrollment alone is desired; scope enrollment does not imply dismissal ownership.

## Official adapter entries

```tsx
import { VelvetRadixPopover } from "@velvetui/react/radix";
import { VelvetAriaSelect } from "@velvetui/react/react-aria";
import { VelvetBaseUIPopover } from "@velvetui/react/base-ui";
```

The adapters do not import or style their third-party library. Render one inside that library's portal and slot the real DOM-bearing surface through `asChild`; the library keeps positioning and accessibility while Velvet coordinates scope, frontmost dismissal, and focus return.

[Run the Radix, React Aria, and Base UI recipes](/recipes) to compare the exact portal boundary for each library.

## Inspect and assert

```tsx
import { expectVelvetLayer } from "@velvetui/react/testing";

const layers = window.__velvet.inspect();

expectVelvetLayer(document, {
  role: "dialog",
  frontmost: true,
  restoresFocusTo: trigger,
});
```

`window.__velvet.inspect()` reports scope, parent scope, layer kind, frontmost state, portal container, open/travel status, last dismissal reason, pending dismissal, captured focus, and planned focus targets. The DOM helper also checks the accessible label, one frontmost layer, one Sheet runway, nested positioning, and external scope enrollment.

## Hooks and helpers

| Export | Contract |
| --- | --- |
| `useClientMediaQuery(query)` | Client-safe boolean media match |
| `updateThemeColor(color)` | Updates the active theme-color meta value |
| `useThemeColorDimmingOverlay(options)` | Sets or animates theme dimming opacity |
| `SPRING_PRESETS` from `motion` | gentle, smooth, snappy, brisk, bouncy, elastic |
| `depthSheetVariables` from `depth-sheet` | token keys mapped to CSS variable names |
| `depthSheetDefaultTokens` from `depth-sheet` | values supplied by the composition CSS |
| `depthSheetStackingAnimation` from `depth-sheet` | bounded public Depth travel animation |
