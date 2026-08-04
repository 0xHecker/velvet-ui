# Sheet API

> The sheet API is assembled from state, view, content, and action primitives so consumers can adopt only the layers they need.

Web: https://velvetui.co/docs/sheet-api

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
| `onOpenChange` | `(open) => void` | — | Receives requested state changes |
| `snap` | `number` | uncontrolled | Controlled detent index |
| `defaultSnap` | `number` | `defaultOpen ? 1 : 0` | Initial detent |
| `onSnapChange` | `(snap) => void` | — | Receives detent changes |
| `sheetRole` | `"dialog" \| "alertdialog"` | `"dialog"` | Modal semantics and dismissal policy |


## Sheet.Panel

Panel is the convenient composition of Portal, View, Backdrop, Content, and an optional Handle.

| Prop | Type | Default |
| --- | --- | --- |
| `side` | SheetSide | `bottom` |
| `snapPoints` | detent or array | none |
| `modal`, `dismissible`, `draggable` | boolean | View defaults |
| `portal` | boolean | `true` |
| `container` | Element or DocumentFragment | `document.body` |
| `portalProps`, `viewProps` | part props | — |
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
| `Sheet.Portal` | `container` |
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

The child becomes the real DOM node. It must accept the forwarded ref, className, style, ARIA attributes, disabled state, and event handlers.

If a design-system Button merges handlers, call both handlers unless the consumer event is already prevented. Dropping Velvet’s handler makes the control look enabled while doing nothing.
