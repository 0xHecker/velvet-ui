# Composition API

> Compare every supplied composition, its parts, defaults, escape hatches, and CSS contract.

Web: https://velvetui.co/docs/composition-api

Compositions are small wrappers around Sheet primitives. They set good interaction defaults, emit stable data hooks, and expose the underlying part props instead of hiding them.

## Shared Content escape hatches

| Prop | Bottom | Persistent | Depth | Card | Lightbox |
| --- | --- | --- | --- | --- | --- |
| `portalProps` | yes | yes | yes | yes | yes |
| `viewProps` | yes | yes | yes | yes | yes |
| `backdrop` / `backdropProps` | yes | no backdrop | yes | yes | yes |
| `handle` / `handleProps` | yes | yes | yes | no | no |
| `bleedingBackgroundProps` | yes | yes | yes | no | no |
| `scroll` | yes | yes | always | yes | no |
| `scrollRootProps` | yes | yes | yes | yes | no |
| `scrollViewProps` | yes | yes | yes | yes | no |
| `scrollContentProps` | yes | yes | yes | yes | no |
| `from` | no | no | no | yes | no |

## BottomSheet

Parts: Root, Trigger, Content, Close, Step, Title, Description, Handle.

Defaults: bottom placement, automatic scroll handoff, edge-swipe prevention, backdrop, handle, and coordinated scrolling.

```tsx
import { BottomSheet } from "@velvetui/react/bottom-sheet";
import "@velvetui/react/sheet.css";
import "@velvetui/react/bottom-sheet.css";

<BottomSheet.Root>
  <BottomSheet.Trigger>Open cart</BottomSheet.Trigger>
  <BottomSheet.Content
    viewProps={{ snapPoints: ["42lvh", "82lvh"] }}
    scrollViewProps={{ safeArea: "visual-viewport" }}
  >
    <BottomSheet.Title>Your cart</BottomSheet.Title>
    <Cart />
  </BottomSheet.Content>
</BottomSheet.Root>
```

## PersistentSheet

Parts match BottomSheet. Defaults: `88px` collapsed detent, a full detent bounded at 720px, `dismissible={false}`, `modal={false}`, and no backdrop.

The outer view is click-through while the sheet content remains interactive. Override defaults through `viewProps` only when the new policy is intentional.

## CardExpansion

Parts: Root, Trigger, Content, Close, Title, Description.

Defaults: center placement, top and bottom dismissal, no swipe overshoot, trigger morph, backdrop, and coordinated scrolling.

`from` accepts `"trigger"`, an Element, a ref, or a falsy value. Set `from={false}` to keep modal scale travel without source geometry.

## Lightbox

Parts: Root, Trigger, Content, Close, Title, Description.

Defaults: full-screen center surface, top and bottom dismissal, no swipe overshoot, black theme backdrop, and scale/fade travel.

## DepthSheet

Parts: Root, Page, Content, Trigger, Close, Step, Title, Description, Handle.

Root accepts Sheet state props plus `tokens`, `sheetProps`, `id`, className, style, and DOM props. Page accepts `stackingAnimation`. Content exposes the shared escape hatches above.

Nested roots reuse the nearest portal host and stack coordinator. There is no supported-depth limit.

## Depth tokens

| Token prop | CSS variable | Default |
| --- | --- | --- |
| `inset` | `--velvet-depth-inset` | safe-area max 24px |
| `radius` | `--velvet-depth-radius` | 28px |
| `shift`, `shiftLimit` | shift variables | 14px, 80px |
| `scaleLoss`, `scaleMinimum` | scale variables | 0.06, 0.76 |
| `radiusStep`, `radiusLimit` | radius variables | 2px, 42px |
| `dimming`, `brightnessMinimum` | brightness variables | 0.1, 0.7 |
| color and shadow props | matching variables | composition defaults |
