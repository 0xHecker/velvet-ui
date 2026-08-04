# Troubleshooting

> Diagnose missing styles, swallowed refs, controlled-state loops, gesture handoff, mobile keyboards, nested sheets, and third-party portals.

Web: https://velvetui.co/docs/troubleshooting

Most failures come from missing structural CSS, swallowed refs, unclear state ownership, or the wrong overflow element. Check these before tuning springs.

## The trigger renders but nothing opens

Confirm `base.css` or `styles.css` is loaded. Verify the trigger is inside the same Root. If using `asChild`, confirm the child forwards its ref and click props.

## The sheet looks unstyled

The headless package intentionally supplies mechanics only. Import the matching composition CSS, use `styles.css`, or author a product class on Content or Panel.

## The controlled sheet snaps back

When `open` or `snap` is controlled, update it from `onOpenChange` or `onSnapChange`. Passing a fixed value while ignoring the callback rejects every gesture request.

## Scroll and swipe fight each other

Use one real overflow container through Scroll.View and set `tracks="auto"` on the Sheet.View. Remove intermediate vertical scrollers.

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
