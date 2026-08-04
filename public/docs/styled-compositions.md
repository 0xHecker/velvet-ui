# Styled compositions

> Styled compositions package the visual grammar for common interactions while preserving the underlying primitive API.

Web: https://velvetui.co/docs/styled-compositions

Start with a composition when its behavior matches the task. Drop to Sheet primitives only when the DOM, placement, tracks, or visual layers need a different contract.

## Decision table

| Need | Use |
| --- | --- |
| Mobile detail, picker, checkout, short task | BottomSheet |
| Tool or media control that must remain present | PersistentSheet |
| Hierarchical full-width navigation with backing-page depth | DepthSheet |
| A normal card that expands into a modal | CardExpansion |
| Immersive photo or media | Lightbox |
| Drawer, top sheet, modal, detached, full-screen, parallax | Sheet primitives |

## Compositions stay headless where it matters

Every Content forwards refs and DOM props and supports `asChild`. Supply your own `view`, `backdrop`, `handle`, and `bleedingBackground` elements where that part exists; Velvet composes primitive behavior onto those nodes.

`viewProps`, `portalProps`, and part-specific prop bags reach the underlying primitive. The supplied CSS establishes responsive geometry and safe-area behavior, while color and product layout remain overrideable through variables, classes, or replacement components. See [Bring your own components](/docs/custom-components).

## Imports

```tsx
import { BottomSheet } from "@velvetui/react/bottom-sheet";
import { CardExpansion } from "@velvetui/react/card-expansion";
import { DepthSheet } from "@velvetui/react/depth-sheet";
import { Lightbox } from "@velvetui/react/lightbox";
import { PersistentSheet } from "@velvetui/react/persistent-sheet";
```
