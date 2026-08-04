# Placement

> The panel side determines both the origin and the dismiss direction: bottom, top, left, right, or center.

Web: https://velvetui.co/docs/placement

Placement controls authored geometry. Tracks control direct-manipulation directions. Keeping those ideas separate makes detached dialogs, side drawers, and bidirectional media surfaces possible without a different primitive.

## Side and default track

| side | Authored edge | Inferred track | Common use |
| --- | --- | --- | --- |
| bottom | bottom | bottom | task sheet, picker |
| top | top | top | inbox, notification tray |
| left | left | left | navigation drawer |
| right | right | right | inspector, settings |
| center | centered | bottom unless supplied | modal, lightbox, detached sheet |

## Choose tracks explicitly

```tsx
<Sheet.View side="center" tracks={["top", "bottom"]}>
  <Sheet.Content className="modal-card">…</Sheet.Content>
</Sheet.View>

<Sheet.View side="right" tracks="right">
  <Sheet.Content className="inspector">…</Sheet.Content>
</Sheet.View>
```

A track names the edge the sheet travels toward when it leaves. `tracks="auto"` gives a coordinated Scroll.View stable bidirectional geometry; native boundary chaining chooses the valid exit without reconfiguring the sheet during content scroll.

## Responsive geometry

```css
.filters {
  width: min(100%, 42rem);
  height: min(46rem, var(--velvet-100lvh));
}

@media (min-width: 64rem) {
  .filters {
    height: calc(var(--velvet-100lvh) - 32px);
    margin: 16px;
    border-radius: 28px;
  }
}
```

CSS may turn an edge sheet into a detached surface without remounting state. Change the `side` prop only when the physical gesture direction must also change.

## Edge-navigation conflicts

Set `nativeEdgeSwipePrevention` when a left or right sheet uses the same screen edge as browser history navigation. Test the browser back gesture before enabling it globally.
