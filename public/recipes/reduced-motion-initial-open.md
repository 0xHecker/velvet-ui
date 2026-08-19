# Reduced-motion initial-open sheet

Prove that a controlled draggable sheet mounted open never turns setup-time runway normalization into a false close.

Web recipe: https://velvetui.co/recipes/reduced-motion-initial-open

Existing StackBlitz project: https://stackblitz.com/edit/qdtfcfqo?file=src/recipes/reduced-motion-initial-open.jsx

## Invariants

- No false close before input
- Same state machine under reduced motion
- Real dismissal is still reported

## Exercise deliberately

- Use your browser's reduced-motion emulation and reload the preview.
- The event log stays empty until you actually drag or activate Close.

## App.jsx

```jsx
import { useMemo, useState } from "react";
import { Sheet } from "@velvetui/react";

export default function App() {
  const [open, setOpen] = useState(true);
  const [events, setEvents] = useState([]);
  const reduced = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  return <main className="demo"><section className="workspace">
    <h1>Initially open stays open.</h1><p>This controlled draggable sheet records every open-state request. Setup geometry is never interpreted as a swipe.</p>
    <div className="event-log" aria-live="polite">motion: {reduced ? "reduce" : "no-preference"}{"\n"}requests: {events.length ? events.join("\n") : "none before interaction"}</div>
    <Sheet.Root open={open} onOpenChange={(next, detail) => { setEvents((list) => [...list, String(next) + " · " + detail.reason]); setOpen(next); }}>
      <Sheet.Panel side="bottom" draggable className="sheet" viewProps={{ enteringAnimationSettings: { skip: "auto" } }}>
        <Sheet.Title>Queue</Sheet.Title><Sheet.Description>Drag or use the explicit close control when you are ready.</Sheet.Description><Sheet.Close>Close intentionally</Sheet.Close>
      </Sheet.Panel>
    </Sheet.Root>
  </section></main>;
}
```
