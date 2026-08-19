# Installation

> Install Velvet UI, then import the structural stylesheet required by the primitive or composition you use.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/installation

Install the package once, then choose either the complete stylesheet or granular CSS entries. Velvet supports React 18 and 19 and does not require a styling runtime.

## Install

```bash
npm install @velvetui/react
# pnpm add @velvetui/react
# yarn add @velvetui/react
# bun add @velvetui/react
```

## Add CSS at the application boundary

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

`styles.css` includes structural rules and every supplied skin. For a smaller bundle, import `sheet.css` or `toast.css` and only the composition CSS you use. `base.css` is the convenience structural entry when the application uses both Sheet and Toast.

## Framework placement

- Vite or TanStack Start: import CSS in the client root or root route.
- Next.js App Router: import CSS from `app/layout.tsx`.
- Remix or React Router: import CSS through the root route stylesheet mechanism.
- Component libraries: keep CSS imports in the consuming application so bundlers preserve order.

Render triggers during SSR as normal. Portals mount after hydration, so the page remains valid HTML without duplicating modal content.

## Verify the setup

```tsx
import { Sheet } from "@velvetui/react/sheet";
import "@velvetui/react/sheet.css";

export function SettingsSheet() {
  return (
    <Sheet.Root>
      <Sheet.Trigger className="button">Open settings</Sheet.Trigger>
      <Sheet.Panel side="bottom" className="settings-sheet">
        <Sheet.Title>Settings</Sheet.Title>
        <Sheet.Description>Choose how the workspace behaves.</Sheet.Description>
        <SettingsForm />
        <Sheet.Close className="button">Done</Sheet.Close>
      </Sheet.Panel>
    </Sheet.Root>
  );
}
```

If the trigger renders but nothing opens, confirm that `sheet.css`, `base.css`, or `styles.css` is loaded and that no ancestor applies `display: none` or a global `pointer-events: none` rule to portal content.
