# Toast production architecture

Status: implemented and regression-tested.

This document records the lifecycle and accessibility decisions behind
`src/velvet/toast.js` and `src/velvet/Toaster.jsx`.

## Goals

- A toast leaving the middle of a list must not leave a temporary empty slot.
- Drag, cancel, lost capture, and re-grab must never strand an element.
- Loading-to-result updates may change height without jumping neighboring items.
- Visual reordering must not cause duplicate screen-reader announcements.
- Timers pause while a user is reading or interacting with the stack.
- The JavaScript API must be CSS-free and safe to import in SSR code.

## Store lifecycle

Entries move through two visible states:

```text
active -> removing -> finalized
```

`toast.dismiss(id, reason)` marks an entry `removing` immediately. The layout
excludes removing entries at once, so neighbors begin closing the gap while the
old node still performs its exit spring. `ToastItem` calls `finalizeToast(id)`
when that spring completes. A fallback timer finalizes entries when no Toaster
is mounted.

Each update increments a revision. Promise toasts remember the revision they
created and only apply their success/error phase if that same active revision
still exists. Dismissing or manually replacing a loading toast therefore cannot
let a late promise resurrect or overwrite it.

Dismiss callbacks receive an explicit reason:

```text
programmatic | timeout | swipe | action | cancel | close-button | escape
```

`onAutoClose` fires only for `timeout`; `onDismiss` fires for every removal
request.

## Layout and queue

`ResizeObserver` stores the live height of every mounted toast. Expanded offsets
are calculated from the measured heights plus `gap`; loading-to-result updates
therefore reflow without a stale fixed-height estimate. Measurements are removed
on unmount.

`visibleToasts` defaults to three. The newest active entries are mounted; older
entries remain queued without starting a timer. Removing a visible toast
promotes the next queued entry immediately while the exiting node completes its
animation.

## Timing

Remaining duration is stored per item. A timer pauses for:

- pointer hover over the stack;
- focus anywhere inside the stack;
- a hidden document, unless `pauseWhenPageIsHidden={false}`;
- an active drag.

`duration={Infinity}` remains persistent. Updating an entry resets its duration
for the new revision.

## Gesture model

Pointer movement writes CSS variables directly to the element rather than
rendering React state for every frame. The gesture is constrained to the
dismissal axis selected by position or `swipeDirections`.

- Allowed movement follows the pointer.
- Wrong-way movement uses a bounded elastic resistance curve.
- Distance or release velocity may choose dismissal.
- Return and dismissal use the same fixed-timestep spring solver as Sheet.
- Pointer capture has window fallbacks.
- `pointercancel` and `lostpointercapture` return to rest.
- Re-grabbing a returning toast starts from the live visual offset.
- Logical `start` and `end` resolve from the current document direction.

## Accessibility

The moving `<ol>` is deliberately not a live region. Two visually hidden,
stable announcers sit beside it:

- normal/success/info/warning updates use `role="status"` and polite delivery;
- errors or `important: true` use `role="alert"` and assertive delivery.

The announcer text is derived from message + description, or from an explicit
`announcement` string for non-text custom content. A revision is announced once.

Toasts are keyboard-focusable. The default <kbd>Alt</kbd>+<kbd>T</kbd> shortcut
focuses the front toast, focus pauses its timer, and <kbd>Escape</kbd> dismisses
the focused toast. When the shortcut moved focus into the region, dismissal
restores the element that previously held focus.

Actions and close/cancel controls are real buttons. Toast appearance never
steals focus automatically.

## Styling contract

`Toaster.jsx` imports no stylesheet.

- `velvet-ui/base.css` supplies placement, stacking, motion handoff, and the
  visually hidden live-region rules.
- `velvet-ui/styles.css` adds the optional default skin.
- `unstyled`, `className`, `style`, `classNames`, `toastOptions`, and per-toast
  overrides support consumer styling.

Stable selectors include:

```text
data-slot="toaster|toast|icon|body|title|description|action|cancel|close-button"
data-state="entering|open|dragging|exiting"
data-type, data-position, data-dragging, data-unstyled
```

Default theme values are exposed through `--velvet-toast-*` custom properties.

## Verification

`scripts/toast.mjs` covers:

- simultaneous middle-exit/reflow and final gap geometry;
- dynamic height updates;
- queue cap and promotion;
- polite/assertive semantics;
- hotkey focus, pause, Escape reason, and focus restoration;
- update, promise phases/finally, styling hooks, and unstyled rendering;
- late promise settlement after dismissal.

`scripts/toast-drag.mjs` covers:

- release ignoring later pointer movement;
- return-to-rest;
- pointer cancel;
- mid-spring re-grab without a jump;
- axis locking;
- allowed swipe dismissal and reason;
- live RTL direction updates.

Both harnesses fail with a non-zero exit code on any assertion or runtime error.
