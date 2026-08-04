# Troubleshooting

> Diagnose missing styles, swallowed refs, controlled-state loops, gesture handoff, mobile keyboards, nested sheets, and third-party portals.

Web: https://velvetui.co/docs/troubleshooting

Most failures come from missing structural CSS, swallowed refs, unclear state ownership, or the wrong overflow element. Check these before tuning springs.

## The trigger renders but nothing opens

Confirm `sheet.css`, `base.css`, or `styles.css` is loaded. Verify the trigger is inside the same Root. If using `asChild`, confirm the child forwards its ref and click props.

## The sheet looks unstyled

The headless package intentionally supplies mechanics only. Import the matching composition CSS, use `styles.css`, or author a product class on Content or Panel.

## Each toast appears twice

Mount exactly one `Toaster` per document. Every Toaster subscribes to the same global toast store, so two renderers intentionally produce two visual copies. Velvet logs a direct warning when it detects this setup.

## The controlled sheet snaps back

When `open` or `snap` is controlled, update it from `onOpenChange` or `onSnapChange`. Passing a fixed value while ignoring the callback rejects every gesture request.

## Scroll and swipe fight each other

Use one real overflow container through Scroll.View and set `tracks="auto"` on the Sheet.View. Remove intermediate vertical scrollers.

## Swipe works beside the content but not over it

Leave `scrollGestureTrap` at its default `false` when a right or left sheet contains a vertical scroller. If vertical chaining must stop, use `scrollGestureTrap={{ y: true }}`; never use `true`, which traps both axes. Remove application CSS such as `overscroll-behavior: contain`, then test the swipe by starting directly over a paragraph or card.

## The nested sheet has no scrollbar

Give the modal body and nested View a bounded height, then use exactly one `Scroll.Root → Scroll.View → Scroll.Content` chain. Every flex ancestor above Scroll.View needs `min-height: 0`; Scroll.View is the element that receives `overflow-y: auto` and scrollbar styling.

## Clicking Back or Close jumps the page

Use a real `<button type="button">`. An anchor with `href="#"` navigates to the document top, and a button without an explicit type submits its nearest form. Do not repair either behavior with preventDefault; give the control the correct semantics.

## The child dialog has the parent's title

Titles register with the nearest Root. Render the parent Title and Description before the child `Sheet.Root`, then render a separate Title and Description inside the child Root.

## The nested sheet escapes the parent modal

Create a clipped, positioned portal host inside the modal and pass its ref directly: `<Sheet.Portal container={nestedHostRef}>`. Position the nested View absolutely so it resolves against that host instead of the viewport.

## A bottom action is hidden on mobile

Use `--velvet-100lvh`, safe-area padding, and Scroll.View with `safeArea="visual-viewport"`. Avoid fixed pixel heights derived from `window.innerHeight`.

## The keyboard causes jumps

Add `interactive-widget=resizes-content`, keep the composer in the coordinated Scroll.View, and avoid translating the sheet in a separate focus handler.

## A third-party popup cannot be clicked

Wrap its portal root with ExternalOverlay.Root so the modal manager treats it as part of the active sheet instead of inert background content.

## Nested sheets dim or shrink too much

Use SheetStack or DepthSheet nesting and bound custom stacking functions by depth. Do not add another app-wide backdrop for each nested layer.

## Hydration differs

Keep portal-only reads out of render. Prefer CSS media queries; use `useClientMediaQuery` only when behavior, not appearance, must branch after hydration.
