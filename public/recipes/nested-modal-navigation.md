# Nested modal navigation

A centered library with a body-safe native scroller and a right-side detail surface that swipes back independently.

Web recipe: https://velvetui.co/recipes/nested-modal-navigation

Existing StackBlitz project: https://stackblitz.com/edit/vitejs-vite-dptpaa1d?file=App.jsx

## Invariants

- One scroll chain per layer
- Independent accessible labels
- Child closes before parent

## Exercise deliberately

- The original plain-CSS project remains available through Play in StackBlitz.
- The newer primitive removes the manual portal-host positioning shown in the historical reference.

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
