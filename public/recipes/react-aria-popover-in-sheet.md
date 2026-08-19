# React Aria popover in a Sheet

Let React Aria own accessible popover semantics while Velvet coordinates the parent modal and dismissal stack.

Web recipe: https://velvetui.co/recipes/react-aria-popover-in-sheet

Existing StackBlitz project: https://stackblitz.com/edit/qdtfcfqo?file=src/recipes/react-aria-popover-in-sheet.jsx

## Invariants

- DOM surface forwards its ref
- Explicit controlled open
- Stable focus return

## Exercise deliberately

- React Aria's Popover is the DOM-bearing child of the adapter.
- The same boundary works for Select and Tooltip through their focused adapter exports.

## App.jsx

```jsx
import { useRef, useState } from "react";
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { Sheet, VelvetAriaPopover } from "@velvetui/react";

export default function App() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  return <main className="demo"><Sheet.Root defaultOpen><Sheet.Panel side="center" draggable={false} className="sheet">
    <Sheet.Title>Notification rules</Sheet.Title><Sheet.Description>React Aria keeps positioning and semantics; Velvet coordinates the surrounding modal stack.</Sheet.Description>
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <Button ref={triggerRef}>Open React Aria popover</Button>
      <VelvetAriaPopover asChild open={open} onDismiss={() => setOpen(false)} restoreFocusRef={triggerRef}>
        <Popover className="popover"><Dialog><p>Only mentions and assigned reviews will notify you.</p><Button slot="close">Done</Button></Dialog></Popover>
      </VelvetAriaPopover>
    </DialogTrigger>
    <Sheet.Close style={{marginTop: 18}}>Close sheet</Sheet.Close>
  </Sheet.Panel></Sheet.Root></main>;
}
```
