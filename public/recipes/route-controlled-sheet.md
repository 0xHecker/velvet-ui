# Route-controlled sheet

Open from URL state, cold-open without a trigger, and update navigation only after exit motion completes.

Web recipe: https://velvetui.co/recipes/route-controlled-sheet

Existing StackBlitz project: https://stackblitz.com/edit/qdtfcfqo?file=src/recipes/route-controlled-sheet.jsx

## Invariants

- URL state owns open
- Explicit focus targets
- Navigation follows exit completion

## Exercise deliberately

- Reload with ?panel=settings to exercise the triggerless path.
- The real trigger wins when it exists; the page landmark is the cold-open fallback.

## App.jsx

```jsx
import { useEffect, useRef, useState } from "react";
import { Sheet } from "@velvetui/react";

const routeIsOpen = () => new URLSearchParams(location.search).get("panel") === "settings";

export default function App() {
  const [open, setOpen] = useState(routeIsOpen);
  const [message, setMessage] = useState(routeIsOpen() ? "Cold-opened from the URL." : "Ready.");
  const triggerRef = useRef(null);
  const landmarkRef = useRef(null);
  const initialFocusRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const removeRouteAfterExit = useRef(false);

  useEffect(() => {
    const sync = () => setOpen(routeIsOpen());
    addEventListener("popstate", sync);
    return () => removeEventListener("popstate", sync);
  }, []);

  const writeRoute = (next) => {
    const url = new URL(location.href);
    if (next) url.searchParams.set("panel", "settings");
    else url.searchParams.delete("panel");
    history.pushState({}, "", url);
  };

  return <main className="demo">
    <section className="workspace" ref={landmarkRef} tabIndex={-1}>
      <h1>Settings belong to the route.</h1>
      <p>Open the sheet, reload the preview, or use the browser back button. Focus still has a stable place to return.</p>
      <Sheet.Root
        open={open}
        initialFocusRef={initialFocusRef}
        restoreFocusRef={restoreFocusRef}
        onOpenChange={(next) => {
          if (next) {
            restoreFocusRef.current = triggerRef.current || landmarkRef.current;
            writeRoute(true);
            setOpen(true);
          } else {
            removeRouteAfterExit.current = true;
            setOpen(false);
          }
        }}
        onExitComplete={() => {
          if (removeRouteAfterExit.current) writeRoute(false);
          removeRouteAfterExit.current = false;
          setMessage("Exit finished; route and focus are settled.");
        }}
      >
        <Sheet.Trigger ref={triggerRef}>Open routed settings</Sheet.Trigger>
        <Sheet.Panel side="right" className="sheet">
          <div className="sheet-head"><Sheet.Title>Workspace settings</Sheet.Title><Sheet.Close>Close</Sheet.Close></div>
          <Sheet.Description>The URL is the source of truth for this surface.</Sheet.Description>
          <label className="field"><span>Workspace name</span><input ref={initialFocusRef} defaultValue="Soft launch" /></label>
          <p className="hint">→ Swipe right to close</p>
        </Sheet.Panel>
      </Sheet.Root>
      <div className="status" aria-live="polite">{message}</div>
    </section>
  </main>;
}
```
