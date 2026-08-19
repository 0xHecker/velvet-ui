const routeControlledSource = String.raw`import { useEffect, useRef, useState } from "react";
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
}`;

const asyncEditorSource = String.raw`import { useRef, useState } from "react";
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
}`;

const destructiveSource = String.raw`import { useRef, useState } from "react";
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
}`;

const nestedLightboxSource = String.raw`import { useState } from "react";
import { Lightbox, Sheet } from "@velvetui/react";

const photo = "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=82";

export default function App() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  return <main className="demo">
    <Sheet.Root defaultOpen>
      <Sheet.Panel side="center" draggable={false} className="sheet">
        <Sheet.Title>Botanical archive</Sheet.Title>
        <Sheet.Description>Three layer families, one dismissal stack.</Sheet.Description>
        <Sheet.NestedPortalHost className="nested-host">
          <div className="library stack"><p>Open a detail, ask for confirmation, then inspect the image.</p><button onClick={() => setDetailOpen(true)}>Open specimen</button></div>
          <Sheet.Root open={detailOpen} onOpenChange={setDetailOpen}>
            <Sheet.NestedPanel side="right" className="detail" onClickOutside={{ dismiss: false }}>
              <div className="sheet-head"><Sheet.Close>Back</Sheet.Close><Sheet.Title>Monstera study</Sheet.Title></div>
              <Sheet.Description>NestedPanel owns host-relative position and clipping.</Sheet.Description>
              <img src={photo} alt="Monstera leaves" />
              <div className="row" style={{marginTop: 16}}><button onClick={() => setConfirmOpen(true)}>Archive</button>
                <Lightbox.Root><Lightbox.Trigger>Inspect image</Lightbox.Trigger><Lightbox.Content><Lightbox.Title>Monstera leaves</Lightbox.Title><img className="lightbox-image" src={photo} alt="Close view of Monstera leaves" /><Lightbox.Close>Close image</Lightbox.Close></Lightbox.Content></Lightbox.Root>
              </div>
              <Sheet.Root open={confirmOpen} onOpenChange={setConfirmOpen} sheetRole="alertdialog"><Sheet.Panel side="center" draggable={false} className="sheet"><Sheet.Title>Archive specimen?</Sheet.Title><Sheet.Description>You can restore it later.</Sheet.Description><div className="row"><Sheet.Close>Cancel</Sheet.Close><button className="danger" onClick={() => { setConfirmOpen(false); setDetailOpen(false); }}>Archive</button></div></Sheet.Panel></Sheet.Root>
            </Sheet.NestedPanel>
          </Sheet.Root>
        </Sheet.NestedPortalHost>
      </Sheet.Panel>
    </Sheet.Root>
  </main>;
}`;

const radixSource = String.raw`import { useRef, useState } from "react";
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
}`;

const reactAriaSource = String.raw`import { useRef, useState } from "react";
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
}`;

const baseUiSource = String.raw`import { useRef, useState } from "react";
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
}`;

const reducedMotionSource = String.raw`import { useMemo, useState } from "react";
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
}`;

const deletedTriggerSource = String.raw`import { useRef, useState } from "react";
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
}`;

const nestedNavigationSource = String.raw`import { useState } from "react";
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
}`;

const workspaceRecipes = {
  "route-controlled-sheet": routeControlledSource,
  "async-editor-close": asyncEditorSource,
  "destructive-confirmation": destructiveSource,
  "nested-detail-confirmation-lightbox": nestedLightboxSource,
  "radix-popover-in-sheet": radixSource,
  "react-aria-popover-in-sheet": reactAriaSource,
  "base-ui-popover-in-sheet": baseUiSource,
  "reduced-motion-initial-open": reducedMotionSource,
  "deleted-trigger-focus-fallback": deletedTriggerSource,
  "nested-modal-navigation": nestedNavigationSource,
  "nested-modal-navigation-tailwind-v4": nestedNavigationSource,
};

export const RECIPE_WORKSPACE_ID = "qdtfcfqo";

const currentSourceRecipe = (slug) => ({
  source: workspaceRecipes[slug],
  sourceFile: `src/recipes/${slug}.jsx`,
  stackblitzId: RECIPE_WORKSPACE_ID,
});

export const RECIPE_CATEGORIES = [
  "All",
  "State & lifecycle",
  "Nested layers",
  "Library adapters",
  "Resilience",
];

export const RECIPES = [
  {
    slug: "route-controlled-sheet",
    category: "State & lifecycle",
    title: "Route-controlled sheet",
    description: "Open from URL state, cold-open without a trigger, and update navigation only after exit motion completes.",
    difficulty: "Intermediate",
    time: "8 min",
    invariants: ["URL state owns open", "Explicit focus targets", "Navigation follows exit completion"],
    notes: ["Reload with ?panel=settings to exercise the triggerless path.", "The real trigger wins when it exists; the page landmark is the cold-open fallback."],
    ...currentSourceRecipe("route-controlled-sheet"),
  },
  {
    slug: "async-editor-close",
    category: "State & lifecycle",
    title: "Async editor close",
    description: "Flush a dirty draft at the dismissal-request boundary before committing controlled state or starting exit motion.",
    difficulty: "Intermediate",
    time: "6 min",
    invariants: ["Request precedes commit", "One pending dismissal", "Exit begins after save"],
    notes: ["Try Escape as well as the close button; both carry a dismissal reason.", "Reject by resolving false when validation or persistence fails."],
    ...currentSourceRecipe("async-editor-close"),
  },
  {
    slug: "destructive-confirmation",
    category: "State & lifecycle",
    title: "Destructive confirmation",
    description: "Give destructive work an alert-dialog role, a safe initial target, and dismissal ownership while the mutation is busy.",
    difficulty: "Intermediate",
    time: "7 min",
    invariants: ["Safe action receives focus", "Busy work rejects dismissal", "Controls communicate pending state"],
    notes: ["Escape and outside press are conservative for alert dialogs.", "Keep the destructive operation idempotent even when the UI is locked."],
    ...currentSourceRecipe("destructive-confirmation"),
  },
  {
    slug: "nested-modal-navigation",
    category: "Nested layers",
    title: "Nested modal navigation",
    description: "A centered library with a body-safe native scroller and a right-side detail surface that swipes back independently.",
    difficulty: "Advanced",
    time: "12 min",
    invariants: ["One scroll chain per layer", "Independent accessible labels", "Child closes before parent"],
    notes: ["The original plain-CSS project remains available through Play in StackBlitz.", "The newer primitive removes the manual portal-host positioning shown in the historical reference."],
    source: workspaceRecipes["nested-modal-navigation"],
    stackblitzId: "vitejs-vite-dptpaa1d",
    sourceFile: "App.jsx",
  },
  {
    slug: "nested-modal-navigation-tailwind-v4",
    category: "Nested layers",
    title: "Nested navigation with Tailwind v4",
    description: "The same nested modal architecture expressed with Tailwind v4 while preserving structural CSS and gesture handoff.",
    difficulty: "Advanced",
    time: "12 min",
    invariants: ["Structural CSS stays imported", "Nested View is host-relative", "Utilities do not own gesture geometry"],
    notes: ["The existing Tailwind v4 project remains available through Play in StackBlitz.", "Sheet.NestedPanel applies host-relative positioning inline, avoiding the layered utility cascade trap."],
    source: workspaceRecipes["nested-modal-navigation-tailwind-v4"],
    stackblitzId: "vitejs-vite-rrfjnly7",
    sourceFile: "App.jsx",
  },
  {
    slug: "nested-detail-confirmation-lightbox",
    category: "Nested layers",
    title: "Detail → confirmation → lightbox",
    description: "Compose host-relative navigation, an alert dialog, and a family-correct Lightbox without losing dismissal order.",
    difficulty: "Advanced",
    time: "10 min",
    invariants: ["NestedPanel owns positioning", "Root families match", "Frontmost layer owns dismissal"],
    notes: ["Open the confirmation and press Escape once: the detail behind it stays mounted.", "Lightbox parts deliberately remain in the Lightbox family."],
    ...currentSourceRecipe("nested-detail-confirmation-lightbox"),
  },
  {
    slug: "radix-popover-in-sheet",
    category: "Library adapters",
    title: "Radix popover in a Sheet",
    description: "Keep Radix positioning and focus behavior while enrolling its portaled Content in Velvet dismissal ownership.",
    difficulty: "Intermediate",
    time: "6 min",
    invariants: ["Wrap Content, not Portal", "Shared scope", "First Escape closes the popover"],
    notes: ["The adapter is headless and adds no Radix peer dependency to Velvet.", "forceMount keeps the DOM-bearing surface available through its controlled lifecycle."],
    ...currentSourceRecipe("radix-popover-in-sheet"),
  },
  {
    slug: "react-aria-popover-in-sheet",
    category: "Library adapters",
    title: "React Aria popover in a Sheet",
    description: "Let React Aria own accessible popover semantics while Velvet coordinates the parent modal and dismissal stack.",
    difficulty: "Intermediate",
    time: "6 min",
    invariants: ["DOM surface forwards its ref", "Explicit controlled open", "Stable focus return"],
    notes: ["React Aria's Popover is the DOM-bearing child of the adapter.", "The same boundary works for Select and Tooltip through their focused adapter exports."],
    ...currentSourceRecipe("react-aria-popover-in-sheet"),
  },
  {
    slug: "base-ui-popover-in-sheet",
    category: "Library adapters",
    title: "Base UI popover in a Sheet",
    description: "Place Velvet's Base UI boundary inside Popover.Portal and slot the real Positioner, leaving Base UI in charge of layout.",
    difficulty: "Intermediate",
    time: "6 min",
    invariants: ["Adapter lives inside Portal", "Positioner is DOM-bearing", "Dismissal stays frontmost-only"],
    notes: ["This is what a Base UI adapter means here: scope, dismissal, and focus coordination—not restyling.", "The separate @velvetui/react/base-ui entry has no runtime peer import."],
    ...currentSourceRecipe("base-ui-popover-in-sheet"),
  },
  {
    slug: "reduced-motion-initial-open",
    category: "Resilience",
    title: "Reduced-motion initial-open sheet",
    description: "Prove that a controlled draggable sheet mounted open never turns setup-time runway normalization into a false close.",
    difficulty: "Focused",
    time: "4 min",
    invariants: ["No false close before input", "Same state machine under reduced motion", "Real dismissal is still reported"],
    notes: ["Use your browser's reduced-motion emulation and reload the preview.", "The event log stays empty until you actually drag or activate Close."],
    ...currentSourceRecipe("reduced-motion-initial-open"),
  },
  {
    slug: "deleted-trigger-focus-fallback",
    category: "Resilience",
    title: "Deleted-trigger focus fallback",
    description: "Restore focus safely when the control that opened a sheet disappears during an optimistic update.",
    difficulty: "Focused",
    time: "4 min",
    invariants: ["Restore target is connected", "No arbitrary timeout", "Exit completion announces settled state"],
    notes: ["The explicit page landmark outlives the optimistic row deletion.", "If the original trigger remains connected, prefer it as the restore target."],
    ...currentSourceRecipe("deleted-trigger-focus-fallback"),
  },
];

export const RECIPE_BY_SLUG = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.slug, recipe])
);

export const getRecipePath = (slug) => `/recipes/${slug}`;
