# Async editor close

Flush a dirty draft at the dismissal-request boundary before committing controlled state or starting exit motion.

Web recipe: https://velvetui.co/recipes/async-editor-close

Existing StackBlitz project: https://stackblitz.com/edit/qdtfcfqo?file=src/recipes/async-editor-close.jsx

## Invariants

- Request precedes commit
- One pending dismissal
- Exit begins after save

## Exercise deliberately

- Try Escape as well as the close button; both carry a dismissal reason.
- Reject by resolving false when validation or persistence fails.

## App.jsx

```jsx
import { useRef, useState } from "react";
import { Sheet } from "@velvetui/react";

export default function App() {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Draft has local changes.");
  const titleRef = useRef(null);

  const flushDraft = async (detail) => {
    if (!dirty) return true;
    setSaving(true);
    setStatus("Saving before " + detail.reason + "…");
    await new Promise((resolve) => setTimeout(resolve, 900));
    setDirty(false);
    setSaving(false);
    setStatus("Saved. Dismissal accepted.");
    return true;
  };

  return <main className="demo"><section className="workspace">
    <h1>Closing is a request, not a guess.</h1>
    <p>Try Close or Escape. The editor flushes its draft before the exit starts.</p>
    <Sheet.Root open={open} onOpenChange={setOpen} onDismissRequest={flushDraft} initialFocusRef={titleRef}>
      <Sheet.Trigger>Open editor</Sheet.Trigger>
      <Sheet.Panel side="bottom" className="sheet" data-busy={saving}>
        <div className="sheet-head"><Sheet.Title ref={titleRef} tabIndex={-1}>Release note</Sheet.Title><Sheet.Close disabled={saving}>{saving ? "Saving…" : "Close"}</Sheet.Close></div>
        <Sheet.Description>Pending edits own dismissal until the save resolves.</Sheet.Description>
        <label className="field"><span>Summary</span><textarea defaultValue="Improved overlay lifecycle and focus restoration." onChange={() => setDirty(true)} /></label>
      </Sheet.Panel>
    </Sheet.Root>
    <div className="status" aria-live="polite">{status}</div>
  </section></main>;
}
```
