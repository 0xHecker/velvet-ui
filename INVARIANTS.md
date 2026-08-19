# Velvet UI invariants

This is the short integration contract for people, coding agents, and test suites. These rules describe behavior that applications may rely on.

## Component families

- Use `Lightbox` for lightboxes; do not imitate one by styling a `Sheet`.
- `Trigger`, `Close`, `Title`, and `Description` must match their nearest Root family. A `Sheet.Close` does not control a `Lightbox.Root`, and vice versa.
- A close control must target the frontmost dismissible layer. Close a child overlay before its parent.

## State and lifecycle

- A controlled, initially open draggable Sheet never requests `open=false` until a real gesture or explicit dismissal request occurs.
- `onDismissRequest` is the request boundary. Returning or resolving `false` rejects the request; any other successful result permits the close.
- `onOpenChange(false, detail)` is the controlled state request. It is distinct from exit motion and `onExitComplete`.
- Dismissal detail always names the cause: `trigger`, `close-trigger`, `escape`, `outside-press`, `swipe`, or `programmatic`.
- Reduced motion follows the same state machine. It changes motion, not lifecycle meaning.

## Focus and modality

- Every modal layer needs a resolvable accessible title. Add a description when it contributes information beyond the title.
- Route-open or triggerless surfaces need explicit `initialFocusRef` and `restoreFocusRef` targets.
- Do not race Velvet focus restoration with arbitrary timeouts. Navigate or clear the old surface from `onExitComplete`.
- Busy destructive work must own dismissal and keep destructive controls locked until the request resolves.

## Composition and portals

- `asChild` requires exactly one non-Fragment child that forwards its ref, data attributes, ARIA attributes, and event props to one stable DOM element.
- Use one Velvet scroll chain per layer.
- A nested View must be positioned relative to and clipped by its parent host. Prefer `Sheet.NestedPortalHost` with `Sheet.NestedPanel`.
- A nested host must not introduce a lower stacking context than its parent surface.
- Third-party portals must join the owning scope through `ExternalOverlay.Root` or an official adapter.
- Scope enrollment does not grant dismissal ownership. Use `ExternalOverlay.DismissLayer` when the child should own Escape and the first outside press.
- Wrap the third-party library's DOM-bearing popup or positioner—not its Portal or controller component.

## Styling and diagnostics

- Velvet structural CSS is required. Product styles may override tokens at a local application scope.
- Package defaults use CSS variable fallbacks rather than assigning z-index tokens globally.
- Nested positioning is applied structurally by `Sheet.NestedPanel`; do not rely on Tailwind utility cascade order to override a fixed View.
- In development, inspect mounted layers with `window.__velvet.inspect()` and assert DOM conformance with `expectVelvetLayer` from `@velvetui/react/testing`.
