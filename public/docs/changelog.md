# Changelog

> Release notes for changes that affect installation, APIs, styling, behavior, performance, or upgrades.

Web: https://velvetui.co/docs/changelog

A human-readable record of the changes that affect how Velvet is installed, composed, styled, or experienced. Internal refactors appear only when they change reliability, bundle size, or extension points.

## 0.2.0 · 2026-08-04

### Documentation

- Moved every guide to its own server-rendered route.
- Added a Markdown response for every page at `/docs/<slug>.md`.
- Added View as Markdown and Copy Markdown controls.
- Added complete nested-modal navigation recipes for plain CSS and Tailwind CSS v4.
- Added a bring-your-own-components guide covering custom actions, surfaces, Views, visual parts, layouts, refs, and event precedence.
- Added Bun alongside npm, pnpm, and Yarn in installation examples.
- Documented label ownership, native scrollbar placement, swipe-back through content, button semantics, and mobile verification.
- Documented framework-free motion, React motion hooks, interruption, failure behavior, focused CSS, and the complete Depth contract.

### Library

- `Sheet.Portal` and `Sheet.Panel` now accept a React ref directly as their container.
- `Sheet.Panel` and every styled composition now accept a custom `view` element while retaining gesture, focus, and modal behavior.
- Backdrop, handle, and bleeding-background slots accept custom elements; `false` or `null` removes an optional part.
- `Sheet.Panel asChild` and composition `Content asChild` support fully custom, ref-forwarding surface components.
- Persistent Sheet exposes an optional backdrop slot while remaining non-modal and backdrop-free by default.
- Added a development diagnostic for a presented View without a registered Title.
- Split the sheet runtime into state, motion, gesture, modal, and focus controllers.
- Added document-scoped managers so multiple documents and embedded previews remain isolated.
- Added framework-free `motion`, React-only `motion/react`, and focused `utilities` entry points.
- Added interruptible WAAPI playback, safe spring sampling, travel interpolation, and lifecycle-owned motion hooks.
- Renamed the Depth contract to `depthSheetVariables`, `depthSheetDefaultTokens`, and `depthSheetStackingAnimation`.
- Added focused `sheet.css`, `toast.css`, and `toast-theme.css` entries alongside the convenience bundles.
- Added tree-shakable entry points for the supplied compositions.
- Added per-toast `swipeDirections` overrides and a duplicate-Toaster runtime diagnostic.
- Minified published JavaScript with repeated standards-safe Terser passes and every CSS entry with Lightning CSS, without property-name mangling or unsafe transforms.

### Fixed

- Removed stale pure annotations from published chunks so consumer Rollup builds remain warning-free.
- Fixed `Sheet.View asChild` forwarding and custom Panel/composition surfaces with injected mechanics.
- Preserved custom View children and composition backdrop travel when replacing visual parts.
- Made opener capture and focus restoration deterministic for custom triggers, including motion-skipped exits.
- Kept horizontal swipe-back available when a gesture starts over vertically scrollable sheet content.
- Prevented non-text focus and sheet action clicks from resetting coordinated content to the top.
- Hardened Toast swipes against duplicate fallback events, touch streams reporting `buttons: 0`, coalesced pointer-up coordinates, pointer-capture loss, direction reversal, and secondary-pointer takeover.
- Made Toast dismissal bidirectional on its natural placement axis, allowed swipes to begin on action controls without firing them, and stopped non-dismissible toasts from blocking mobile page panning.
- Added a clear development error for invalid `asChild` children.
- Restored the shared trigger-geometry helper after the controller split.
- Removed the obsolete SPA entry that could override TanStack Start SSR during development.

## 0.1.0 · Initial preview

### Added

- Headless Sheet primitives with native scroll-snap gestures and spring-driven programmatic travel.
- Snap points, controlled and uncontrolled state, modal focus management, and nested Sheet Stack coordination.
- Bottom Sheet, Depth Sheet, Card Expansion, Persistent Sheet, and Lightbox compositions.
- Viewport-fixed toast stacks with variants, promises, actions, and flick dismissal.

### Upgrade notes

This is the first published contract. Import structural CSS explicitly and prefer the focused package entry points shown in each guide.
