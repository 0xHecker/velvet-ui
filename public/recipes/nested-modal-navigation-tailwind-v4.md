# Nested navigation with Tailwind v4

The same nested modal architecture expressed with Tailwind v4 while preserving structural CSS and gesture handoff.

Web recipe: https://velvetui.co/recipes/nested-modal-navigation-tailwind-v4

Existing StackBlitz project: https://stackblitz.com/edit/vitejs-vite-rrfjnly7?file=App.jsx

## Invariants

- Structural CSS stays imported
- Nested View is host-relative
- Utilities do not own gesture geometry

## Exercise deliberately

- The existing Tailwind v4 project remains available through Play in StackBlitz.
- Sheet.NestedPanel applies host-relative positioning inline, avoiding the layered utility cascade trap.

## App.jsx

```jsx
import { useState } from "react";
import { Sheet } from "@velvetui/react";

export default function App() {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  return <main className="demo">
    <button onClick={() => setLibraryOpen(true)}>Open pattern library</button>
    <Sheet.Root open={libraryOpen} onOpenChange={setLibraryOpen}>
      <Sheet.Panel side="center" draggable={false} className="sheet">
        <Sheet.Title>Pattern library</Sheet.Title>
        <Sheet.Description>The parent owns the native scroll chain.</Sheet.Description>
        <Sheet.NestedPortalHost className="nested-host">
          <button onClick={() => setDetailOpen(true)}>Inspect account detail</button>
          <Sheet.Root open={detailOpen} onOpenChange={setDetailOpen}>
            <Sheet.NestedPanel side="right" className="detail" onClickOutside={{ dismiss: false }}>
              <Sheet.Close>Back</Sheet.Close>
              <Sheet.Title>Account detail</Sheet.Title>
              <Sheet.Description>This layer swipes back without moving the parent.</Sheet.Description>
            </Sheet.NestedPanel>
          </Sheet.Root>
        </Sheet.NestedPortalHost>
      </Sheet.Panel>
    </Sheet.Root>
  </main>;
}
```
