# Base UI popover in a Sheet

Place Velvet's Base UI boundary inside Popover.Portal and slot the real Positioner, leaving Base UI in charge of layout.

Web recipe: https://velvetui.co/recipes/base-ui-popover-in-sheet

Existing StackBlitz project: https://stackblitz.com/edit/qdtfcfqo?file=src/recipes/base-ui-popover-in-sheet.jsx

## Invariants

- Adapter lives inside Portal
- Positioner is DOM-bearing
- Dismissal stays frontmost-only

## Exercise deliberately

- This is what a Base UI adapter means here: scope, dismissal, and focus coordination—not restyling.
- The separate @velvetui/react/base-ui entry has no runtime peer import.

## App.jsx

```jsx
import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Sheet, VelvetBaseUIPopover } from "@velvetui/react";

export default function App() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  return <main className="demo"><Sheet.Root defaultOpen><Sheet.Panel side="center" draggable={false} className="sheet">
    <Sheet.Title>Review settings</Sheet.Title><Sheet.Description>Base UI owns anchoring; the adapter enrolls its DOM-bearing Positioner in Velvet dismissal order.</Sheet.Description>
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger ref={triggerRef}>Open Base UI popover</Popover.Trigger>
      <Popover.Portal keepMounted>
        <VelvetBaseUIPopover asChild open={open} onDismiss={() => setOpen(false)} restoreFocusRef={triggerRef}>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className="popover"><Popover.Title>Review cadence</Popover.Title><Popover.Description>Bundle quiet updates into a daily digest.</Popover.Description><Popover.Close>Done</Popover.Close></Popover.Popup>
          </Popover.Positioner>
        </VelvetBaseUIPopover>
      </Popover.Portal>
    </Popover.Root>
    <Sheet.Close style={{marginTop: 18}}>Close sheet</Sheet.Close>
  </Sheet.Panel></Sheet.Root></main>;
}
```
