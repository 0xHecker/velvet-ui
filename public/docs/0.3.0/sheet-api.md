# Sheet API

> The sheet API is assembled from state, view, content, and action primitives so consumers can adopt only the layers they need.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/sheet-api

The headless Sheet contract is a compound React API. Every primitive forwards its ref and normal DOM props unless the table says otherwise.

## Import

```tsx
import {
  Sheet,
  SheetStack,
} from "@velvetui/react/sheet";
import "@velvetui/react/sheet.css";
```

## Sheet.Root

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `open` | `boolean` | uncontrolled | Controlled presented state |
| `defaultOpen` | `boolean` | `false` | Initial uncontrolled state |
| `onOpenChange` | `(open, detail) => void` | — | Receives requested state changes and their reason |
| `onDismissRequest` | `(detail) => boolean \| Promise<boolean>` | — | Accepts or rejects dismissal before state commits |
| `onEnterComplete` | `() => void` | — | Fires once after the layer settles inside |
| `onExitComplete` | `() => void` | — | Fires once after exit and modality release |
| `initialFocusRef` | `RefObject<HTMLElement>` | — | Preferred focus target after entry |
| `restoreFocusRef` | `RefObject<HTMLElement>` | trigger or captured focus | Stable focus target after exit |
| `snap` | `number` | uncontrolled | Controlled detent index |
| `defaultSnap` | `number` | `defaultOpen ? 1 : 0` | Initial detent |
| `onSnapChange` | `(snap) => void` | — | Receives detent changes |
| `sheetRole` | `"dialog" \| "alertdialog"` | `"dialog"` | Modal semantics and dismissal policy |


## Request, commit, and completion

A dismissal request is not an exit. `onDismissRequest` runs first and may resolve asynchronously. Once accepted, `onOpenChange(false, detail)` asks a controlled owner to commit the new state. Motion then exits, modality is released, focus is restored, and `onExitComplete` fires.

```tsx
const [open, setOpen] = useState(false);

<Sheet.Root
  open={open}
  onDismissRequest={async (detail) => {
    if (!editor.dirty) return true;
    return editor.flush({ reason: detail.reason });
  }}
  onOpenChange={(nextOpen, detail) => {
    analytics.track("sheet state requested", detail.reason);
    setOpen(nextOpen);
  }}
  onExitComplete={() => navigate("/projects")}
>
  ...
</Sheet.Root>
```

Dismissal reasons are `trigger`, `close-trigger`, `escape`, `outside-press`, `swipe`, and `programmatic`. A rejected request leaves controlled state, travel, focus, and modality unchanged.

## Triggerless focus

Route-open sheets may have no physical trigger. Supply refs when the safe entry or return target is dynamic or outside the Sheet subtree.

```tsx
<Sheet.Root
  open={routeMatch}
  initialFocusRef={headingRef}
  restoreFocusRef={pageLandmarkRef}
  onExitComplete={removeSheetRoute}
>
  <Sheet.Panel side="right">...</Sheet.Panel>
</Sheet.Root>
```

When a real trigger exists, point `restoreFocusRef` at it. When it was deleted or the route cold-opened, use a connected page landmark. Do not race restoration with a timeout.

## Sheet.Panel

Panel is the convenient composition of Portal, View, Backdrop, Content, and an optional Handle.

| Prop | Type | Default |
| --- | --- | --- |
| `side` | SheetSide | `bottom` |
| `snapPoints` | detent or array | none |
| `modal`, `dismissible`, `draggable` | boolean | View defaults |
| `portal` | boolean | `true` |
| `container` | Element, DocumentFragment, or React RefObject | `document.body` |
| `portalProps`, `viewProps` | part props | — |
| `view` | ref-forwarding React element | default View div |
| `backdrop` | boolean or element | `true` |
| `backdropProps` | Backdrop props | — |
| `handle` | boolean or element | `true` |
| `handleProps` | Handle props | — |
| `contentProps` | Content props | — |
| `travelAnimation`, `stackingAnimation` | animation map | — |

```tsx
<Sheet.Root>
  <Sheet.Trigger>Open filters</Sheet.Trigger>
  <Sheet.Panel
    side="bottom"
    snapPoints={["40lvh", "78lvh"]}
    viewProps={{ tracks: "auto", nativeEdgeSwipePrevention: true }}
    backdropProps={{ travelAnimation: { opacity: [0, 0.42] } }}
  >
    <Sheet.Title>Filters</Sheet.Title>
    <Filters />
    <Sheet.Close>Apply</Sheet.Close>
  </Sheet.Panel>
</Sheet.Root>
```

## Sheet.Portal

Portal accepts a resolved DOM host or a React ref. Passing a ref is the preferred form for a host rendered by the same component because it does not require callback-ref state.

```tsx
const portalHostRef = useRef<HTMLDivElement>(null);

<div ref={portalHostRef} className="portal-host" />

<Sheet.Portal container={portalHostRef}>
  <Sheet.View side="right">...</Sheet.View>
</Sheet.Portal>
```

If the ref is assigned during the same commit as an already-open sheet, Velvet waits for the ref and mounts the portal after it resolves. A supplied ref never silently falls back to document.body while its current value is null.

## NestedPortalHost and NestedPanel

Use the nested pair when a child sheet must remain physically clipped by a parent surface. The host applies relative clipping without creating a new low stacking context; NestedPanel portals to that host and applies host-relative absolute View positioning inline.

```tsx
<Sheet.NestedPortalHost asChild>
  <Sheet.Content className="library-modal">
    <Library />
    <Sheet.Root open={detailOpen} onOpenChange={setDetailOpen}>
      <Sheet.NestedPanel side="right" className="detail-panel">
        <Sheet.Title>Launch notes</Sheet.Title>
        <Sheet.Close>Back</Sheet.Close>
      </Sheet.NestedPanel>
    </Sheet.Root>
  </Sheet.Content>
</Sheet.NestedPortalHost>
```

The structural inline position also avoids Tailwind v4's layered-utility cascade trap: a visible `absolute` class no longer needs to beat Velvet's unlayered fixed rule.

## Sheet.View

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `side` | `top \| right \| bottom \| left \| center` | `bottom` | Authored content placement |
| `snapPoints` | `number \| string \| array` | none | Intermediate resting lengths |
| `draggable` | `boolean` | `true` | Enables native gesture travel |
| `dismissible` | `boolean` | `true` | Allows the closed destination |
| `modal` | `boolean` | `true` | Enables inertness, focus scope, and scroll lock |
| `tracks` | `Track \| Track[] \| "auto"` | inferred | Allowed gesture direction or scroll handoff |
| `swipeOvershoot` | `boolean` | `true` | Allows native rubber-band travel |
| `swipeTrap` | `boolean \| { x?: boolean; y?: boolean }` | modal-aware | Controls gesture containment by axis |
| `snapOutAcceleration` | `"auto" \| number` | `auto` | Biases native travel toward dismissal |
| `snapToEndDetentsAcceleration` | `"auto" \| number` | `auto` | Biases travel toward edge detents |
| `enteringAnimationSettings` | preset or settings | `smooth` | Programmatic opening motion |
| `exitingAnimationSettings` | preset or settings | 520 / 44 / 1 spring | Programmatic closing motion |
| `steppingAnimationSettings` | preset or settings | entering settings | Programmatic detent motion |
| `nativeEdgeSwipePrevention` | `boolean` | `false` | Prevents browser edge navigation conflicts |

## View callbacks

| Callback | Payload |
| --- | --- |
| `onTravel` | `{ progress, range, progressAtDetents }` |
| `onTravelStart` | no payload |
| `onTravelEnd` | no payload |
| `onTravelStatusChange` | idleOutside, entering, idleInside, stepping, exiting |
| `onClickOutside` | object or handler with `changeDefault` |
| `onEscapeKeyDown` | object or handler with `changeDefault` |

```tsx
<Sheet.View
  onClickOutside={{ dismiss: false }}
  onEscapeKeyDown={({ changeDefault }) => {
    if (formState.isDirty) changeDefault({ dismiss: false });
  }}
/>
```

## Visual and action parts

| Part | Important props |
| --- | --- |
| `Sheet.Portal` | `container: Element | DocumentFragment | RefObject` |
| `Sheet.NestedPortalHost` | host div props, `asChild` |
| `Sheet.NestedPanel` | Panel props; portal host is discovered automatically |
| `Sheet.Backdrop` | `travelAnimation`, `asChild` |
| `Sheet.Content` | `travelAnimation`, `stackingAnimation`, `asChild` |
| `Sheet.BleedingBackground` | normal div props, `asChild` |
| `Sheet.Outlet` | travel and stacking animation |
| `Sheet.Trigger` | `action`, `snapTo`, `onPress`, `asChild` |
| `Sheet.Close` | Trigger fixed to close intent |
| `Sheet.Step` | `snapTo`, `direction: up \| down` |
| `Sheet.Handle` | close or step `action` |
| `Sheet.Title` | heading props; supplies accessible name |
| `Sheet.Description` | paragraph props; supplies description |

## Actions and detent indexes

`0` means closed. Positive indexes address resting detents in travel order. Use `action="open"`, `close`, `toggle`, `step`, or `{ type: 'step', snapTo, direction }`.

```tsx
<Sheet.Trigger action="open">Open</Sheet.Trigger>
<Sheet.Trigger action="toggle">Toggle</Sheet.Trigger>
<Sheet.Step snapTo={2}>Details</Sheet.Step>
<Sheet.Handle action={{ type: "step", direction: "down" }} />
```

## asChild contract

The child becomes the real DOM node. Pass one non-Fragment element and forward its ref, children, className, style, ARIA/data attributes, disabled state, and event handlers to the final DOM node.

Child handlers run first and `event.preventDefault()` cancels Velvet's behavior. Refs are composed, class names are concatenated, and the child's inline style wins on collisions. Development diagnostics report a dropped ref, missing data/ARIA props, a non-DOM external overlay target, or unstable element identity with a stable `VELVET_*` code and focused error URL. See [Bring your own components](/docs/0.3.0/custom-components) for complete examples.
