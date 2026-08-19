# Destructive confirmation

Give destructive work an alert-dialog role, a safe initial target, and dismissal ownership while the mutation is busy.

Web recipe: https://velvetui.co/recipes/destructive-confirmation

Existing StackBlitz project: https://stackblitz.com/edit/qdtfcfqo?file=src/recipes/destructive-confirmation.jsx

## Invariants

- Safe action receives focus
- Busy work rejects dismissal
- Controls communicate pending state

## Exercise deliberately

- Escape and outside press are conservative for alert dialogs.
- Keep the destructive operation idempotent even when the UI is locked.

## App.jsx

```jsx
import { useRef, useState } from "react";
import { Sheet } from "@velvetui/react";

export default function App() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Project is intact.");
  const cancelRef = useRef(null);

  const remove = async () => {
    setBusy(true);
    setStatus("Deleting project…");
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setStatus("Project deleted.");
    setBusy(false);
    setOpen(false);
  };

  return <main className="demo"><section className="workspace">
    <h1>Destructive work owns the layer.</h1>
    <p>The alert dialog starts on the safe action and cannot dismiss while deletion is in flight.</p>
    <button onClick={() => setOpen(true)}>Delete project</button>
    <Sheet.Root open={open} onOpenChange={setOpen} sheetRole="alertdialog" initialFocusRef={cancelRef} onDismissRequest={() => !busy}>
      <Sheet.Panel side="center" draggable={false} className="sheet" data-busy={busy}>
        <Sheet.Title>Delete Soft launch?</Sheet.Title>
        <Sheet.Description>This permanently removes the project and its deployment history.</Sheet.Description>
        <div className="row"><Sheet.Close ref={cancelRef} disabled={busy}>Keep project</Sheet.Close><button className="danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete forever"}</button></div>
      </Sheet.Panel>
    </Sheet.Root>
    <div className="status" aria-live="polite">{status}</div>
  </section></main>;
}
```
