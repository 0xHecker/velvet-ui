# CSS reference

> Use the stable CSS entries, variables, and semantic data hooks without depending on internal wrapper order.

Web: https://velvetui.co/docs/css-reference

The public CSS contract consists of package CSS entries, custom properties, and semantic data attributes. Internal wrapper order is not part of the contract.

## CSS entry points

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

## Core and Panel variables

| Variable | Default | Scope |
| --- | --- | --- |
| `--velvet-100lvh` | `100dvh` when supported | Visible viewport height |
| `--velvet-z-sheet` | `100` | Sheet portal layer |
| `--velvet-z-toast` | `9999` | Toast layer |
| `--velvet-panel-background` | `#fff` | Sheet.Panel skin |
| `--velvet-panel-foreground` | `#171923` | Sheet.Panel text |
| `--velvet-panel-radius` | `24px` | Standard radius |
| `--velvet-panel-padding` | `20px` | Standard padding |
| `--velvet-panel-shadow` | layered shadow | Standard elevation |
| `--velvet-backdrop-background` | transparent in base | Backdrop color |
| `--velvet-handle-background` | current-color mix | Handle color |

## Bottom and Persistent Sheet defaults

| Variable suffix | Bottom Sheet | Persistent Sheet |
| --- | --- | --- |
| `max-width` | `720px` | `720px` |
| `inset` | `16px` | `16px` |
| `max-height` | `760px` | `720px` |
| `top-gap` | `24px` | `24px` |
| `radius` | `28px`, `24px` at 520px | same |
| `background` | `#fff` | `#fff` |
| `foreground` | `#111827` | `#111827` |
| `content-top` | `48px` | `46px` |
| `content-inline` | `24px` | `24px` |
| `content-bottom` | max of `24px` and safe area | same |
| `handle` | `rgb(17 24 39 / .2)` | same |
| `backdrop` | `#000` | no backdrop by default |

Prefix the suffix with `--velvet-bottom-sheet-` or `--velvet-persistent-sheet-`. Both expose a `shadow` variable with the layered composition elevation as its default.

## Card, Lightbox, and Toast defaults

| Variable | Default |
| --- | --- |
| `--velvet-card-expansion-width` | `min(720px, 100vw - 32px)` |
| `--velvet-card-expansion-height` | `min(820px, 100dvh - 40px)` |
| `--velvet-card-expansion-radius` | `28px` |
| `--velvet-card-expansion-background` | `#fff` |
| `--velvet-card-expansion-foreground` | `#111827` |
| `--velvet-card-expansion-backdrop` | `#000` |
| `--velvet-lightbox-inset` | `20px`, `12px` at 520px |
| `--velvet-lightbox-foreground` | `#fff` |
| `--velvet-lightbox-surface` | `#000` |
| `--velvet-lightbox-backdrop` | `#000` |
| `--velvet-toast-width` | `360px` |
| `--velvet-toast-offset` | `24px` |
| `--velvet-toast-stack-gap` | `14px` |
| `--velvet-toast-content-gap` | `12px` |
| `--velvet-toast-radius` | `15px` |
| `--velvet-toast-ease` | `cubic-bezier(.22, 1, .36, 1)` |

## Override composition tokens

```css
[data-velvet-depth="root"] {
  --velvet-depth-inset: max(20px, env(safe-area-inset-top));
  --velvet-depth-radius: 30px;
  --velvet-depth-surface-background: #f8f7f4;
}

[data-velvet-card-expansion="content"] {
  --velvet-card-expansion-width: min(760px, calc(100vw - 32px));
}
```

Depth Sheet's full token table, including bounded ten-level stacking behavior, is in Composition API.

## Stable data hooks

| Hook | Meaning |
| --- | --- |
| `[data-velvet="view"]` | Fixed sheet host |
| `[data-velvet="backdrop"]` | Interactive backdrop |
| `[data-velvet="content"]` | Authored sheet surface |
| `[data-velvet="handle"]` | Drag and step control |
| `[data-velvet-placement]` | top, right, bottom, left, or center |
| `[data-velvet-modal]` | Current modality |
| `[data-velvet-scroll="view"]` | Coordinated content scroller |
| `[data-velvet-depth]` | Depth composition part |
| `[data-slot="toaster"]`, `[data-slot="toast"]` | Toast structure |

Style semantic hooks, not generated ids or internal spacer nodes. Scroll track attributes are structural and may change without a visual API change.
