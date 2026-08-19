# Radix popover in a Sheet

Keep Radix positioning and focus behavior while enrolling its portaled Content in Velvet dismissal ownership.

Web recipe: https://velvetui.co/recipes/radix-popover-in-sheet

Existing StackBlitz project: https://stackblitz.com/edit/qdtfcfqo?file=src/recipes/radix-popover-in-sheet.jsx

## Invariants

- Wrap Content, not Portal
- Shared scope
- First Escape closes the popover

## Exercise deliberately

- The adapter is headless and adds no Radix peer dependency to Velvet.
- forceMount keeps the DOM-bearing surface available through its controlled lifecycle.

## App.jsx

```jsx
import { useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Sheet, VelvetRadixPopover } from "@velvetui/react";

export default function App() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  return <main className="demo"><Sheet.Root defaultOpen><Sheet.Panel side="center" draggable={false} className="sheet">
    <Sheet.Title>Team access</Sheet.Title><Sheet.Description>The Radix portal joins this Sheet scope and owns the first Escape.</Sheet.Description>
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger ref={triggerRef}>Open Radix popover</Popover.Trigger>
      <Popover.Portal forceMount>
        <VelvetRadixPopover asChild open={open} onDismiss={() => setOpen(false)} restoreFocusRef={triggerRef}>
          <Popover.Content forceMount className="popover" sideOffset={8}><p>Invite links expire after seven days.</p><Popover.Close>Done</Popover.Close></Popover.Content>
        </VelvetRadixPopover>
      </Popover.Portal>
    </Popover.Root>
    <Sheet.Close style={{marginTop: 18}}>Close sheet</Sheet.Close>
  </Sheet.Panel></Sheet.Root></main>;
}
```
