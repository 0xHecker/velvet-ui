# Package exports

> Choose focused JavaScript and CSS entry points for smaller bundles, predictable style order, and server-rendered React applications.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/package-exports

Velvet ships focused ESM and CommonJS entry points. Importing a composition does not pull every other composition into the application bundle.

## Public entry points

| Import | What it contains | CSS |
| --- | --- | --- |
| `@velvetui/react/sheet` | Sheet and SheetStack only | `@velvetui/react/sheet.css` |
| `@velvetui/react/motion` | Framework-free springs, WAAPI, and travel interpolation | none |
| `@velvetui/react/motion/react` | Lifecycle-owned motion hooks | none |
| `@velvetui/react/utilities` | Scroll, accessibility, fixed, island, and overlay helpers | `@velvetui/react/sheet.css` |
| `@velvetui/react/adapters` | All headless third-party overlay adapters | none |
| `@velvetui/react/radix` | Radix Popover and Dropdown Menu boundaries | none |
| `@velvetui/react/react-aria` | React Aria Popover, Tooltip, and Select boundaries | none |
| `@velvetui/react/base-ui` | Base UI Popover, Menu, and Select boundaries | none |
| `@velvetui/react/testing` | DOM layer conformance assertion | none |
| `@velvetui/react/sheet-morph` | Shared-origin geometry | `@velvetui/react/sheet.css` |
| `@velvetui/react/theme-backdrop` | Backdrop plus browser theme tint | `@velvetui/react/sheet.css` |
| `@velvetui/react/bottom-sheet` | Styled mobile/task sheet | `sheet.css` + `bottom-sheet.css` |
| `@velvetui/react/depth-sheet` | Recursive iOS-like depth stack | `sheet.css` + `depth-sheet.css` |
| `@velvetui/react/card-expansion` | Trigger-to-modal expansion | `sheet.css` + `card-expansion.css` |
| `@velvetui/react/persistent-sheet` | Non-modal collapsed surface | `sheet.css` + `persistent-sheet.css` |
| `@velvetui/react/lightbox` | Full-screen media surface | `sheet.css` + `lightbox.css` |
| `@velvetui/react/toast` | Toaster and imperative toast API | `toast.css` or `toast-theme.css` |
| `@velvetui/react` | Every public export | Import the CSS you use |

## Smallest reliable imports

```tsx
import { Sheet } from "@velvetui/react/sheet";
import { animate } from "@velvetui/react/motion";
import { CardExpansion } from "@velvetui/react/card-expansion";
import { toast, Toaster } from "@velvetui/react/toast";

import "@velvetui/react/sheet.css";
import "@velvetui/react/card-expansion.css";
```

Use the root `@velvetui/react` entry when convenience matters more than the last few bytes. `motion` has no React import; `motion/react` adds hooks; `sheet` does not pull either React hooks or optional compositions. CSS remains explicit because it is a side effect and bundlers must preserve its order.

## React and server rendering

React 18 and 19 are peer dependencies. Trigger markup renders on the server. Portalled surfaces and document managers activate after hydration.

Call `toast()` from client code or an event handler. The `Toaster` itself can appear in an SSR tree because its portal host is discovered after mount.

## Tree-shaking checklist

- Import from focused subpaths.
- Use `motion`, not `motion/react`, outside React components.
- Import `sheet.css` or `toast.css` instead of `base.css` when only one primitive family is present.
- Import only the composition CSS you use.
- Do not re-export the entire root package from a local barrel.
- Keep `sideEffects: ['**/*.css']` when repackaging Velvet.
- Measure a minified consumer build, not the dev graph or raw source chunks.
