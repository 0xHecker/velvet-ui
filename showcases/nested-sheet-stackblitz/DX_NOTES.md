# Nested sheet showcase — developer experience notes

These notes came from building real plain-CSS and Tailwind CSS v4 consumers
against `@velvetui/react@0.1.0`. The package issues below were fixed in 0.2.0;
the showcase now consumes the published `@velvetui/react@0.2.0` package.

## Resolved in 0.2.0

- Published ESM and CommonJS chunks are scrubbed of stale purity annotations,
  and the bundle verification command now fails if one returns.
- `Sheet.Portal` and `Sheet.Panel` accept a React `RefObject` as `container`, so
  a same-component portal host no longer needs callback-ref state or a guarded
  second tree.
- Primitive and styled composition surfaces now work with `asChild`, and the
  outer View, backdrop, handle, and bleeding background accept real custom
  component slots without dropping Velvet behavior.
- A development warning identifies a presented View without its own Title and
  explains the nested Root ownership rule.
- The documentation now includes the full plain-CSS and Tailwind CSS v4
  composition, the exact flex/overflow chain, native scrollbar placement,
  cross-axis swipe rules, semantic button rules, and a phone verification pass.
- Installation and troubleshooting docs name `sheet.css` explicitly. The CSS
  remains opt-in so focused imports stay tree-shakable and headless consumers
  do not receive an implicit theme.

## Package issues found in 0.1.0

### 1. Published bundles produce Rollup annotation warnings

Severity: medium

A clean Vite production build succeeds, but Rollup prints repeated warnings for
published files such as `utilities-C75iEhzh.js`,
`SheetGestureSurface-CutY1u_8.js`, `sheetScope-D7xEzXuI.js`, and
`SheetState-UTo6MZoy.js`:

> A `/* @__PURE__ */` annotation is in a position Rollup cannot interpret.

The package works, but a first-time consumer sees a wall of warnings from
Velvet UI. The library minification step should either preserve these
annotations in Rollup-compatible positions or remove them before publishing.
The same warnings appeared in both the plain-CSS consumer and the Tailwind CSS
v4 consumer, so this is package output rather than an integration-specific
warning.

### 2. Constraining a nested sheet to a modal is possible but under-explained

Severity: medium

`Sheet.Portal container={host}` provides the required primitive, but a nested
sheet that must stay inside a centered modal also needs:

- an explicit portal host inside the modal;
- a positioned, clipped host with the parent's radius;
- the nested `Sheet.View` changed from its default fixed viewport positioning to
  absolute positioning;
- a child panel sized to the host.

This is a strong showcase pattern and deserves an official “sheet inside a
modal” recipe. A higher-level boundary/container prop could remove most of the
layout ceremony.

### 3. Scroll handoff rules are correct but easy to violate accidentally

Severity: low to medium

The successful structure is exactly one vertical overflow surface:

`Scroll.Root → Scroll.View → Scroll.Content`

The sticky header must sit outside `Scroll.View`. The scroll view needs a
definite height through `flex: 1; min-height: 0`, and vertical containment must
not add cross-axis gesture containment. Adding another overflow wrapper or a
cross-axis gesture trap breaks swipe-back through the article body.

The existing primitives handle the interaction well once composed correctly,
but the failure modes should be shown next to the recommended recipe.

### 4. Titles and descriptions bind to the nearest nested root

Severity: medium

`Sheet.Title` and `Sheet.Description` correctly use React context, but it is easy
to put a nested `Sheet.Root` too high in the tree. In that arrangement, a title
which visually belongs to the parent registers with the child sheet instead.
The result is subtle: the parent dialog can be unnamed while the child is
announced with the parent's title.

The fix is to keep the parent's title and description outside the nested root,
and let the nested root wrap only its own triggers and portal. A dedicated docs
warning or development-time diagnostic would make this much easier to catch.

### 5. A container element requires stateful ref plumbing

Severity: low to medium

`Sheet.Portal` accepts the resolved element for `container`. In React, that
means the consumer needs a callback ref stored in state, a guarded portal
render, and one extra render before the nested sheet can mount:

`const [portalHost, setPortalHost] = useState(null)`

This works reliably, but it is a lot of ceremony for a common nested-surface
pattern. Supporting a `RefObject` directly, or exposing a scoped portal host,
would make the composition clearer and avoid the mount guard.

### 6. The required component stylesheet is easy to omit

Severity: low

The consumer must import `@velvetui/react/sheet.css` in addition to importing
the components. Omitting it leaves the React composition intact while the
essential sheet behavior/styles are absent, which can look like a broken
component rather than a missing setup step. Every installation snippet and
framework recipe should keep the stylesheet import directly beside the package
imports.

## What worked well

- Vertical wheel/trackpad scrolling stays in the nested article.
- The modal behind the article keeps its exact scroll position.
- Horizontal swipe-back works through text, cards, and other article content.
- Back closes only the nested sheet and restores focus to its trigger.
- Close can dismiss both controlled layers without a URL change or jump to the
  top of the page.
- `Scroll.View` is a real native overflow element, so its scrollbar can be
  styled with standard CSS and remains usable.
- The exact same composition works with ordinary CSS and Tailwind CSS v4; no
  adapter or package-specific Tailwind configuration is required.

## Showcase-only setup notes

- The plain Vite JavaScript starter does not install the React transform plugin,
  so JSX files must import `React` explicitly (or the project must add
  `@vitejs/plugin-react`). This is not a Velvet UI issue.
- Use `type="button"` on Back, Close, and row triggers. Link-like controls such
  as `href="#"` create the jump-to-top behavior the showcase is meant to avoid.
- StackBlitz's Monaco editor needs real paste/keyboard events; programmatic
  input filling does not update its text model. This affected publishing the
  showcase only and is not a Velvet UI issue.
- The forked StackBlitz accepted project-title edits in its metadata popover but
  restored the generated “(duplicated)” title after reload. The public project,
  dependency manifest, source files, and preview all saved correctly; this is a
  StackBlitz metadata issue, not a package issue.
