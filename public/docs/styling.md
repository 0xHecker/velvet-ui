# Styling

> Velvet exposes semantic classes and CSS custom properties so the component can inherit your design system without a styling runtime.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/styling

Velvet owns geometry, focus, and gestures. Product CSS owns color, spacing, typography, and layout. Use classes for a component instance and variables for theme-level decisions.

## Plain CSS

```tsx
<Sheet.Panel side="bottom" className="settings-sheet">
  <Sheet.Title>Settings</Sheet.Title>
  <SettingsForm />
</Sheet.Panel>
```

```css
.settings-sheet {
  --velvet-panel-radius: 28px;
  --velvet-panel-padding: 24px;
  width: min(100%, 42rem);
  background: var(--surface);
  color: var(--foreground);
}
```

## Tailwind CSS v4

```tsx
<Sheet.Panel
  side="bottom"
  className="w-full max-w-2xl rounded-t-[28px] bg-white p-6 text-slate-950 shadow-2xl"
>
  <Sheet.Title className="text-xl font-semibold">Settings</Sheet.Title>
</Sheet.Panel>
```

Keep `sheet.css` or the combined `base.css` imported. Tailwind styles the authored surface; it should not recreate the native scroll-snap track or portal mechanics.

## Styled Components and Emotion

```tsx
const Surface = styled.div`
  width: min(100%, 42rem);
  border-radius: 28px 28px 0 0;
  background: ${({ theme }) => theme.surface};
`;

<Sheet.Panel side="bottom" asChild>
  <Surface><Settings /></Surface>
</Sheet.Panel>
```

The child of `asChild` must forward its DOM ref and event props. Use `styled.div` or a forwarding component, not a component that swallows `ref`, `style`, or pointer handlers.

## Choose the right CSS layer

```css
import "@velvetui/react/sheet.css";             // Sheet/Scroll mechanics only
import "@velvetui/react/toast.css";             // Toaster mechanics only
import "@velvetui/react/toast-theme.css";       // Toaster mechanics + default skin
import "@velvetui/react/base.css";              // common Sheet + Toaster mechanics
import "@velvetui/react/styles.css";            // mechanics + every supplied skin
import "@velvetui/react/bottom-sheet.css";       // one composition
import "@velvetui/react/card-expansion.css";
import "@velvetui/react/depth-sheet.css";
import "@velvetui/react/lightbox.css";
import "@velvetui/react/persistent-sheet.css";
```

Use `sheet.css` for Sheet and Scroll mechanics, `toast.css` for unstyled toast mechanics, or `base.css` when both are present. `toast-theme.css` adds only the default toast skin; `styles.css` adds every supplied skin. See CSS reference for every stable variable and data hook.
