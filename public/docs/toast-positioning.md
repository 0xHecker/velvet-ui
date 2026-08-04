# Toast positioning

> The Toaster supports the six viewport corners and centers with a fixed viewport layer that does not inherit local layout offsets.

Web: https://velvetui.co/docs/toast-positioning

Position belongs to the `Toaster`, not individual messages. Choose one predictable location for an application region.

## Positions

```tsx
<Toaster position="top-left" />
<Toaster position="top-center" />
<Toaster position="top-right" />
<Toaster position="bottom-left" />
<Toaster position="bottom-center" />
<Toaster position="bottom-right" />
```

Swipe directions follow the chosen edge by default. On mobile, bottom-center is usually easiest to reach; avoid covering persistent navigation or form submit controls.
