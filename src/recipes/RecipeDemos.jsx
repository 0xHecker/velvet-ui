import { Popover as BasePopover } from "@base-ui/react/popover";
import { Popover as RadixPopover } from "radix-ui";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from "react-aria-components";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lightbox,
  Sheet,
  VelvetAriaPopover,
  VelvetBaseUIPopover,
  VelvetRadixPopover,
} from "../velvet/index.js";
import "./RecipePreview.css";

const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
const botanicalPhoto = "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=82";

const ArrowRight = () => <svg aria-hidden="true" viewBox="0 0 18 18"><path d="M4 9h9M10 5.5 13.5 9 10 12.5" /></svg>;
const SwipeRightArrow = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 18 6-6-6-6" /></svg>;
const ChevronRight = () => <svg aria-hidden="true" viewBox="0 0 18 18"><path d="m7 4.5 4.5 4.5L7 13.5" /></svg>;
const ArrowLeft = () => <svg aria-hidden="true" viewBox="0 0 18 18"><path d="M14 9H5M8 5.5 4.5 9 8 12.5" /></svg>;
const CloseIcon = () => <svg aria-hidden="true" viewBox="0 0 18 18"><path d="m5 5 8 8M13 5l-8 8" /></svg>;
const ImageIcon = () => <svg aria-hidden="true" viewBox="0 0 18 18"><rect x="3" y="3.5" width="12" height="11" rx="2" /><circle cx="7" cy="7.5" r="1" /><path d="m5 12 3-3 2.2 2.2 1.4-1.4L14 12" /></svg>;

function PreviewPanel({ portalContainer, viewProps, modal = true, side, handle, ...props }) {
  return (
    <Sheet.Panel
      {...props}
      side={side}
      handle={handle ?? side === "bottom"}
      modal={modal}
      container={portalContainer}
      viewProps={{
        ...viewProps,
        style: {
          ...viewProps?.style,
          position: "absolute",
          inset: 0,
        },
      }}
    />
  );
}

function Workspace({ title, description, children, status }) {
  return (
    <section className="RecipePreview-workspace">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
      {status && <div className="RecipePreview-status" aria-live="polite">{status}</div>}
    </section>
  );
}

function RouteControlled({ portalContainer }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("The route is settled.");
  const triggerRef = useRef(null);
  const landmarkRef = useRef(null);
  const focusRef = useRef(null);

  useEffect(() => {
    const sync = () => setOpen(new URLSearchParams(location.search).get("panel") === "settings");
    addEventListener("popstate", sync);
    return () => removeEventListener("popstate", sync);
  }, []);

  const writeRoute = (next) => {
    const url = new URL(location.href);
    if (next) url.searchParams.set("panel", "settings");
    else url.searchParams.delete("panel");
    history.pushState({}, "", url);
  };

  return (
    <Workspace
      title="Settings belong to the route."
      description="Open the sheet, then use browser Back. The URL remains the source of truth."
      status={status}
    >
      <div ref={landmarkRef} tabIndex={-1}>
        <Sheet.Root
          open={open}
          initialFocusRef={focusRef}
          restoreFocusRef={triggerRef}
          onOpenChange={(next) => {
            writeRoute(next);
            setOpen(next);
            setStatus(next ? "?panel=settings is active." : "The route is settled.");
          }}
        >
          <Sheet.Trigger ref={triggerRef} className="RecipePreview-primary">Open routed settings <ArrowRight /></Sheet.Trigger>
          <PreviewPanel portalContainer={portalContainer} side="right" className="RecipePreview-sheet RecipePreview-sheet--side">
            <div className="RecipePreview-edgeHandle" aria-hidden="true" title="Swipe right to close" />
            <div className="RecipePreview-sheetHead">
              <div><Sheet.Title>Workspace settings</Sheet.Title><Sheet.Description>The URL owns this surface.</Sheet.Description></div>
              <Sheet.Close className="RecipePreview-iconButton" aria-label="Close settings"><CloseIcon /></Sheet.Close>
            </div>
            <label className="RecipePreview-field"><span>Workspace name</span><input ref={focusRef} defaultValue="Soft launch" /></label>
            <p className="RecipePreview-swipeHint">
              <SwipeRightArrow />
              <span>Swipe right to close</span>
            </p>
          </PreviewPanel>
        </Sheet.Root>
      </div>
    </Workspace>
  );
}

function AsyncEditor({ portalContainer }) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Draft has local changes.");
  const flushDraft = async (detail) => {
    if (!dirty) return true;
    setSaving(true);
    setStatus(`Saving before ${detail.reason}…`);
    await wait(700);
    setDirty(false);
    setSaving(false);
    setStatus("Saved. Dismissal accepted.");
    return true;
  };
  return (
    <Workspace title="Closing is a request." description="Try Close or Escape. Pending edits finish saving before exit begins." status={status}>
      <Sheet.Root open={open} onOpenChange={setOpen} onDismissRequest={flushDraft}>
        <Sheet.Trigger className="RecipePreview-primary">Open editor <ArrowRight /></Sheet.Trigger>
        <PreviewPanel portalContainer={portalContainer} side="bottom" className="RecipePreview-sheet" data-busy={saving}>
          <div className="RecipePreview-sheetHead"><Sheet.Title>Release note</Sheet.Title><Sheet.Close className="RecipePreview-secondary" disabled={saving}>{saving ? "Saving…" : "Save & close"}</Sheet.Close></div>
          <Sheet.Description>Pending edits own dismissal until the save resolves.</Sheet.Description>
          <label className="RecipePreview-field"><span>Summary</span><textarea defaultValue="Improved overlay lifecycle and focus restoration." onChange={() => { setDirty(true); setStatus("Draft has local changes."); }} /></label>
        </PreviewPanel>
      </Sheet.Root>
    </Workspace>
  );
}

function Destructive({ portalContainer }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Project is intact.");
  const cancelRef = useRef(null);
  const remove = async () => {
    setBusy(true);
    setStatus("Deleting project…");
    await wait(850);
    setBusy(false);
    setStatus("Project deleted.");
    setOpen(false);
  };
  return (
    <Workspace title="Destructive work owns the layer." description="The safe action receives focus and dismissal pauses while deletion is in flight." status={status}>
      <Sheet.Root open={open} onOpenChange={setOpen} sheetRole="alertdialog" initialFocusRef={cancelRef} onDismissRequest={() => !busy}>
        <Sheet.Trigger className="RecipePreview-dangerTrigger">Review deletion <ArrowRight /></Sheet.Trigger>
        <PreviewPanel portalContainer={portalContainer} side="center" draggable={false} className="RecipePreview-sheet RecipePreview-sheet--compact">
          <Sheet.Title>Delete Soft launch?</Sheet.Title>
          <Sheet.Description>This permanently removes the project and its deployment history.</Sheet.Description>
          <div className="RecipePreview-row RecipePreview-row--end"><Sheet.Close className="RecipePreview-secondary" ref={cancelRef} disabled={busy}>Keep project</Sheet.Close><button type="button" className="RecipePreview-danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete forever"}</button></div>
        </PreviewPanel>
      </Sheet.Root>
    </Workspace>
  );
}

function NestedNavigation({ portalContainer, tailwind = false }) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState(null);
  const closeRef = useRef(null);
  return (
    <Workspace title={tailwind ? "Tailwind, same structure." : "One library, independent detail."} description="Open the library, then push the host-relative detail panel.">
      <Sheet.Root open={libraryOpen} onOpenChange={setLibraryOpen} initialFocusRef={closeRef}>
        <Sheet.Trigger className="RecipePreview-primary">Browse pattern library <ArrowRight /></Sheet.Trigger>
        <PreviewPanel portalContainer={portalContainer} side="center" draggable={false} className="RecipePreview-sheet RecipePreview-sheet--library">
          <div className="RecipePreview-sheetHead"><div><Sheet.Title>Pattern library</Sheet.Title><Sheet.Description>{tailwind ? "Utility styling leaves gesture geometry to Velvet." : "The parent owns the native scroll chain."}</Sheet.Description></div><Sheet.Close ref={closeRef} className="RecipePreview-iconButton" aria-label="Close pattern library"><CloseIcon /></Sheet.Close></div>
          <Sheet.NestedPortalHost className="RecipePreview-nestedHost">
            <nav className="RecipePreview-patternList" aria-label="Navigation patterns">
              <button type="button" onClick={() => setActiveDetail("command")}><span><small>Mobile navigation</small><strong>Command menu</strong></span><ChevronRight /></button>
              <button type="button" onClick={() => setActiveDetail("account")}><span><small>Nested navigation</small><strong>Account detail</strong></span><ChevronRight /></button>
              <button type="button" onClick={() => setActiveDetail("notifications")}><span><small>Settings</small><strong>Notification routes</strong></span><ChevronRight /></button>
            </nav>
            <Sheet.Root open={activeDetail === "command"} onOpenChange={(open) => !open && setActiveDetail(null)}>
              <Sheet.NestedPanel side="right" className="RecipePreview-detail" onClickOutside={{ dismiss: false }}>
                <div className="RecipePreview-detailNav"><Sheet.Close className="RecipePreview-back"><ArrowLeft /> Library</Sheet.Close><span>Commands</span></div>
                <div className="RecipePreview-detailHead"><Sheet.Title>Command menu</Sheet.Title><span className="RecipePreview-statusPill">Palette</span></div>
                <Sheet.Description>Keyboard-first search and action palette.</Sheet.Description>
                <dl className="RecipePreview-accountList"><div><dt>Search</dt><dd>⌘K shortcut</dd></div><div><dt>Actions</dt><dd>12 registered</dd></div><div><dt>Scope</dt><dd>Global workspace</dd></div></dl>
              </Sheet.NestedPanel>
            </Sheet.Root>
            <Sheet.Root open={activeDetail === "account"} onOpenChange={(open) => !open && setActiveDetail(null)}>
              <Sheet.NestedPanel side="right" className="RecipePreview-detail" onClickOutside={{ dismiss: false }}>
                <div className="RecipePreview-detailNav"><Sheet.Close className="RecipePreview-back"><ArrowLeft /> Library</Sheet.Close><span>Account</span></div>
                <div className="RecipePreview-detailHead"><Sheet.Title>Account detail</Sheet.Title><span className="RecipePreview-statusPill">Active</span></div>
                <Sheet.Description>This layer swipes back without moving the parent.</Sheet.Description>
                <dl className="RecipePreview-accountList"><div><dt>Workspace</dt><dd>Soft launch</dd></div><div><dt>Role</dt><dd>Administrator</dd></div><div><dt>Security</dt><dd>Passkey enabled</dd></div></dl>
              </Sheet.NestedPanel>
            </Sheet.Root>
            <Sheet.Root open={activeDetail === "notifications"} onOpenChange={(open) => !open && setActiveDetail(null)}>
              <Sheet.NestedPanel side="right" className="RecipePreview-detail" onClickOutside={{ dismiss: false }}>
                <div className="RecipePreview-detailNav"><Sheet.Close className="RecipePreview-back"><ArrowLeft /> Library</Sheet.Close><span>Settings</span></div>
                <div className="RecipePreview-detailHead"><Sheet.Title>Notification routes</Sheet.Title><span className="RecipePreview-statusPill">Enabled</span></div>
                <Sheet.Description>Configure push alerts and email delivery rules.</Sheet.Description>
                <dl className="RecipePreview-accountList"><div><dt>Email digest</dt><dd>Daily summary</dd></div><div><dt>Security alerts</dt><dd>Immediate</dd></div><div><dt>Push channel</dt><dd>Web & Mobile</dd></div></dl>
              </Sheet.NestedPanel>
            </Sheet.Root>
          </Sheet.NestedPortalHost>
        </PreviewPanel>
      </Sheet.Root>
    </Workspace>
  );
}

function NestedLightbox({ portalContainer }) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const closeRef = useRef(null);
  return (
    <Workspace title="Three layers, one dismissal stack." description="Open a specimen, then try its confirmation and lightbox.">
      <Sheet.Root open={libraryOpen} onOpenChange={setLibraryOpen} initialFocusRef={closeRef}>
        <Sheet.Trigger className="RecipePreview-primary">Browse botanical archive <ArrowRight /></Sheet.Trigger>
        <PreviewPanel portalContainer={portalContainer} side="center" draggable={false} className="RecipePreview-sheet RecipePreview-sheet--library">
          <div className="RecipePreview-sheetHead"><div><Sheet.Title>Botanical archive</Sheet.Title><Sheet.Description>Each layer keeps its own family and dismissal order.</Sheet.Description></div><Sheet.Close ref={closeRef} className="RecipePreview-iconButton" aria-label="Close botanical archive"><CloseIcon /></Sheet.Close></div>
          <Sheet.NestedPortalHost className="RecipePreview-nestedHost">
            <button type="button" className="RecipePreview-specimen" onClick={() => setDetailOpen(true)}><img src={botanicalPhoto} alt="" /><span><small>Specimen 024</small><strong>Monstera deliciosa</strong><em>Collected in 2024</em></span><ChevronRight /></button>
            <Sheet.Root open={detailOpen} onOpenChange={setDetailOpen}>
              <Sheet.NestedPanel side="right" className="RecipePreview-detail" onClickOutside={{ dismiss: false }}>
                <div className="RecipePreview-detailNav"><Sheet.Close className="RecipePreview-back"><ArrowLeft /> Archive</Sheet.Close><span>024 / 128</span></div>
                <Sheet.Title>Monstera study</Sheet.Title>
                <img className="RecipePreview-photo" src={botanicalPhoto} alt="Close view of green Monstera leaves" />
                <div className="RecipePreview-row">
                  <button type="button" className="RecipePreview-secondary" onClick={() => setConfirmOpen(true)}>Archive</button>
                  <Lightbox.Root>
                    <Lightbox.Trigger className="RecipePreview-primary"><ImageIcon /> Inspect image</Lightbox.Trigger>
                    <Lightbox.Content portalProps={{ container: portalContainer }} viewProps={{ style: { position: "absolute", inset: 0 } }} className="RecipePreview-lightbox">
                      <Lightbox.Title>Monstera leaves</Lightbox.Title><img className="RecipePreview-photo RecipePreview-photo--large" src={botanicalPhoto} alt="Close view of green Monstera leaves" /><Lightbox.Close className="RecipePreview-lightboxClose"><CloseIcon /> Close image</Lightbox.Close>
                    </Lightbox.Content>
                  </Lightbox.Root>
                </div>
                <Sheet.Root open={confirmOpen} onOpenChange={setConfirmOpen} sheetRole="alertdialog">
                  <PreviewPanel portalContainer={portalContainer} side="center" draggable={false} className="RecipePreview-sheet RecipePreview-sheet--compact">
                    <Sheet.Title>Remove this specimen?</Sheet.Title><Sheet.Description>It will move out of the active collection. You can restore it later.</Sheet.Description><div className="RecipePreview-row RecipePreview-row--end"><Sheet.Close className="RecipePreview-secondary">Cancel</Sheet.Close><button type="button" className="RecipePreview-danger" onClick={() => { setConfirmOpen(false); setDetailOpen(false); }}>Archive specimen</button></div>
                  </PreviewPanel>
                </Sheet.Root>
              </Sheet.NestedPanel>
            </Sheet.Root>
          </Sheet.NestedPortalHost>
        </PreviewPanel>
      </Sheet.Root>
    </Workspace>
  );
}

function AdapterSheet({ portalContainer, title, description, children }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeRef = useRef(null);
  return (
    <Workspace title={title} description={description}>
      <Sheet.Root open={sheetOpen} onOpenChange={setSheetOpen} initialFocusRef={closeRef}>
        <Sheet.Trigger className="RecipePreview-primary">Open integration example <ArrowRight /></Sheet.Trigger>
        <PreviewPanel portalContainer={portalContainer} side="center" draggable={false} className="RecipePreview-sheet RecipePreview-sheet--compact">
          <div className="RecipePreview-sheetHead"><div><Sheet.Title>{title}</Sheet.Title><Sheet.Description>{description}</Sheet.Description></div><Sheet.Close ref={closeRef} className="RecipePreview-iconButton" aria-label="Close integration example"><CloseIcon /></Sheet.Close></div>
          {children}
        </PreviewPanel>
      </Sheet.Root>
    </Workspace>
  );
}

function RadixAdapter({ portalContainer }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  return <AdapterSheet portalContainer={portalContainer} title="Team access" description="Radix owns positioning; Velvet owns dismissal order.">
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger className="RecipePreview-settingRow" ref={triggerRef}><span><small>Invite policy</small><strong>Links expire after 7 days</strong></span><span>Change <ChevronRight /></span></RadixPopover.Trigger>
      <RadixPopover.Portal container={portalContainer.current}>
        <VelvetRadixPopover asChild open={open} onDismiss={() => setOpen(false)} restoreFocusRef={triggerRef}>
          <RadixPopover.Content className="RecipePreview-popover" sideOffset={8}><h3>Link expiration</h3><p>Invite links expire after seven days.</p><RadixPopover.Close className="RecipePreview-primary">Save policy</RadixPopover.Close></RadixPopover.Content>
        </VelvetRadixPopover>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  </AdapterSheet>;
}

function AriaAdapter({ portalContainer }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  return <AdapterSheet portalContainer={portalContainer} title="Notification rules" description="React Aria keeps its semantics; Velvet coordinates the surrounding stack.">
    <AriaDialogTrigger isOpen={open} onOpenChange={setOpen}>
      <AriaButton className="RecipePreview-settingRow" ref={triggerRef}><span><small>Notifications</small><strong>Mentions and reviews</strong></span><span>Change <ChevronRight /></span></AriaButton>
      <VelvetAriaPopover asChild open={open} onDismiss={() => setOpen(false)} restoreFocusRef={triggerRef}>
        <AriaPopover UNSTABLE_portalContainer={portalContainer.current} className="RecipePreview-popover"><AriaDialog><h3>Quiet by default</h3><p>Only mentions and assigned reviews will notify you.</p><AriaButton className="RecipePreview-primary" slot="close">Save preference</AriaButton></AriaDialog></AriaPopover>
      </VelvetAriaPopover>
    </AriaDialogTrigger>
  </AdapterSheet>;
}

function BaseAdapter({ portalContainer }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  return <AdapterSheet portalContainer={portalContainer} title="Review settings" description="Base UI owns anchoring; the adapter enrolls its Positioner in Velvet.">
    <BasePopover.Root open={open} onOpenChange={setOpen}>
      <BasePopover.Trigger className="RecipePreview-settingRow" ref={triggerRef}><span><small>Review cadence</small><strong>Daily digest</strong></span><span>Change <ChevronRight /></span></BasePopover.Trigger>
      <BasePopover.Portal container={portalContainer}>
        <VelvetBaseUIPopover asChild open={open} onDismiss={() => setOpen(false)} restoreFocusRef={triggerRef}>
          <BasePopover.Positioner className="RecipePreview-popoverLayer" sideOffset={8}><BasePopover.Popup className="RecipePreview-popover"><BasePopover.Title>Daily digest</BasePopover.Title><BasePopover.Description>Bundle quiet updates into a single summary each morning.</BasePopover.Description><BasePopover.Close className="RecipePreview-primary">Save cadence</BasePopover.Close></BasePopover.Popup></BasePopover.Positioner>
        </VelvetBaseUIPopover>
      </BasePopover.Portal>
    </BasePopover.Root>
  </AdapterSheet>;
}

function ReducedMotion({ portalContainer }) {
  const [open, setOpen] = useState(true);
  const [events, setEvents] = useState([]);
  const reduced = useMemo(() => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  return (
    <Workspace title="Initially open stays open." description="Setup geometry never becomes a false swipe request." status={`motion: ${reduced ? "reduce" : "no-preference"} · requests: ${events.length ? events.join(", ") : "none before interaction"}`}>
      <Sheet.Root open={open} onOpenChange={(next, detail) => { setEvents((list) => [...list, `${next} · ${detail.reason}`]); setOpen(next); }}>
        {!open && <Sheet.Trigger className="RecipePreview-primary">Open sheet again <ArrowRight /></Sheet.Trigger>}
        <PreviewPanel portalContainer={portalContainer} side="bottom" draggable modal={false} className="RecipePreview-sheet" backdrop={false} viewProps={{ enteringAnimationSettings: { skip: "auto" } }}>
          <Sheet.Title>Review queue</Sheet.Title><Sheet.Description>Drag or use the explicit close control.</Sheet.Description><Sheet.Close className="RecipePreview-secondary">Close intentionally</Sheet.Close>
        </PreviewPanel>
      </Sheet.Root>
    </Workspace>
  );
}

function DeletedTrigger({ portalContainer }) {
  const [open, setOpen] = useState(false);
  const [triggerExists, setTriggerExists] = useState(true);
  const [status, setStatus] = useState("Trigger is present.");
  const landmarkRef = useRef(null);
  const restoreFocusRef = useRef(null);
  return (
    <Workspace title="Focus survives a deleted trigger." description="The opener disappears, so focus returns to a stable workspace landmark." status={status}>
      <div ref={landmarkRef} tabIndex={-1}>
        <Sheet.Root open={open} onOpenChange={setOpen} restoreFocusRef={restoreFocusRef} onExitComplete={() => setStatus("Focus returned to the workspace landmark.")}>
          {triggerExists && <Sheet.Trigger className="RecipePreview-primary" onClick={() => { restoreFocusRef.current = landmarkRef.current; setTriggerExists(false); setStatus("Trigger removed while the sheet is open."); }}>Open queued item <ArrowRight /></Sheet.Trigger>}
          <PreviewPanel portalContainer={portalContainer} side="bottom" className="RecipePreview-sheet"><Sheet.Title>Queued item</Sheet.Title><Sheet.Description>The physical trigger no longer exists.</Sheet.Description><Sheet.Close className="RecipePreview-primary">Finish review</Sheet.Close></PreviewPanel>
        </Sheet.Root>
        {!triggerExists && !open && <button type="button" className="RecipePreview-secondary" onClick={() => { setTriggerExists(true); setStatus("Trigger restored."); }}>Restore deleted row</button>}
      </div>
    </Workspace>
  );
}

const demos = {
  "route-controlled-sheet": RouteControlled,
  "async-editor-close": AsyncEditor,
  "destructive-confirmation": Destructive,
  "nested-modal-navigation": NestedNavigation,
  "nested-modal-navigation-tailwind-v4": (props) => <NestedNavigation {...props} tailwind />,
  "nested-detail-confirmation-lightbox": NestedLightbox,
  "radix-popover-in-sheet": RadixAdapter,
  "react-aria-popover-in-sheet": AriaAdapter,
  "base-ui-popover-in-sheet": BaseAdapter,
  "reduced-motion-initial-open": ReducedMotion,
  "deleted-trigger-focus-fallback": DeletedTrigger,
};

export function RecipeDemo({ slug, portalContainer }) {
  const Demo = demos[slug];
  return Demo ? <Demo portalContainer={portalContainer} /> : null;
}
