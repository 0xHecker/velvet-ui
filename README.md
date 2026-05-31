# Velvet UI

Native-feeling, swipeable overlay components for the web — bottom sheets, modals,
sidebars, top sheets, detent sheets, toasts, and stacked sheets — built on one
spring-physics motion model and a small compound-component API.

The motion is driven by a fixed-timestep damped-spring integrator and the browser's
own scroll-snap engine, so swipes carry real momentum and respect the OS scroll
direction. Components ship unstyled; you bring the CSS.

## Run the playground

```bash
npm install
npm run dev      # Vite dev server — open the printed URL
```

The playground (`src/playground`) is a cream-palette gallery of every example.

## Install in your app

The library lives in `src/velvet`. It works on **React 18 and 19** (it uses no
React-19-only APIs). Import what you need and the structural CSS:

```jsx
import { Sheet } from "./velvet"; // pulls in velvet.css via the barrel
```

## Components

### `Sheet`
A swipeable overlay. Compose the parts you need:

```jsx
<Sheet.Root>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.View contentPlacement="bottom">
      <Sheet.Backdrop />
      <Sheet.Content>
        <Sheet.Handle />
        <Sheet.Title>Title</Sheet.Title>
        <Sheet.Description>Body</Sheet.Description>
        <Sheet.Trigger action="dismiss">Close</Sheet.Trigger>
      </Sheet.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet.Root>
```

| Part | Notes |
| --- | --- |
| `Root` | Owns state. Props: `presented` / `defaultPresented` / `onPresentedChange`, `activeDetent` / `defaultActiveDetent` / `onActiveDetentChange`, `sheetRole`. |
| `Portal` | Renders into `document.body` (or `container`) while mounted. |
| `View` | The fixed overlay + travel mechanism. Props: `contentPlacement` (`"bottom" \| "top" \| "left" \| "right" \| "center"`), `detents` (CSS length or array, e.g. `"58lvh"`), `swipe`, `swipeDismissal`, `inertOutside`, `enteringAnimationSettings`, `exitingAnimationSettings`, `onTravel`, `onClickOutside`, `onEscapeKeyDown`. |
| `Backdrop` | Dimming layer. `travelAnimation` (defaults to opacity tracking travel). |
| `Content` | The panel. `travelAnimation`, `stackingAnimation`. |
| `BleedingBackground` | Panel-sized background layer (rounded corners, shadow). |
| `Handle` | A grab/dismiss affordance (`action="dismiss"`). |
| `Trigger` | A button. `action`: `"present" \| "dismiss" \| "step" \| { type: "step", direction?: "up" \| "down", detent?: number }`. |
| `Title` / `Description` | Wire `aria-labelledby` / `aria-describedby`. |
| `Outlet` | Animate any element from this sheet's `travelAnimation` / `stackingAnimation`. |

**Tracks** — `contentPlacement` picks where the panel rests and which way it swipes:
`bottom` (default), `top`, `left`, `right`, and `center` (a modal that rests centered).

**Detents** — pass `detents` to add intermediate rest stops. Detent `0` is closed,
`n` is fully open. Control with `activeDetent` or step via a `Trigger`.

**travelAnimation / stackingAnimation** — a map of CSS properties to either a
`[from, to]` tuple, a `({ progress, tween }) => value` function, or a literal:

```jsx
<Sheet.Content
  travelAnimation={{ opacity: ({ progress }) => progress, transform: ({ tween }) => `scale(${tween(0.94, 1)})` }}
/>
```

### `Scroll`
A scroll container with progress reporting and an imperative API.

```jsx
const ref = useRef(null);
<Scroll.Root componentRef={ref}>
  <Scroll.View axis="y" scrollGestureTrap onScrollProgress={({ progress }) => {}}>
    <Scroll.Content>{/* … */}</Scroll.Content>
  </Scroll.View>
</Scroll.Root>;
// ref.current.scrollTo({ progress: 0 });  scrollBy({ distance });  getProgress();
```

### `SheetStack`
Coordinates stacked sheets. Lower sheets animate (via `stackingAnimation`) as the
sheet above them travels in/out. Wrap sheets (sibling or nested) in `SheetStack.Root`.

### Supporting primitives
`VisuallyHidden`, `AutoFocusTarget` (focused on open), `Fixed` (stays put while a
sheet travels), `Island` (interactive region), `ExternalOverlay.Root` (third-party
overlay compatibility).

### Hooks & utilities
`createComponentId`, `useClientMediaQuery(query)`, `updateThemeColor(color)`,
`useThemeColorDimmingOverlay({ elementRef, dimmingColor })`, and `SPRING_PRESETS`.

## Animation settings

`enteringAnimationSettings` / `exitingAnimationSettings` (and `Scroll` animations)
accept a preset name, a spring config, or a timing object:

```jsx
"smooth"                                  // preset (default)
{ preset: "snappy", skip: false }
{ easing: "spring", stiffness: 300, damping: 34, mass: 1 }
```

Presets (stiffness / damping / mass): `gentle` 560/68/1.85 · `smooth` 580/60/1.35 ·
`snappy` 350/34/0.9 · `brisk` 350/28/0.65 · `bouncy` 240/19/0.7 · `elastic` 260/20/1.
`prefers-reduced-motion` skips animation by default.

## How the motion works

- **Swipe** rides the browser's native scroll-snap (smooth, OS-correct direction,
  free momentum). A panel's travel distance is one scroll range.
- **Programmatic open / close / step** is spring-driven: a fixed-timestep
  semi-implicit Euler integrator samples the curve and drives the scroll offset.
- **Backdrop / content** animate from the shared travel progress, so dimming and
  motion stay in lock-step.

## Verification

Headless Puppeteer harnesses (each boots Vite in-process, no flakiness):

```bash
node scripts/drag.mjs        # gesture physics + interactivity (5 checks)
node scripts/detent.mjs      # detent rest / step / dismiss (3 checks)
node scripts/scroll.mjs      # Scroll travel + imperative scrollTo (2 checks)
node scripts/stacking.mjs    # SheetStack lower-sheet scaling (1 check)
node scripts/screenshot.mjs [--shot <id>] [--mobile]   # freeze-checkpoint screenshots
```

`window.__velvet` exposes debug hooks (`freeze(p)`, `progress()`, `idle()`,
`count()`, `setTimeScale(n)`); set `window.__VELVET_DEBUG = true` to mount a sheet
open without animation for deterministic screenshots.
