<p align="center">
  <img src="https://raw.githubusercontent.com/0xHecker/velvetui-support/main/codex-clipboard-0e5fefd8-81b6-4328-ad3b-9ee1681587ea.png" alt="Velvet UI" width="640" />
</p>

# Velvet UI

Native-feeling sheets, production-ready toasts, and spring motion for React 18 and 19.

Velvet uses browser scroll-snap momentum for direct manipulation and sampled springs through the Web Animations API for programmatic motion.

- Headless primitives with optional production-ready compositions
- Bottom, top, side, center, persistent, stacked, and morphing sheets
- Accessible dialogs, focus management, keyboard controls, and SSR safety
- Promise-aware toasts with gestures, queues, live regions, and RTL support
- Framework-free motion utilities with React hooks when you need them
- ESM, CommonJS, TypeScript declarations, and tree-shakable subpath exports

[Documentation](https://velvetui.co/docs) · [Live recipes](https://velvetui.co/recipes) · [Examples](https://velvetui.co) · [Licensing](https://velvetui.co/?license=open)

## Install

```bash
npm install @velvetui/react
# pnpm add @velvetui/react
# yarn add @velvetui/react
# bun add @velvetui/react
```

React and React DOM are peer dependencies:

```bash
npm install react react-dom
# pnpm add react react-dom
# yarn add react react-dom
# bun add react react-dom
```

## Start in 60 seconds

Import one stylesheet at your application root:

```tsx
import "@velvetui/react/styles.css";
```

Add a sheet and one toaster:

```tsx
import { Sheet } from "@velvetui/react/sheet";
import { Toaster, toast } from "@velvetui/react/toast";
import "@velvetui/react/styles.css";

export function App() {
  return (
    <>
      <Sheet>
        <Sheet.Trigger>Edit profile</Sheet.Trigger>

        <Sheet.Panel side="bottom">
          <Sheet.Title>Edit profile</Sheet.Title>
          <Sheet.Description>
            Changes sync across your devices.
          </Sheet.Description>

          <button onClick={() => toast.success("Saved")}>Save</button>
          <Sheet.Close>Done</Sheet.Close>
        </Sheet.Panel>
      </Sheet>

      <Toaster position="bottom-end" />
    </>
  );
}
```

`Sheet.Panel` supplies the portal, travel view, backdrop, content, and handle. Its defaults give you a modal bottom sheet with swipe dismissal.

## Choose your CSS

JavaScript imports have no CSS side effects. Import only the structural rules and optional skins your application needs.

| Import | Use it for |
| --- | --- |
| `@velvetui/react/sheet.css` | Structural Sheet, Scroll, portal, and stack rules |
| `@velvetui/react/toast.css` | Structural Toaster rules without the default skin |
| `@velvetui/react/toast-theme.css` | Toaster structure plus the default skin |
| `@velvetui/react/base.css` | Sheet and Toaster structure without composition skins |
| `@velvetui/react/styles.css` | All structure and every optional default skin |

Composition styles are separate. Import them only with the matching component:

```tsx
import "@velvetui/react/depth-sheet.css";
import "@velvetui/react/card-expansion.css";
import "@velvetui/react/bottom-sheet.css";
import "@velvetui/react/persistent-sheet.css";
import "@velvetui/react/lightbox.css";
```

## Sheets

### The concise API

Use `Sheet.Panel` for most product surfaces:

```tsx
<Sheet defaultOpen>
  <Sheet.Trigger>Open filters</Sheet.Trigger>

  <Sheet.Panel
    side="right"
    className="filters"
    backdropProps={{ className: "filters-backdrop" }}
  >
    <Sheet.Title>Filters</Sheet.Title>
    <Sheet.Description>Narrow the visible results.</Sheet.Description>
    <Filters />
    <Sheet.Close>Apply</Sheet.Close>
  </Sheet.Panel>
</Sheet>
```

Change or disable the composed parts when needed:

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
  {/* content */}
</Sheet.Panel>
```

Supported sides are `top`, `right`, `bottom`, `left`, and `center`.

### Bring your own components

Velvet can own the interaction without owning the visible elements. Use `asChild` for your buttons, headings, and sheet surface:

```tsx
<Sheet.Root>
  <Sheet.Trigger asChild>
    <ProductButton>Open workspace</ProductButton>
  </Sheet.Trigger>

  <Sheet.Panel
    asChild
    view={<ProductView />}
    backdrop={<ProductBackdrop />}
    handle={<ProductGrip aria-label="Resize workspace" />}
  >
    <ProductSurface>
      <Sheet.Title asChild><ProductHeading /></Sheet.Title>
      <Workspace />
      <Sheet.Close asChild><ProductButton>Done</ProductButton></Sheet.Close>
    </ProductSurface>
  </Sheet.Panel>
</Sheet.Root>
```

`ProductSurface` is the real panel node. The supplied `view`, `backdrop`, and `handle` are also the real behavioral nodes—Velvet composes refs, ARIA/data attributes, events, and gesture mechanics onto them.

The styled compositions expose the same pattern:

```tsx
<BottomSheet.Content
  asChild
  view={<ProductView />}
  backdrop={<ProductBackdrop />}
  handle={<ProductGrip aria-label="Resize cart" />}
  bleedingBackground={<ProductBackground />}
>
  <ProductSurface><Cart /></ProductSurface>
</BottomSheet.Content>
```

For `backdrop`, `handle`, and `bleedingBackground`:

| Value | Result |
| --- | --- |
| `true` | Render Velvet's default part |
| `false` or `null` | Remove the part |
| `<YourComponent />` | Use your component with Velvet behavior |

Custom components must forward their ref, children, and received DOM props to one DOM element. The child event runs first; `event.preventDefault()` intentionally cancels the Velvet action. `asChild` accepts exactly one non-Fragment element.

See [Bring your own components](https://velvetui.co/docs/custom-components) for full design-system, custom-scroll, and troubleshooting examples.

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

Snap indexes are 1-based. Index `0` is closed, while the final index is fully open.

With snap points, `dismissible={false}` keeps the sheet at its lowest visible stop during a swipe. Escape and `Sheet.Close` can still dismiss it.

### Advanced composition

Use the primitives when you need full control over the DOM:

```tsx
<Sheet.Root>
  <Sheet.Trigger>Invite teammates</Sheet.Trigger>

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

The primitive namespace includes `Root`, `Trigger`, `Portal`, `View`, `Backdrop`, `Content`, `BleedingBackground`, `Handle`, `Close`, `Step`, `Title`, `Description`, and `Outlet`.

### Gesture tracks

`tracks` chooses the directions that can manipulate or dismiss a sheet:

```tsx
<Sheet.View side="center" tracks={["top", "bottom"]}>
  {/* content */}
</Sheet.View>
```

Use `tracks="auto"` with a nested `Scroll.View`. Velvet keeps stable bidirectional sheet geometry; native scroll chaining hands a downward gesture to the bottom track at the content start and an upward gesture to the top track at the content end. Ordinary content scrolling never rebuilds the sheet or interrupts a click.

### Coordinated scrolling

```tsx
import { Scroll } from "@velvetui/react/utilities";

<Sheet>
  <Sheet.Trigger>Read article</Sheet.Trigger>

  <Sheet.Portal>
    <Sheet.View side="center" tracks="auto">
      <Sheet.Content asChild>
        <Scroll.Root asChild>
          <Scroll.View className="article-scroll">
            <Scroll.Content>
              <Article />
            </Scroll.Content>
          </Scroll.View>
        </Scroll.Root>
      </Sheet.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet>
```

`Scroll.View` defaults to `safeArea="visual-viewport"` for software-keyboard avoidance. It restores the previous position after focus leaves.

For stable Chromium keyboard behavior, include this viewport value:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, interactive-widget=resizes-content"
/>
```

### Nested sheet inside a modal

Use the host/panel pair when a child sheet must stay physically clipped by a parent modal:

```tsx
<Sheet.Root>
  <Sheet.Trigger type="button">Open library</Sheet.Trigger>
  <Sheet.NestedPortalHost asChild>
    <Sheet.Panel side="center" className="library-modal">
      <Sheet.Title>Component library</Sheet.Title>

      <Sheet.Root>
        <Sheet.Trigger type="button">Open component</Sheet.Trigger>
        <Sheet.NestedPanel side="right" className="nested-detail">
          <Sheet.Title>Component details</Sheet.Title>
          <Scroll.Root>
            <Scroll.View>
              <Scroll.Content>{/* scrollable detail */}</Scroll.Content>
            </Scroll.View>
          </Scroll.Root>
        </Sheet.NestedPanel>
      </Sheet.Root>
    </Sheet.Panel>
  </Sheet.NestedPortalHost>
</Sheet.Root>
```

Keep the parent title outside the child Root and use one `Scroll.Root → Scroll.View → Scroll.Content` chain per layer. `NestedPortalHost` owns relative clipping and `NestedPanel` applies host-relative positioning inline, including under Tailwind v4's layered cascade. Back, Close, and row triggers should be `<button type="button">`—never `href="#"`.

See the complete responsive CSS, Tailwind CSS v4, and directly embedded StackBlitz projects in [Nested modal navigation](https://velvetui.co/docs/nested-modal-navigation), or browse the [live recipe workbench](https://velvetui.co/recipes).

### Dismissal lifecycle and route focus

Controlled dismissal exposes its reason and can be accepted asynchronously before state commits:

```tsx
<Sheet.Root
  open={open}
  initialFocusRef={headingRef}
  restoreFocusRef={pageLandmarkRef}
  onDismissRequest={async (detail) => saveBeforeClose(detail.reason)}
  onOpenChange={(next, detail) => {
    analytics.track("sheet request", detail.reason);
    setOpen(next);
  }}
  onExitComplete={removeSheetRoute}
>
  <Sheet.Panel side="right">...</Sheet.Panel>
</Sheet.Root>
```

Requests report `trigger`, `close-trigger`, `escape`, `outside-press`, `swipe`, or `programmatic`. Returning or resolving `false` rejects dismissal without starting exit motion. Use `onEnterComplete` and `onExitComplete` for lifecycle work instead of interpreting travel states.

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

Spring presets are `gentle`, `smooth`, `snappy`, `brisk`, `bouncy`, and `elastic`. Pass a full spring object to tune individual values.

Reduced-motion preferences skip spring travel by default.

### Shared-origin expansion

`SheetMorph.Content` expands a card or trigger into a sheet using measured source and destination geometry.

```tsx
import { Sheet } from "@velvetui/react/sheet";
import { SheetMorph } from "@velvetui/react/sheet-morph";
import { ThemeBackdrop } from "@velvetui/react/theme-backdrop";

<Sheet>
  <Sheet.Trigger className="story-card">Read story</Sheet.Trigger>

  <Sheet.Portal>
    <Sheet.View side="center" tracks={["top", "bottom"]}>
      <ThemeBackdrop themeColor="auto" />

      <SheetMorph.Content className="story-page" from="trigger">
        <Story />
      </SheetMorph.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet>
```

Pass an element or element ref to `from` when the visual source differs from the trigger.

## Toasts

Render one `Toaster`, then call `toast` from client components and event handlers.

```tsx
import { Toaster, toast } from "@velvetui/react/toast";
import "@velvetui/react/toast-theme.css";

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

### Update an existing toast

```tsx
const id = toast.loading("Uploading…");

toast.update(id, {
  type: "success",
  message: "Uploaded",
  duration: 3000,
});
```

### Track a promise

```tsx
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

Commands include `toast`, `success`, `error`, `info`, `warning`, `message`, `loading`, `custom`, `update`, `promise`, and `dismiss`.

Toast behavior includes:

- Immediate neighboring reflow while a toast exits
- Dynamic-height measurement during updates
- Visible queue limits with automatic promotion
- Timers paused by hover, keyboard focus, or a hidden tab
- Deterministic distance-and-velocity swipes across touch, pen, and mouse
- Pointer-cancel recovery, capture-loss fallback, and mid-spring re-grab
- Logical `start` and `end` positions in RTL
- Separate polite and assertive live regions
- <kbd>⌥ Option</kbd>+<kbd>T</kbd> on macOS, or <kbd>Alt</kbd>+<kbd>T</kbd> elsewhere, to focus the front toast
- <kbd>Escape</kbd> to dismiss a focused toast

### Close button placement and styling

The close button floats outside the content row, so actions keep their space. Put it on either physical side and replace or style the cross independently:

```tsx
<Toaster
  closeButton
  closeButtonPosition="left"
  icons={{ close: <CloseIcon /> }}
  classNames={{
    closeButton: "AppToast-close",
    closeIcon: "AppToast-closeIcon",
  }}
/>
```

```css
.AppToast-close {
  width: 22px;
  height: 22px;
  border: 1px solid #e8e8ec;
  border-radius: 999px;
  background: #fff;
  color: #34343a;
  box-shadow: 0 5px 16px rgb(0 0 0 / 12%);
}

.AppToast-close:hover {
  background: #f7f7f8;
}

.AppToast-closeIcon {
  width: 12px;
  height: 12px;
}
```

Tailwind utilities work through those same slots:

```tsx
<Toaster
  closeButtonPosition="right"
  icons={{ close: <CloseIcon /> }}
  classNames={{
    closeButton:
      "size-5 rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50",
    closeIcon: "size-2.5",
  }}
/>
```

You can also target `[data-slot="close-button"]` and `[data-slot="close-icon"]` in ordinary CSS. The `--velvet-toast-close-*` variables remain available as an optional shorthand.

Use `closeButtonPosition` in `toast(...)` options to override the side for one toast.

### Swipe behavior

Corner toasts swipe left or right by default. Centered toasts swipe up or down. Pass `swipeDirections` to `Toaster` for the global policy or to one toast for a local override:

```tsx
<Toaster swipeDirections={["right"]} />

toast("Archived", {
  swipeDirections: ["left"],
});
```

Buttons and links keep normal tap and click behavior, but a deliberate drag beginning on them still dismisses the toast without firing the action. Inputs, textareas, selects, and editable content keep gesture ownership. Add `data-velvet-toast-swipe-ignore` to any custom region that should never begin a toast swipe.

```tsx
toast.custom(
  <div>
    <span>Invite sent</span>
    <div data-velvet-toast-swipe-ignore>
      <InlineEditor />
    </div>
  </div>
);
```

### Unstyled toasts

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

Stable hooks include `data-slot`, `data-state`, `data-type`, `data-position`, `data-dragging`, `data-unstyled`, and `data-velvet-toast-swipe-ignore`.

Toast CSS variables begin with `--velvet-toast-` and cover width, offset, radius, surface, foreground, muted color, accent, and shadow.

## Motion outside sheets

The motion entry is framework-free. It does not import React, Sheet, Scroll, or Toast.

```ts
import { animate } from "@velvetui/react/motion";

const playback = animate(
  card,
  {
    transform: ["translateY(12px) scale(.98)", "translateY(0) scale(1)"],
    opacity: [0, 1],
  },
  {
    id: "card-enter",
    preset: "snappy",
  },
);

await playback.finished; // "finished", "cancelled", or "skipped"
```

Animations with the same element and `id` interrupt each other cleanly. Missing WAAPI, invalid keyframes, reduced motion, and missing elements settle safely.

Framework-free exports include `animate`, `springEasing`, `sampleSpring`, `resolveMotionTiming`, `prefersReducedMotion`, `resolveTravelStyles`, and `applyTravelStyles`.

React consumers can use:

```tsx
import {
  useAnimate,
  useReducedMotion,
  useSpringEasing,
} from "@velvetui/react/motion/react";
```

`useAnimate` cancels its owned playbacks when the component unmounts.

## Production compositions

Each composition is a separate export, so importing one does not pull every composition into your bundle.

| Component | Best for |
| --- | --- |
| `BottomSheet` | Mobile sheets with coordinated nested scrolling |
| `PersistentSheet` | Non-modal surfaces that collapse instead of dismissing |
| `Lightbox` | Solid full-screen media with bidirectional dismissal |
| `CardExpansion` | Cards that expand from their trigger into a modal |
| `DepthSheet` | Nested full-width sheets with bounded depth transforms |

### Bottom, persistent, and lightbox surfaces

```tsx
import { BottomSheet } from "@velvetui/react/bottom-sheet";
import { PersistentSheet } from "@velvetui/react/persistent-sheet";
import { Lightbox } from "@velvetui/react/lightbox";

import "@velvetui/react/base.css";
import "@velvetui/react/bottom-sheet.css";
import "@velvetui/react/persistent-sheet.css";
import "@velvetui/react/lightbox.css";

<BottomSheet.Root>
  <BottomSheet.Trigger>Open details</BottomSheet.Trigger>
  <BottomSheet.Content>
    <BottomSheet.Title>Trip details</BottomSheet.Title>
    <BottomSheet.Description>Swipe down to close.</BottomSheet.Description>
    <BottomSheet.Close>Done</BottomSheet.Close>
  </BottomSheet.Content>
</BottomSheet.Root>

<PersistentSheet.Root defaultOpen defaultSnap={1}>
  <PersistentSheet.Content>
    <PersistentSheet.Title>Now playing</PersistentSheet.Title>
    <PersistentSheet.Step direction="up">Expand</PersistentSheet.Step>
  </PersistentSheet.Content>
</PersistentSheet.Root>

<Lightbox.Root>
  <Lightbox.Trigger>Open photo</Lightbox.Trigger>
  <Lightbox.Content>
    <img src="/photo.jpg" alt="Snow-covered mountain at dusk" />
    <Lightbox.Close>Close</Lightbox.Close>
  </Lightbox.Content>
</Lightbox.Root>
```

### Card expansion

```tsx
import { CardExpansion } from "@velvetui/react/card-expansion";
import "@velvetui/react/base.css";
import "@velvetui/react/card-expansion.css";

<CardExpansion.Root>
  <CardExpansion.Trigger className="story-card">
    Read story
  </CardExpansion.Trigger>

  <CardExpansion.Content>
    <CardExpansion.Title>Motion that feels real</CardExpansion.Title>
    <CardExpansion.Description>Six minute read</CardExpansion.Description>
    <Article />
    <CardExpansion.Close>Close</CardExpansion.Close>
  </CardExpansion.Content>
</CardExpansion.Root>
```

The content expands from the trigger by default. Use `from={null}` for a normal modal entrance and `scroll={false}` for a content-sized card.

### Depth sheets

```tsx
import { DepthSheet } from "@velvetui/react/depth-sheet";
import "@velvetui/react/sheet.css";
import "@velvetui/react/depth-sheet.css";

<DepthSheet.Root>
  <DepthSheet.Page asChild>
    <main>
      <DepthSheet.Trigger>Open profile</DepthSheet.Trigger>
    </main>
  </DepthSheet.Page>

  <DepthSheet.Content>
    <DepthSheet.Title>Mara Vale</DepthSheet.Title>
    <DepthSheet.Description>Photographer and writer.</DepthSheet.Description>

    <DepthSheet.Root>
      <DepthSheet.Trigger>Open field notes</DepthSheet.Trigger>
      <DepthSheet.Content>
        <DepthSheet.Title>Field notes</DepthSheet.Title>
        <DepthSheet.Close>Done</DepthSheet.Close>
      </DepthSheet.Content>
    </DepthSheet.Root>
  </DepthSheet.Content>
</DepthSheet.Root>
```

Nested roots join the nearest stack and reuse its portal host. Depth transforms are bounded, so deep stacks remain readable.

Customize the visual contract through `DepthSheet.Root`:

```tsx
<DepthSheet.Root
  tokens={{
    inset: "24px",
    radius: "30px",
    shift: "16px",
    shiftLimit: "72px",
    scaleLoss: 0.055,
    scaleMinimum: 0.78,
    dimming: 0.085,
    brightnessMinimum: 0.72,
    surfaceBackground: "#f8faf8",
  }}
>
  {/* page and sheets */}
</DepthSheet.Root>
```

`depthSheetVariables`, `depthSheetDefaultTokens`, and `depthSheetStackingAnimation` expose the CSS-property mapping, shipped defaults, and bounded stack animation.

## Utilities

Import utility primitives without pulling in the higher-level compositions:

```tsx
import {
  AutoFocusTarget,
  ExternalOverlay,
  Fixed,
  Island,
  Scroll,
  VisuallyHidden,
} from "@velvetui/react/utilities";
```

- `Scroll` coordinates nested scrolling, safe areas, focus, and sheet boundaries.
- `ExternalOverlay.Root` includes a third-party portal in the owning modal sheet.
- `ExternalOverlay.DismissLayer` also owns the frontmost Escape/outside gesture, focus return, and exit completion.
- `Island` keeps a separate interactive region available inside sheet modality.
- `Fixed` preserves fixed-position behavior inside transformed surfaces.
- `AutoFocusTarget` and `VisuallyHidden` provide accessible focus and labeling helpers.

The utility entry also exports `useClientMediaQuery`, `updateThemeColor`, and `useThemeColorDimmingOverlay`.

Third-party adapters are headless portal boundaries with no peer import or styling:

```tsx
import { VelvetRadixPopover } from "@velvetui/react/radix";
import { VelvetAriaSelect } from "@velvetui/react/react-aria";
import { VelvetBaseUIPopover } from "@velvetui/react/base-ui";
```

Render the adapter inside the third-party Portal and pass its real DOM-bearing popup or positioner through `asChild`. See the [Radix, React Aria, and Base UI recipes](https://velvetui.co/recipes).

## Styling

Velvet works with vanilla CSS, CSS Modules, Tailwind, styled-components, Emotion, and other styling systems.

- Pass `className`, `style`, and refs to DOM primitives.
- Use `asChild` to merge Velvet behavior onto your own element.
- Target stable `data-*` attributes for interaction states.
- Import structural CSS once, then author the visual layer however you prefer.

Example Tailwind state styling:

```tsx
<Sheet.Content className="data-[state=exiting]:opacity-0" />
```

## Accessibility

`Sheet.Title` and `Sheet.Description` provide the accessible dialog name and description.

Triggers expose `aria-expanded`, `aria-controls`, and `aria-haspopup="dialog"`. Modal sheets contain focus, restore focus to the opener, and make unrelated document branches inert.

Nested sheets dismiss one layer at a time. `alertdialog` uses safer dismissal defaults. Escape and outside-click behavior remain configurable.

Toasts use separate polite and assertive live regions, so visual reordering is not announced twice.

## Server rendering

Sheets can exist in an SSR tree. Portals return an empty server result instead of reading `document`, then activate after hydration.

The imperative toast store is client process state. Call `toast()` from client code or an event handler, not while rendering a server request.

## Package exports

| Import | Contents |
| --- | --- |
| `@velvetui/react` | Complete public API |
| `@velvetui/react/sheet` | `Sheet`, `SheetStack`, and sheet types |
| `@velvetui/react/motion` | Framework-free springs, WAAPI, and travel helpers |
| `@velvetui/react/motion/react` | React motion hooks |
| `@velvetui/react/utilities` | Scroll, focus, fixed, island, and overlay helpers |
| `@velvetui/react/adapters` | All headless third-party overlay boundaries |
| `@velvetui/react/radix` | Radix Popover and Dropdown Menu boundaries |
| `@velvetui/react/react-aria` | React Aria Popover, Tooltip, and Select boundaries |
| `@velvetui/react/base-ui` | Base UI Popover, Menu, and Select boundaries |
| `@velvetui/react/testing` | `expectVelvetLayer` DOM conformance helper |
| `@velvetui/react/sheet-morph` | Shared-origin geometry primitive |
| `@velvetui/react/theme-backdrop` | Browser-theme dimming backdrop |
| `@velvetui/react/depth-sheet` | `DepthSheet` composition and tokens |
| `@velvetui/react/card-expansion` | `CardExpansion` composition |
| `@velvetui/react/bottom-sheet` | `BottomSheet` composition |
| `@velvetui/react/persistent-sheet` | `PersistentSheet` composition |
| `@velvetui/react/lightbox` | `Lightbox` composition |
| `@velvetui/react/toast` | `Toaster`, `toast`, and toast types |

The package ships minified ESM and CommonJS builds plus TypeScript declarations. React and React DOM remain peer dependencies.

The machine-scannable [INVARIANTS.md](./INVARIANTS.md) captures the component-family, lifecycle, focus, nesting, portal, and styling contracts. In development, `window.__velvet.inspect()` exposes mounted scope and stack data for debugging.

## Licensing

Velvet UI is proprietary software distributed in compiled form, not open-source software. See [LICENSE.md](https://unpkg.com/@velvetui/react@latest/LICENSE.md) for the complete terms.

| License | Use |
| --- | --- |
| Free | Unlimited non-commercial usage and projects |
| Individual | Commercial usage for an individual or team with fewer than three members |
| Organization | Commercial usage limited to one organization |
| Codebase access | Available through a separate sales agreement |

Paid licenses are one-time purchases and include future public package versions. Dodo Payments calculates tax and delivers the license key after payment. The key is proof of entitlement; Velvet UI does not require a key prop or runtime activation. See [licenses and terms](https://velvetui.co/?license=open).

## Development

```bash
npm install
npm run browsers:install
npm run dev
npm run verify
npm run pack:check
```

Focused verification commands:

```bash
npm run typecheck
npm run verify:package
npm run verify:bundle
npm run verify:motion
npm run verify:sheet
npm run verify:toast
```

`npm run browsers:install` is a one-time setup for the Chrome build matched to Puppeteer. The example gallery lives in `src/playground`. Browser tests exercise real scroll, pointer, keyboard, stacking, detent, drag, and toast behavior through Puppeteer.

## Documentation

- [Getting started](https://velvetui.co/docs)
- [Live examples](https://velvetui.co)
- [Licenses and terms](https://velvetui.co/?license=open)
- [Issue tracker](https://github.com/0xHecker/velvetui-support/issues)
