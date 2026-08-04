# Changelog

> Release notes for changes that affect installation, APIs, styling, behavior, performance, or upgrades.

Web: https://velvetui.co/docs/changelog

A human-readable record of the changes that affect how Velvet is installed, composed, styled, or experienced. Internal refactors appear only when they change reliability, bundle size, or extension points.

## Unreleased

### Documentation

- Moved every guide to its own server-rendered route.
- Added a Markdown response for every page at `/docs/<slug>.md`.
- Added View as Markdown and Copy Markdown controls.
- Added practical guides for CSS, Tailwind CSS v4, Styled Components, nesting, accessibility, and every homepage composition.
- Documented framework-free motion, React motion hooks, interruption, failure behavior, focused CSS, and the complete Depth contract.

### Library

- Split the sheet runtime into state, motion, gesture, modal, and focus controllers.
- Added document-scoped managers so multiple documents and embedded previews remain isolated.
- Added framework-free `motion`, React-only `motion/react`, and focused `utilities` entry points.
- Added interruptible WAAPI playback, safe spring sampling, travel interpolation, and lifecycle-owned motion hooks.
- Renamed the Depth contract to `depthSheetVariables`, `depthSheetDefaultTokens`, and `depthSheetStackingAnimation`.
- Added focused `sheet.css`, `toast.css`, and `toast-theme.css` entries alongside the convenience bundles.
- Added tree-shakable entry points for the supplied compositions.

### Fixed

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
