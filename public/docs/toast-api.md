# Toast API

> The toast API is a small imperative dispatcher with a single declarative renderer, Toaster.

Web: https://velvetui.co/docs/toast-api

The toast package exposes one imperative dispatcher and one portal renderer. The full contract is typed and works with styled or unstyled surfaces.

## Methods

| Method | Result |
| --- | --- |
| `toast(message, options)` | Neutral toast id |
| `toast.success/error/info/warning/message/loading` | Typed toast id |
| `toast.custom(content, options)` | Custom React content |
| `toast.update(id, patchOrUpdater)` | Updates one toast |
| `toast.dismiss(id?, reason?)` | Dismisses one or all |
| `toast.promise(task, phases)` | Returns the original promise |

```tsx
const id = toast.loading("Uploading");

try {
  const file = await upload();
  toast.update(id, {
    type: "success",
    message: "Uploaded",
    description: file.name,
  });
} catch {
  toast.update(id, { type: "error", message: "Upload failed" });
}
```

## ToastOptions

| Option | Type | Notes |
| --- | --- | --- |
| `id` | string or number | Reusing an id updates one toast |
| `type` | default, success, error, info, warning, loading | Prefer typed methods |
| `description` | ReactNode | Secondary guidance |
| `icon` | ReactNode | Replaces the type icon |
| `announcement` | string | Explicit screen-reader text |
| `duration` | number | Loading is persistent until updated or dismissed |
| `dismissible` | boolean | Controls swipe, Escape, and close affordance |
| `swipeDirections` | direction array | Per-toast override of the Toaster policy |
| `important` | boolean | Uses the assertive live region |
| `action`, `cancel` | `{ label, onClick }` | Return `false` from action to keep it open |
| `closeButton` | boolean | Per-toast override |
| `closeButtonPosition` | `left \| right` | Per-toast physical side override |
| `closeButtonAriaLabel` | string | Accessible close label |
| `className`, `descriptionClassName`, `classNames` | strings or map | Includes `closeButton` and `closeIcon` hooks |
| `style` | CSSProperties | Per-toast custom properties |
| `unstyled` | boolean | Retains behavior and structural a11y only |
| `onDismiss` | callback | Includes dismissal reason |
| `onAutoClose` | callback | Fires only for timeout closure |

## Toaster props

| Prop | Type | Default |
| --- | --- | --- |
| `position` | viewport position | `bottom-right` |
| `duration` | milliseconds | `4000` |
| `gap` | pixels | `14` |
| `stack` | boolean | `true` |
| `expand` | boolean | `false` |
| `visibleToasts` | number | `3` |
| `closeButton` | boolean | `true` |
| `closeButtonPosition` | `left \| right` | `right` |
| `richColors` | boolean | `false` |
| `swipeDirections` | direction array | both directions on the placement axis |
| `hotkey` | key descriptor array or null | `["altKey", "KeyT"]` |
| `pauseWhenPageIsHidden` | boolean | `true` |
| `dir` | `ltr \| rtl \| auto` | `auto` |
| `offset` | number or CSS length | `24` |
| `containerAriaLabel` | string | `Notifications` |
| `icons` | icon map | built-in glyphs |
| `toastOptions` | ToastOptions | `{}` |
| `className`, `classNames`, `style` | styling hooks | — |
| `unstyled` | boolean | `false` |

## Positions and swipe directions

Positions support top/bottom plus left/center/right, and logical `start`/`end` variants. Swipe directions support top, right, bottom, left, start, and end.

When `swipeDirections` is omitted, corner toasts accept left and right while centered toasts accept top and bottom. This keeps the cross axis available for page panning. Pass it to `Toaster` for the global policy or to one toast for a local override; logical directions resolve from `dir`.

## Controls and custom content

A tap on a button or link activates it normally. Once movement passes the gesture slop, the same pointer stream becomes a toast swipe and its compatibility click is suppressed, so an action cannot fire accidentally after dismissal.

The built-in close button floats outside the content row, so it never consumes action space. Set `closeButtonPosition="left"` or `"right"` globally, or in one toast's options. Use `icons.close` to replace the cross; `classNames.closeButton` and `classNames.closeIcon` style the two layers independently.

```tsx
<Toaster
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
  background: white;
  color: #34343a;
  box-shadow: 0 5px 16px rgb(0 0 0 / 12%);
}

.AppToast-closeIcon {
  width: 12px;
  height: 12px;
}
```

```tsx
<Toaster
  icons={{ close: <CloseIcon /> }}
  classNames={{
    closeButton:
      "size-5 rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50",
    closeIcon: "size-2.5",
  }}
/>
```

Plain CSS, CSS Modules, and Tailwind utilities work directly through the class hooks. The default skin uses low-specificity selectors, so ordinary properties can override it without `!important`. You may also target `[data-slot="close-button"]` and `[data-slot="close-icon"]`; the `--velvet-toast-close-*` variables are optional shorthand.

Inputs, textareas, selects, and editable content do not begin a toast swipe. Put `data-velvet-toast-swipe-ignore` on any additional custom region that must retain pointer ownership.

```tsx
toast.custom(
  <div className="upload-toast">
    <span>Upload ready</span>
    <div data-velvet-toast-swipe-ignore>
      <InlineEditor />
    </div>
  </div>
);
```

## Promise phases

```tsx
await toast.promise(() => saveDocument(), {
  loading: { message: "Saving", description: "Keeping this tab open" },
  success: (document) => ({
    message: "Saved",
    description: document.updatedAt,
  }),
  error: (error) => ({
    message: "Could not save",
    description: error.message,
  }),
  finally: () => releaseDraftLock(),
});
```

Each phase may be a ReactNode, an object, or a function. The promise returned by `toast.promise` keeps its original value and rejection behavior.

## Accessibility behavior

Ordinary updates use a polite live region. Errors and `important` updates use an assertive region. Option+T on macOS, or Alt+T elsewhere, focuses the front toast by default; Escape dismisses the focused or front toast.

Actions are real buttons. After keyboard dismissal, focus moves to the next toast or returns to the element focused before the toast stack.

## Dismiss reasons

`programmatic`, `timeout`, `swipe`, `action`, `cancel`, `close-button`, and `escape` are built in. Custom strings remain accepted for application-level analytics.
