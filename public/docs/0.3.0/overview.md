# Overview

> Velvet UI is a headless React sheet and toast toolkit built around composable primitives, resilient gestures, and WAAPI-driven motion.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0

Velvet gives React applications native-feeling sheets, stacked surfaces, lightboxes, card expansion, scroll coordination, and toasts. You choose a ready-made composition or assemble the primitives yourself.

## Start in three minutes

```bash
npm install @velvetui/react
# pnpm add @velvetui/react
# yarn add @velvetui/react
# bun add @velvetui/react
```

```tsx
import "@velvetui/react/styles.css";
import { Toaster } from "@velvetui/react/toast";

export function App() {
  return (
    <>
      <YourApp />
      <Toaster position="bottom-right" />
    </>
  );
}
```

Use a composition when its behavior matches your product. Use `Sheet` primitives when you need a different DOM tree, placement, snap model, or visual treatment.

## Pick the right entry point

- `@velvetui/react/sheet` — headless sheet primitives.
- `@velvetui/react/motion` — framework-free spring and WAAPI tools.
- `@velvetui/react/motion/react` — motion hooks with cleanup.
- `@velvetui/react/utilities` — Scroll and integration primitives.
- `@velvetui/react/bottom-sheet` — a production bottom sheet.
- `@velvetui/react/depth-sheet` — iOS-style page recession and nesting.
- `@velvetui/react/card-expansion` — a modal card with shared-origin motion.
- `@velvetui/react/lightbox` — full-screen media with bidirectional dismissal.
- `@velvetui/react/toast` — viewport-fixed feedback.

> Import `sheet.css` with sheet primitives, `toast.css` with an unstyled Toaster, or `base.css` when both families are present. Import the matching composition CSS beside each styled composition.

## The mental model

A sheet has state, a trigger, a portal, a gesture view, a backdrop, and content. `Sheet.Panel` composes those parts for the common case. Every open, drag, snap, and close uses the same travel value and spring model.

If an implementation feels stuck, first ask: who owns `open`, which element scrolls, which direction can dismiss, and whether the page behind should remain interactive?
