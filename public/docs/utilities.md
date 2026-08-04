# Utilities

> Utilities cover scroll coordination, visually hidden labels, autofocus targets, fixed surfaces, islands, and external overlays.

Web: https://velvetui.co/docs/utilities

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
<ExternalOverlay.Root asChild>
  <ThirdPartyDatePickerPortal />
</ExternalOverlay.Root>
```

Without this wrapper, a modal sheet can treat the third-party portal as outside content and make it inert.

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
