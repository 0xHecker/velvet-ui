# Deleted-trigger focus fallback

Restore focus safely when the control that opened a sheet disappears during an optimistic update.

Web recipe: https://velvetui.co/recipes/deleted-trigger-focus-fallback

Existing StackBlitz project: https://stackblitz.com/edit/qdtfcfqo?file=src/recipes/deleted-trigger-focus-fallback.jsx

## Invariants

- Restore target is connected
- No arbitrary timeout
- Exit completion announces settled state

## Exercise deliberately

- The explicit page landmark outlives the optimistic row deletion.
- If the original trigger remains connected, prefer it as the restore target.

## App.jsx

```jsx
import { useRef, useState } from "react";
import { Sheet } from "@velvetui/react";

export default function App() {
  const [open, setOpen] = useState(false);
  const [triggerExists, setTriggerExists] = useState(true);
  const [status, setStatus] = useState("Trigger is present.");
  const landmarkRef = useRef(null);
  const restoreFocusRef = useRef(null);
  return <main className="demo"><section className="workspace" ref={landmarkRef} tabIndex={-1}>
    <h1>Focus survives a deleted trigger.</h1><p>The row that opens the sheet is optimistically removed. A stable landmark becomes the explicit fallback.</p>
    <Sheet.Root open={open} onOpenChange={setOpen} restoreFocusRef={restoreFocusRef} onExitComplete={() => setStatus("Focus returned to the workspace landmark.")}>
      {triggerExists && <Sheet.Trigger onClick={() => { restoreFocusRef.current = landmarkRef.current; setTriggerExists(false); setStatus("Trigger removed while the sheet is open."); }}>Open and remove this row</Sheet.Trigger>}
      <Sheet.Panel side="bottom" className="sheet"><Sheet.Title>Queued item</Sheet.Title><Sheet.Description>The physical trigger no longer exists.</Sheet.Description><Sheet.Close>Finish</Sheet.Close></Sheet.Panel>
    </Sheet.Root>
    {!triggerExists && !open && <button onClick={() => { setTriggerExists(true); setStatus("Trigger restored."); }}>Restore row</button>}
    <div className="status" aria-live="polite">{status}</div>
  </section></main>;
}
```
