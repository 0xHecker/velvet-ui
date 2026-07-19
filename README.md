# Velvet UI

Native-feeling sheets and production-ready toasts for React 18 and 19. Sheet
gestures use the browser's scroll-snap momentum; programmatic travel uses a
fixed-timestep spring sampled into WAAPI.

## Install

```bash
npm install velvet-ui
```

Choose one CSS entry at your application root:

```tsx
// Functional layout only. No surfaces, colors, shadows, or typography.
import "velvet-ui/base.css";

// Or: base styles plus Velvet's optional sheet and toast skin.
import "velvet-ui/styles.css";
```

JavaScript imports have no CSS side effects. Tailwind, CSS Modules,
styled-components, vanilla CSS, and other styling systems can all use the same
unstyled primitives.

## Sheet quick start

`Sheet` is both the root component and a compound namespace. `Sheet.Panel` is
the concise path: it composes the portal, travel view, backdrop, content, and
handle while leaving the lower-level parts available.

```tsx
import { Sheet } from "velvet-ui/sheet";
import "velvet-ui/styles.css";

export function ProfileSheet() {
  return (
    <Sheet>
      <Sheet.Trigger>Edit profile</Sheet.Trigger>

      <Sheet.Panel
        side="bottom"
        className="profile-sheet"
        backdropProps={{ className: "profile-backdrop" }}
      >
        <Sheet.Title>Edit profile</Sheet.Title>
        <Sheet.Description>
          Changes sync across your devices.
        </Sheet.Description>

        <ProfileForm />
        <Sheet.Close>Done</Sheet.Close>
      </Sheet.Panel>
    </Sheet>
  );
}
```

`Sheet.Panel` defaults to a backdrop, a handle, a body portal, bottom
placement, modal behavior, and swipe dismissal. Each can be changed or
disabled:

```tsx
<Sheet.Panel
  side="right"
  snapPoints={["24rem", "90dvw"]}
  modal={false}
  dismissible={false}
  draggable
  portal={false}
  backdrop={false}
  handle={false}
  viewProps={{ enteringAnimationSettings: "snappy" }}
>
  {/* ... */}
</Sheet.Panel>
```

### Controlled state and snap points

```tsx
const [open, setOpen] = useState(false);
const [snap, setSnap] = useState(1);

<Sheet
  open={open}
  onOpenChange={setOpen}
  snap={snap}
  onSnapChange={setSnap}
>
  <Sheet.Trigger>Open queue</Sheet.Trigger>
  <Sheet.Panel side="bottom" snapPoints={["96px", "55dvh"]}>
    <Sheet.Step direction="up">Expand</Sheet.Step>
    <Sheet.Step snapTo={1}>Collapse</Sheet.Step>
    <Sheet.Close>Close</Sheet.Close>
  </Sheet.Panel>
</Sheet>
```

Snap indexes are 1-based. `0` is closed; the final index is fully open.
With snap points, `dismissible={false}` keeps a persistent sheet at its lowest
visible stop instead of letting a swipe dismiss it. Escape and `Sheet.Close`
can still dismiss it.

### Advanced composition

Use the primitives when the backdrop, content, or animated outlets need a
different DOM arrangement:

```tsx
<Sheet.Root>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.View
      side="center"
      tracks={["top", "bottom"]}
      enteringAnimationSettings="snappy"
    >
      <Sheet.Backdrop />
      <Sheet.Content className="dialog">
        <Sheet.Title>Invite teammates</Sheet.Title>
        <Sheet.Description>Choose a workspace role.</Sheet.Description>
        <Sheet.Close>Cancel</Sheet.Close>
      </Sheet.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet.Root>
```

The established API remains supported. Modern aliases map directly onto it:

| Modern | Established alias |
| --- | --- |
| `open`, `defaultOpen`, `onOpenChange` | `presented`, `defaultPresented`, `onPresentedChange` |
| `snap`, `defaultSnap`, `onSnapChange` | `activeDetent`, `defaultActiveDetent`, `onActiveDetentChange` |
| `side` | `contentPlacement` |
| `snapPoints` | `detents` |
| `draggable` | `swipe` |
| `dismissible` | `swipeDismissal` |
| `modal` | `inertOutside` |

If both forms are supplied, the established prop wins. This keeps upgrades
backward-compatible while new code uses familiar React naming.

### Motion customization

```tsx
<Sheet.View
  enteringAnimationSettings="snappy"
  exitingAnimationSettings={{
    easing: "spring",
    stiffness: 350,
    damping: 30,
    mass: 0.65,
  }}
>
  <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.4] }} />
  <Sheet.Content
    travelAnimation={{
      opacity: ({ progress }) => Math.min(progress * 2, 1),
      scale: ({ tween }) => tween(0.96, 1),
    }}
  />
</Sheet.View>
```

Available presets are `gentle`, `smooth`, `snappy`, `brisk`, `bouncy`, and
`elastic`. Presets are atomic; to tune individual values, use a full object
with `easing: "spring"`. Reduced-motion preferences skip spring travel by
default.

## Toasts

Render one `Toaster`, then call `toast` from any client component or event
handler.

```tsx
import { Toaster, toast } from "velvet-ui/toast";

export function App() {
  return (
    <>
      <Routes />
      <Toaster position="bottom-end" visibleToasts={3} />
    </>
  );
}

toast.success("Saved", {
  description: "Everything is up to date.",
  action: {
    label: "Undo",
    onClick: () => undo(),
  },
});
```

### Update and promise flows

Reusing an id updates a toast in place. `toast.update` is the explicit form.

```tsx
const id = toast.loading("Uploading…");
toast.update(id, {
  type: "success",
  message: "Uploaded",
  duration: 3000,
});

await toast.promise(saveDraft(), {
  loading: { message: "Saving…", description: "Draft 4" },
  success: (draft) => ({
    message: `${draft.name} saved`,
    duration: 2500,
  }),
  error: (error) => ({
    message: "Could not save",
    description: error instanceof Error ? error.message : String(error),
    duration: 6000,
  }),
  finally: () => setSaving(false),
});
```

Available commands are `toast`, `toast.success`, `toast.error`, `toast.info`,
`toast.warning`, `toast.message`, `toast.loading`, `toast.custom`,
`toast.update`, `toast.promise`, and `toast.dismiss`.

Toast behavior includes:

- immediate neighboring reflow while a toast exits;
- dynamic-height measurement for loading-to-result updates;
- a visible queue cap with promotion when a slot opens;
- timers paused by hover, keyboard focus, or a hidden tab;
- distance-and-velocity swipe dismissal with elastic wrong-way resistance;
- pointer-cancel recovery and mid-spring re-grab;
- logical `start`/`end` positions and swipe directions in RTL;
- separate polite and assertive live announcers so visual reordering is not
  announced twice;
- <kbd>Alt</kbd>+<kbd>T</kbd> to focus the front toast and <kbd>Escape</kbd> to
  dismiss a focused toast.

### Toast styling

Use `className`, `style`, `classNames`, `toastOptions`, or per-toast overrides.
`unstyled` removes Velvet's skin while retaining positioning and motion.

```tsx
<Toaster
  unstyled
  className="fixed z-50"
  classNames={{
    toast: "rounded-xl border bg-white p-4 shadow-xl",
    title: "font-medium",
    description: "text-sm text-slate-600",
    action: "rounded-md bg-slate-900 px-3 py-2 text-white",
  }}
/>
```

Stable hooks include `data-slot`, `data-state`, `data-type`, `data-position`,
`data-dragging`, and `data-unstyled`. Theme tokens start with
`--velvet-toast-`, including width, offset, radius, surface, foreground,
muted color, accent, and shadow.

## Styling-library integration

- **Tailwind / utility CSS:** pass classes directly; use data variants such as
  `data-[state=exiting]:opacity-0`.
- **CSS Modules / vanilla CSS:** target your classes or stable `data-*` hooks.
- **styled-components / Emotion:** every DOM primitive forwards `className`,
  `style`, and refs; wrap `Sheet.Panel`, `Sheet.Content`, or `Sheet.Trigger`
  normally.
- **Custom elements:** `asChild` merges Velvet behavior onto your element.

`base.css` contains the structural scroll-snap, portal, stack, toast placement,
and visually-hidden announcer rules. `styles.css` adds the optional default
sheet surface, backdrop, handle, toast skin, responsive safe-area offsets, and
dark-mode tokens.

## Accessibility and SSR

`Sheet.Title` and `Sheet.Description` wire the dialog name and description.
Modal sheets restore focus and keep the outside inert. Escape and outside-click
behavior remain configurable; `alertdialog` is non-dismissible by default.

Portals return an empty server result instead of reading `document`, so sheets
can be present in SSR trees. The imperative `toast` store is client process
state; call it from client code, not while rendering a server request.

## Package exports

| Import | Contents |
| --- | --- |
| `velvet-ui` | Full public API |
| `velvet-ui/sheet` | `Sheet`, `SheetStack`, spring presets |
| `velvet-ui/toast` | `Toaster`, `toast` |
| `velvet-ui/base.css` | Unstyled structural CSS |
| `velvet-ui/velvet.css` | Backward-compatible alias of `base.css` |
| `velvet-ui/styles.css` | Structural CSS + optional default theme |

The package ships ESM, CommonJS, source maps, and TypeScript declarations, with
React and React DOM as peer dependencies.

## Development and verification

```bash
npm install
npm run dev
npm run verify

node scripts/gesture-boundaries.mjs
node scripts/preview-hover.mjs
node scripts/stacking.mjs
node scripts/sheet-api.mjs
node scripts/toast.mjs
node scripts/toast-drag.mjs
npm run pack:check
```

The gallery lives in `src/playground`. Motion tests use real browser scroll,
pointer, and keyboard paths through Puppeteer.
