# Depth Sheet

> DepthSheet gives a full-width surface the visual hierarchy of iOS stacked sheets by scaling and rounding the page behind it.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/depth-sheet

Depth Sheet creates an iOS-like hierarchy: the current page recedes, rounds, and dims while the new full-width surface rises. It uses the actual page as the backing layer.

## Basic depth sheet

```tsx
import { DepthSheet } from "@velvetui/react/depth-sheet";
import "@velvetui/react/sheet.css";
import "@velvetui/react/depth-sheet.css";

<DepthSheet.Root>
  <DepthSheet.Page asChild>
    <main><DepthSheet.Trigger>Open profile</DepthSheet.Trigger></main>
  </DepthSheet.Page>
  <DepthSheet.Content>
    <DepthSheet.Title>Mara Vale</DepthSheet.Title>
    <Profile />
  </DepthSheet.Content>
</DepthSheet.Root>
```

`Page` must wrap the page that should visually recede. `Content` remains a normal authored surface and may contain another Depth Sheet.

## Nest any number of sheets

```tsx
<DepthSheet.Root>
  <DepthSheet.Page><Home /></DepthSheet.Page>
  <DepthSheet.Content>
    <Profile />
    <DepthSheet.Root>
      <DepthSheet.Trigger>Open field note</DepthSheet.Trigger>
      <DepthSheet.Content>
        <FieldNote />
        <DepthSheet.Root>{/* third layer */}</DepthSheet.Root>
      </DepthSheet.Content>
    </DepthSheet.Root>
  </DepthSheet.Content>
</DepthSheet.Root>
```

Each nested root joins the nearest coordinator. Transforms are bounded, so a deep stack remains legible rather than shrinking every older layer indefinitely.

## Tune depth without rewriting motion

```tsx
<DepthSheet.Root tokens={{
  shift: "16px",
  scaleLoss: 0.055,
  dimming: 0.085,
  radius: "28px",
}}>
  ...
</DepthSheet.Root>
```

The same values are exposed as `--velvet-depth-*` variables. Use props for component-level tokens and CSS variables for responsive or theme-based changes.

## The three Depth exports

| Export | What it actually contains | Typical use |
| --- | --- | --- |
| `depthSheetVariables` | token key to CSS custom-property name | computed style keys and CSS-in-JS |
| `depthSheetDefaultTokens` | values shipped by `depth-sheet.css` | inspect or extend the default material |
| `depthSheetStackingAnimation` | bounded `TravelAnimation` used by Page and nested Content | reuse or shallow-copy one property |

```tsx
import {
  DepthSheet,
  depthSheetDefaultTokens,
  depthSheetStackingAnimation,
  depthSheetVariables,
} from "@velvetui/react/depth-sheet";

const rootStyle = {
  [depthSheetVariables.shadow]: "0 -18px 56px rgb(0 0 0 / 22%)",
};

const softerStack = {
  ...depthSheetStackingAnimation,
  filter: ({ progress }) => `brightness(${1 - Math.min(progress, 3) * .06})`,
};
```

`depthSheetVariables` contains names such as `--velvet-depth-shadow`; it does not contain values. `depthSheetDefaultTokens` contains the matching default values. `depthSheetStackingAnimation` is motion, not a configuration object.

## Defensive bounds

Numeric token props are normalized: scale loss and dimming stay between 0 and 0.25, minimum scale stays between 0.5 and 1, and minimum brightness stays between 0.4 and 1. Invalid token names, non-finite numbers, and empty values are ignored.

CSS-authored values still use browser validation. The supplied stacking animation clamps scale, brightness, radius, and shift at every depth, so ten nested surfaces retain a usable hierarchy.
