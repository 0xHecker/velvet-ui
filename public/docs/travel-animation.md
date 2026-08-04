# Travel animation

> Travel animation maps a shared open progress value onto any visual property, keeping panel, backdrop, and surrounding UI synchronized.

Web: https://velvetui.co/docs/travel-animation

Travel animation maps the same physical progress used by the sheet onto CSS properties. This keeps the surface, backdrop, page, and decorative layers synchronized.

## Animate panel and page together

```tsx
<Sheet.Backdrop travelAnimation={{ opacity: [0, 0.44] }} />

<Sheet.Content travelAnimation={{
  opacity: ({ progress }) => Math.min(progress * 1.8, 1),
  transform: ({ tween }) => `translateY(${tween(24, 0)}px)`,
}} />

<Sheet.Outlet travelAnimation={{
  transform: ({ tween }) => `scale(${tween(1, 0.96)})`,
  borderRadius: [0, 28],
}}>
  <Page />
</Sheet.Outlet>
```

A value may be a `[from, to]` pair, a function of `{ progress, tween }`, or a literal. Use transform and opacity when possible to avoid layout work during a drag.
