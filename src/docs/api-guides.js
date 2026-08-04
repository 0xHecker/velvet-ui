import { DEMO_SOURCES } from "./demo-sources.js";

const code = (language, source) => `\`\`\`${language}\n${source.trim()}\n\`\`\``;
const section = (title, ...content) => [`## ${title}`, ...content].join("\n\n");
const guide = (...content) => content.filter(Boolean).join("\n\n");

const importMap = `| Import | What it contains | CSS |
| --- | --- | --- |
| \`@velvetui/react/sheet\` | Sheet and SheetStack only | \`@velvetui/react/sheet.css\` |
| \`@velvetui/react/motion\` | Framework-free springs, WAAPI, and travel interpolation | none |
| \`@velvetui/react/motion/react\` | Lifecycle-owned motion hooks | none |
| \`@velvetui/react/utilities\` | Scroll, accessibility, fixed, island, and overlay helpers | \`@velvetui/react/sheet.css\` |
| \`@velvetui/react/sheet-morph\` | Shared-origin geometry | \`@velvetui/react/sheet.css\` |
| \`@velvetui/react/theme-backdrop\` | Backdrop plus browser theme tint | \`@velvetui/react/sheet.css\` |
| \`@velvetui/react/bottom-sheet\` | Styled mobile/task sheet | \`sheet.css\` + \`bottom-sheet.css\` |
| \`@velvetui/react/depth-sheet\` | Recursive iOS-like depth stack | \`sheet.css\` + \`depth-sheet.css\` |
| \`@velvetui/react/card-expansion\` | Trigger-to-modal expansion | \`sheet.css\` + \`card-expansion.css\` |
| \`@velvetui/react/persistent-sheet\` | Non-modal collapsed surface | \`sheet.css\` + \`persistent-sheet.css\` |
| \`@velvetui/react/lightbox\` | Full-screen media surface | \`sheet.css\` + \`lightbox.css\` |
| \`@velvetui/react/toast\` | Toaster and imperative toast API | \`toast.css\` or \`toast-theme.css\` |
| \`@velvetui/react\` | Every public export | Import the CSS you use |`;

const rootProps = `| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| \`open\` | \`boolean\` | uncontrolled | Controlled presented state |
| \`defaultOpen\` | \`boolean\` | \`false\` | Initial uncontrolled state |
| \`onOpenChange\` | \`(open) => void\` | — | Receives requested state changes |
| \`snap\` | \`number\` | uncontrolled | Controlled detent index |
| \`defaultSnap\` | \`number\` | \`defaultOpen ? 1 : 0\` | Initial detent |
| \`onSnapChange\` | \`(snap) => void\` | — | Receives detent changes |
| \`sheetRole\` | \`"dialog" \\| "alertdialog"\` | \`"dialog"\` | Modal semantics and dismissal policy |
`;

const viewProps = `| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| \`side\` | \`top \\| right \\| bottom \\| left \\| center\` | \`bottom\` | Authored content placement |
| \`snapPoints\` | \`number \\| string \\| array\` | none | Intermediate resting lengths |
| \`draggable\` | \`boolean\` | \`true\` | Enables native gesture travel |
| \`dismissible\` | \`boolean\` | \`true\` | Allows the closed destination |
| \`modal\` | \`boolean\` | \`true\` | Enables inertness, focus scope, and scroll lock |
| \`tracks\` | \`Track \\| Track[] \\| "auto"\` | inferred | Allowed gesture direction or scroll handoff |
| \`swipeOvershoot\` | \`boolean\` | \`true\` | Allows native rubber-band travel |
| \`swipeTrap\` | \`boolean \\| { x?: boolean; y?: boolean }\` | modal-aware | Controls gesture containment by axis |
| \`snapOutAcceleration\` | \`"auto" \\| number\` | \`auto\` | Biases native travel toward dismissal |
| \`snapToEndDetentsAcceleration\` | \`"auto" \\| number\` | \`auto\` | Biases travel toward edge detents |
| \`enteringAnimationSettings\` | preset or settings | \`smooth\` | Programmatic opening motion |
| \`exitingAnimationSettings\` | preset or settings | 520 / 44 / 1 spring | Programmatic closing motion |
| \`steppingAnimationSettings\` | preset or settings | entering settings | Programmatic detent motion |
| \`nativeEdgeSwipePrevention\` | \`boolean\` | \`false\` | Prevents browser edge navigation conflicts |`;

const compositionContentProps = `| Prop | Bottom | Persistent | Depth | Card | Lightbox |
| --- | --- | --- | --- | --- | --- |
| \`portalProps\` | yes | yes | yes | yes | yes |
| \`viewProps\` | yes | yes | yes | yes | yes |
| \`view\` element slot | yes | yes | yes | yes | yes |
| \`backdrop\` / \`backdropProps\` | on | off | on | on | on |
| \`handle\` / \`handleProps\` | on | on | on | — | — |
| \`bleedingBackground\` / props | on | on | on | — | — |
| \`scroll\` | yes | yes | always | yes | no |
| \`scrollRootProps\` | yes | yes | yes | yes | no |
| \`scrollViewProps\` | yes | yes | yes | yes | no |
| \`scrollContentProps\` | yes | yes | yes | yes | no |
| \`from\` | no | no | no | yes | no |`;

const toasterProps = `| Prop | Type | Default |
| --- | --- | --- |
| \`position\` | viewport position | \`bottom-right\` |
| \`duration\` | milliseconds | \`4000\` |
| \`gap\` | pixels | \`14\` |
| \`stack\` | boolean | \`true\` |
| \`expand\` | boolean | \`false\` |
| \`visibleToasts\` | number | \`3\` |
| \`closeButton\` | boolean | \`true\` |
| \`closeButtonPosition\` | \`left \\| right\` | \`right\` |
| \`richColors\` | boolean | \`false\` |
| \`swipeDirections\` | direction array | both directions on the placement axis |
| \`hotkey\` | key descriptor array or null | \`["altKey", "KeyT"]\` |
| \`pauseWhenPageIsHidden\` | boolean | \`true\` |
| \`dir\` | \`ltr \\| rtl \\| auto\` | \`auto\` |
| \`offset\` | number or CSS length | \`24\` |
| \`containerAriaLabel\` | string | \`Notifications\` |
| \`icons\` | icon map | built-in glyphs |
| \`toastOptions\` | ToastOptions | \`{}\` |
| \`className\`, \`classNames\`, \`style\` | styling hooks | — |
| \`unstyled\` | boolean | \`false\` |`;

const toastOptions = `| Option | Type | Notes |
| --- | --- | --- |
| \`id\` | string or number | Reusing an id updates one toast |
| \`type\` | default, success, error, info, warning, loading | Prefer typed methods |
| \`description\` | ReactNode | Secondary guidance |
| \`icon\` | ReactNode | Replaces the type icon |
| \`announcement\` | string | Explicit screen-reader text |
| \`duration\` | number | Loading is persistent until updated or dismissed |
| \`dismissible\` | boolean | Controls swipe, Escape, and close affordance |
| \`swipeDirections\` | direction array | Per-toast override of the Toaster policy |
| \`important\` | boolean | Uses the assertive live region |
| \`action\`, \`cancel\` | \`{ label, onClick }\` | Return \`false\` from action to keep it open |
| \`closeButton\` | boolean | Per-toast override |
| \`closeButtonPosition\` | \`left \\| right\` | Per-toast physical side override |
| \`closeButtonAriaLabel\` | string | Accessible close label |
| \`className\`, \`descriptionClassName\`, \`classNames\` | strings or map | Includes \`closeButton\` and \`closeIcon\` hooks |
| \`style\` | CSSProperties | Per-toast custom properties |
| \`unstyled\` | boolean | Retains behavior and structural a11y only |
| \`onDismiss\` | callback | Includes dismissal reason |
| \`onAutoClose\` | callback | Fires only for timeout closure |`;

const cssImports = `import "@velvetui/react/sheet.css";             // Sheet/Scroll mechanics only
import "@velvetui/react/toast.css";             // Toaster mechanics only
import "@velvetui/react/toast-theme.css";       // Toaster mechanics + default skin
import "@velvetui/react/base.css";              // common Sheet + Toaster mechanics
import "@velvetui/react/styles.css";            // mechanics + every supplied skin
import "@velvetui/react/bottom-sheet.css";       // one composition
import "@velvetui/react/card-expansion.css";
import "@velvetui/react/depth-sheet.css";
import "@velvetui/react/lightbox.css";
import "@velvetui/react/persistent-sheet.css";`;

const sheetImports = `import {
  Sheet,
  SheetStack,
} from "@velvetui/react/sheet";
import "@velvetui/react/sheet.css";`;

const demoSourceLinks = DEMO_SOURCES.map(
  (demo, index) =>
    `${index + 1}. [${demo.title} exact JSX and CSS](/docs/examples/${demo.id}.md)`,
).join("\n");

export const API_GUIDES = {
  "package-exports": guide(
    "Velvet ships focused ESM and CommonJS entry points. Importing a composition does not pull every other composition into the application bundle.",
    section("Public entry points", importMap),
    section(
      "Smallest reliable imports",
      code("tsx", `import { Sheet } from "@velvetui/react/sheet";
import { animate } from "@velvetui/react/motion";
import { CardExpansion } from "@velvetui/react/card-expansion";
import { toast, Toaster } from "@velvetui/react/toast";

import "@velvetui/react/sheet.css";
import "@velvetui/react/card-expansion.css";`),
      "Use the root `@velvetui/react` entry when convenience matters more than the last few bytes. `motion` has no React import; `motion/react` adds hooks; `sheet` does not pull either React hooks or optional compositions. CSS remains explicit because it is a side effect and bundlers must preserve its order.",
    ),
    section(
      "React and server rendering",
      "React 18 and 19 are peer dependencies. Trigger markup renders on the server. Portalled surfaces and document managers activate after hydration.",
      "Call `toast()` from client code or an event handler. The `Toaster` itself can appear in an SSR tree because its portal host is discovered after mount.",
    ),
    section(
      "Tree-shaking checklist",
      "- Import from focused subpaths.\n- Use `motion`, not `motion/react`, outside React components.\n- Import `sheet.css` or `toast.css` instead of `base.css` when only one primitive family is present.\n- Import only the composition CSS you use.\n- Do not re-export the entire root package from a local barrel.\n- Keep `sideEffects: ['**/*.css']` when repackaging Velvet.\n- Measure a minified consumer build, not the dev graph or raw source chunks.",
    ),
  ),

  "server-rendering": guide(
    "Velvet is safe to render in an SSR tree. Triggers, labels, and authored page content produce ordinary server HTML; portal hosts, focus management, inertness, and gesture measurement activate after hydration.",
    section(
      "The boundary to remember",
      "The component that owns interactive sheet state is client code. The rest of the route can stay server rendered. Do not gate the whole page behind a mounted check and do not render a second copy of the modal on the server.",
      "A portal only changes physical DOM placement; it remains inside the same React tree for context and events. Velvet discovers the browser portal container after mount.",
    ),
    section(
      "Next.js App Router",
      code("tsx", `// app/layout.tsx
import "@velvetui/react/base.css";
import "@velvetui/react/bottom-sheet.css";

export default function Layout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}`),
      code("tsx", `// app/components/account-sheet.tsx
"use client";

import { BottomSheet } from "@velvetui/react/bottom-sheet";

export function AccountSheet({ children }) {
  return (
    <BottomSheet.Root>
      <BottomSheet.Trigger>Account</BottomSheet.Trigger>
      <BottomSheet.Content>{children}</BottomSheet.Content>
    </BottomSheet.Root>
  );
}`),
      "Only the interactive entry file needs `use client`; placing the directive on the route or layout would move more code into the client bundle than necessary.",
    ),
    section(
      "TanStack Start",
      code("tsx", `// src/routes/__root.tsx
import "@velvetui/react/base.css";
import "@velvetui/react/depth-sheet.css";

export const Route = createRootRoute({
  component: RootComponent,
});`),
      code("tsx", `// A normal isomorphic route component
import { DepthSheet } from "@velvetui/react/depth-sheet";

export function ProfileRoute() {
  return (
    <DepthSheet.Root>
      <DepthSheet.Page><ServerRenderedPage /></DepthSheet.Page>
      <DepthSheet.Trigger>Open profile</DepthSheet.Trigger>
      <DepthSheet.Content><Profile /></DepthSheet.Content>
    </DepthSheet.Root>
  );
}`),
      "Keep browser events and `toast()` calls in component or client-event code. Do not import Velvet from a `.server.ts` module. TanStack route loaders are isomorphic, so they should return data rather than DOM nodes or portal containers.",
    ),
    section(
      "Vite SSR, Remix, and React Router",
      "Import structural CSS through the framework root. Render the same component tree on server and client, then hydrate it with the framework. Never call `createRoot` over server markup; hydration must reuse the existing DOM.",
      code("tsx", `export function ProductRoute() {
  return (
    <Sheet.Root>
      <Sheet.Trigger>Filters</Sheet.Trigger>
      <Sheet.Panel side="right">
        <Sheet.Title>Filters</Sheet.Title>
        <FilterForm />
      </Sheet.Panel>
    </Sheet.Root>
  );
}`),
    ),
    section(
      "Hydration checklist",
      "- Keep `defaultOpen` deterministic between server and client.\n- Use controlled `open` only from serializable initial state.\n- Do not read `window`, viewport dimensions, or media queries while authoring the initial tree.\n- Prefer CSS media queries for responsive sheet geometry.\n- Import global Velvet CSS once, in stable order.\n- Mount one `Toaster` in a client-capable application shell.\n- Call `toast()` only after hydration, normally from an event or effect.",
    ),
    section(
      "Primary references",
      "- [React portals](https://react.dev/reference/react-dom/createPortal)\n- [Next.js client boundaries](https://nextjs.org/docs/app/api-reference/directives/use-client)\n- [TanStack Start execution model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)",
    ),
  ),

  styling: guide(
    "Velvet owns geometry, focus, and gestures. Product CSS owns color, spacing, typography, and layout. Use classes for a component instance and variables for theme-level decisions.",
    section(
      "Plain CSS",
      code("tsx", `<Sheet.Panel side="bottom" className="settings-sheet">
  <Sheet.Title>Settings</Sheet.Title>
  <SettingsForm />
</Sheet.Panel>`),
      code("css", `.settings-sheet {
  --velvet-panel-radius: 28px;
  --velvet-panel-padding: 24px;
  width: min(100%, 42rem);
  background: var(--surface);
  color: var(--foreground);
}`),
    ),
    section(
      "Tailwind CSS v4",
      code("tsx", `<Sheet.Panel
  side="bottom"
  className="w-full max-w-2xl rounded-t-[28px] bg-white p-6 text-slate-950 shadow-2xl"
>
  <Sheet.Title className="text-xl font-semibold">Settings</Sheet.Title>
</Sheet.Panel>`),
      "Keep `sheet.css` or the combined `base.css` imported. Tailwind styles the authored surface; it should not recreate the native scroll-snap track or portal mechanics.",
    ),
    section(
      "Styled Components and Emotion",
      code("tsx", `const Surface = styled.div\`
  width: min(100%, 42rem);
  border-radius: 28px 28px 0 0;
  background: \${({ theme }) => theme.surface};
\`;

<Sheet.Panel side="bottom" asChild>
  <Surface><Settings /></Surface>
</Sheet.Panel>`),
      "The child of `asChild` must forward its DOM ref and event props. Use `styled.div` or a forwarding component, not a component that swallows `ref`, `style`, or pointer handlers.",
    ),
    section(
      "Choose the right CSS layer",
      code("css", cssImports),
      "Use `sheet.css` for Sheet and Scroll mechanics, `toast.css` for unstyled toast mechanics, or `base.css` when both are present. `toast-theme.css` adds only the default toast skin; `styles.css` adds every supplied skin. See CSS reference for every stable variable and data hook.",
    ),
  ),

  "custom-components": guide(
    "Use Velvet for state, gestures, focus, accessibility, and motion while your design system owns every visible element. Buttons, surfaces, headings, backdrops, handles, and the outer View can all remain your components.",
    section(
      "Use your own buttons",
      code("tsx", `const ProductButton = forwardRef(function ProductButton(
  { tone = "neutral", ...props },
  ref,
) {
  return <button ref={ref} data-tone={tone} {...props} />;
});

<Sheet.Root>
  <Sheet.Trigger asChild>
    <ProductButton tone="accent">Open filters</ProductButton>
  </Sheet.Trigger>

  <Sheet.Panel>
    <Sheet.Title>Filters</Sheet.Title>
    <Sheet.Close asChild>
      <ProductButton tone="quiet">Done</ProductButton>
    </Sheet.Close>
  </Sheet.Panel>
</Sheet.Root>`),
      "\`Trigger\`, \`Close\`, \`Step\`, and \`Handle\` render a button by default. With \`asChild\`, your element is the button; Velvet composes its ref, action, disabled state, and ARIA attributes onto that same node.",
    ),
    section(
      "Replace the entire Panel and its visual parts",
      code("tsx", `<Sheet.Root>
  <Sheet.Trigger asChild>
    <ProductButton>Open workspace</ProductButton>
  </Sheet.Trigger>

  <Sheet.Panel
    asChild
    view={<ProductView><ViewDecoration /></ProductView>}
    backdrop={<ProductBackdrop />}
    handle={<ProductGrip aria-label="Resize workspace" />}
    backdropProps={{ className: "workspace-dim" }}
  >
    <ProductSurface>
      <Sheet.Title asChild><ProductHeading /></Sheet.Title>
      <Workspace />
      <Sheet.Close asChild><ProductButton>Done</ProductButton></Sheet.Close>
    </ProductSurface>
  </Sheet.Panel>
</Sheet.Root>`),
      "\`Sheet.Panel asChild\` makes \`ProductSurface\` the real content node. The \`view\`, \`backdrop\`, and \`handle\` elements become the real behavioral nodes too. Children authored inside a custom View are preserved before Velvet's backdrop and surface layers.",
    ),
    section(
      "Do the same with a styled composition",
      code("tsx", `import { BottomSheet } from "@velvetui/react/bottom-sheet";
import "@velvetui/react/sheet.css";
import "@velvetui/react/bottom-sheet.css";

<BottomSheet.Root>
  <BottomSheet.Trigger asChild>
    <ProductButton>Open cart</ProductButton>
  </BottomSheet.Trigger>

  <BottomSheet.Content
    asChild
    view={<ProductView />}
    backdrop={<ProductBackdrop />}
    handle={<ProductGrip aria-label="Resize cart" />}
    bleedingBackground={<ProductBackground />}
  >
    <ProductSurface>
      <BottomSheet.Title>Your cart</BottomSheet.Title>
      <Cart />
      <BottomSheet.Close asChild>
        <ProductButton>Checkout</ProductButton>
      </BottomSheet.Close>
    </ProductSurface>
  </BottomSheet.Content>
</BottomSheet.Root>`),
      "The composition keeps its placement, scroll handoff, travel animation, and data hooks. Your elements keep their content, class names, inline styles, handlers, and refs. Use \`false\` or \`null\` for \`backdrop\`, \`handle\`, or \`bleedingBackground\` to remove that part; use \`true\` for Velvet's default part.",
    ),
    section(
      "The asChild contract",
      "Pass exactly one non-Fragment React element. A custom React component must forward the received ref and all DOM props to its final DOM node; React 18 consumers should use \`forwardRef\`. Velvet composes refs, concatenates class names, and lets the child's inline style override the same Velvet style key.",
      "The child's event handler runs first. Calling \`event.preventDefault()\` intentionally cancels Velvet's action, which is useful for validation or unsaved-change gates. Replacing or swallowing the received handler makes a control appear interactive without opening or closing the sheet, so prop spreading is part of the component contract.",
      code("tsx", `const ProductSurface = forwardRef(function ProductSurface(
  { children, ...domProps },
  ref,
) {
  return <section ref={ref} {...domProps}>{children}</section>;
});`),
    ),
    section(
      "Bring your own layout and scroll",
      "Set \`scroll={false}\` on BottomSheet, PersistentSheet, or CardExpansion when your surface owns its layout. If long content should hand a boundary swipe to the sheet, compose \`Scroll.Root\`, \`Scroll.View\`, and \`Scroll.Content\` yourself. DepthSheet keeps coordinated scrolling as part of its navigation contract; primitive Sheet gives complete control over the tree.",
      "Use \`viewProps\`, \`backdropProps\`, \`handleProps\`, \`bleedingBackgroundProps\`, \`scrollRootProps\`, \`scrollViewProps\`, and \`scrollContentProps\` for behavior or props on a specific layer. Use the dedicated \`view={<YourView />}\` slot—not \`viewProps.asChild\`—to replace the outer View element.",
    ),
    section(
      "Fast debugging checklist",
      "- The \`asChild\` value is one element, not a Fragment or sibling list.\n- The custom component forwards \`ref\`, \`children\`, event handlers, ARIA/data attributes, className, and style.\n- A click handler is not calling \`preventDefault()\` unintentionally.\n- Action controls are buttons, or have equivalent keyboard semantics; avoid \`href=\"#\"\`.\n- Structural \`sheet.css\` is still imported even when every visible part is custom.\n- Use \`scroll={false}\` only when your replacement layout handles overflow intentionally.",
    ),
  ),

  "css-reference": guide(
    "The public CSS contract consists of package CSS entries, custom properties, and semantic data attributes. Internal wrapper order is not part of the contract.",
    section("CSS entry points", code("css", cssImports)),
    section(
      "Core and Panel variables",
      `| Variable | Default | Scope |
| --- | --- | --- |
| \`--velvet-100lvh\` | \`100dvh\` when supported | Visible viewport height |
| \`--velvet-z-sheet\` | \`100\` | Sheet portal layer |
| \`--velvet-z-toast\` | \`9999\` | Toast layer |
| \`--velvet-panel-background\` | \`#fff\` | Sheet.Panel skin |
| \`--velvet-panel-foreground\` | \`#171923\` | Sheet.Panel text |
| \`--velvet-panel-radius\` | \`24px\` | Standard radius |
| \`--velvet-panel-padding\` | \`20px\` | Standard padding |
| \`--velvet-panel-shadow\` | layered shadow | Standard elevation |
| \`--velvet-backdrop-background\` | transparent in base | Backdrop color |
| \`--velvet-handle-background\` | current-color mix | Handle color |`,
    ),
    section(
      "Bottom and Persistent Sheet defaults",
      `| Variable suffix | Bottom Sheet | Persistent Sheet |
| --- | --- | --- |
| \`max-width\` | \`720px\` | \`720px\` |
| \`inset\` | \`16px\` | \`16px\` |
| \`max-height\` | \`760px\` | \`720px\` |
| \`top-gap\` | \`24px\` | \`24px\` |
| \`radius\` | \`28px\`, \`24px\` at 520px | same |
| \`background\` | \`#fff\` | \`#fff\` |
| \`foreground\` | \`#111827\` | \`#111827\` |
| \`content-top\` | \`48px\` | \`46px\` |
| \`content-inline\` | \`24px\` | \`24px\` |
| \`content-bottom\` | max of \`24px\` and safe area | same |
| \`handle\` | \`rgb(17 24 39 / .2)\` | same |
| \`backdrop\` | \`#000\` | no backdrop by default |`,
      "Prefix the suffix with `--velvet-bottom-sheet-` or `--velvet-persistent-sheet-`. Both expose a `shadow` variable with the layered composition elevation as its default.",
    ),
    section(
      "Card, Lightbox, and Toast defaults",
      `| Variable | Default |
| --- | --- |
| \`--velvet-card-expansion-width\` | \`min(720px, 100vw - 32px)\` |
| \`--velvet-card-expansion-height\` | \`min(820px, 100dvh - 40px)\` |
| \`--velvet-card-expansion-radius\` | \`28px\` |
| \`--velvet-card-expansion-background\` | \`#fff\` |
| \`--velvet-card-expansion-foreground\` | \`#111827\` |
| \`--velvet-card-expansion-backdrop\` | \`#000\` |
| \`--velvet-lightbox-inset\` | \`20px\`, \`12px\` at 520px |
| \`--velvet-lightbox-foreground\` | \`#fff\` |
| \`--velvet-lightbox-surface\` | \`#000\` |
| \`--velvet-lightbox-backdrop\` | \`#000\` |
| \`--velvet-toast-width\` | \`360px\` |
| \`--velvet-toast-offset\` | \`24px\` |
| \`--velvet-toast-stack-gap\` | \`14px\` |
| \`--velvet-toast-content-gap\` | \`12px\` |
| \`--velvet-toast-radius\` | \`15px\` |
| \`--velvet-toast-ease\` | \`cubic-bezier(.22, 1, .36, 1)\` |`,
    ),
    section(
      "Override composition tokens",
      code("css", `[data-velvet-depth="root"] {
  --velvet-depth-inset: max(20px, env(safe-area-inset-top));
  --velvet-depth-radius: 30px;
  --velvet-depth-surface-background: #f8f7f4;
}

[data-velvet-card-expansion="content"] {
  --velvet-card-expansion-width: min(760px, calc(100vw - 32px));
}`),
      "Depth Sheet's full token table, including bounded ten-level stacking behavior, is in Composition API.",
    ),
    section(
      "Stable data hooks",
      `| Hook | Meaning |
| --- | --- |
| \`[data-velvet="view"]\` | Fixed sheet host |
| \`[data-velvet="backdrop"]\` | Interactive backdrop |
| \`[data-velvet="content"]\` | Authored sheet surface |
| \`[data-velvet="handle"]\` | Drag and step control |
| \`[data-velvet-placement]\` | top, right, bottom, left, or center |
| \`[data-velvet-modal]\` | Current modality |
| \`[data-velvet-scroll="view"]\` | Coordinated content scroller |
| \`[data-velvet-depth]\` | Depth composition part |
| \`[data-slot="toaster"]\`, \`[data-slot="toast"]\` | Toast structure |`,
      "Style semantic hooks, not generated ids or internal spacer nodes. Scroll track attributes are structural and may change without a visual API change.",
    ),
  ),

  "sheet-api": guide(
    "The headless Sheet contract is a compound React API. Every primitive forwards its ref and normal DOM props unless the table says otherwise.",
    section("Import", code("tsx", sheetImports)),
    section("Sheet.Root", rootProps),
    section(
      "Sheet.Panel",
      "Panel is the convenient composition of Portal, View, Backdrop, Content, and an optional Handle.",
      `| Prop | Type | Default |
| --- | --- | --- |
| \`side\` | SheetSide | \`bottom\` |
| \`snapPoints\` | detent or array | none |
| \`modal\`, \`dismissible\`, \`draggable\` | boolean | View defaults |
| \`portal\` | boolean | \`true\` |
| \`container\` | Element, DocumentFragment, or React RefObject | \`document.body\` |
| \`portalProps\`, \`viewProps\` | part props | — |
| \`view\` | ref-forwarding React element | default View div |
| \`backdrop\` | boolean or element | \`true\` |
| \`backdropProps\` | Backdrop props | — |
| \`handle\` | boolean or element | \`true\` |
| \`handleProps\` | Handle props | — |
| \`contentProps\` | Content props | — |
| \`travelAnimation\`, \`stackingAnimation\` | animation map | — |`,
      code("tsx", `<Sheet.Root>
  <Sheet.Trigger>Open filters</Sheet.Trigger>
  <Sheet.Panel
    side="bottom"
    snapPoints={["40lvh", "78lvh"]}
    viewProps={{ tracks: "auto", nativeEdgeSwipePrevention: true }}
    backdropProps={{ travelAnimation: { opacity: [0, 0.42] } }}
  >
    <Sheet.Title>Filters</Sheet.Title>
    <Filters />
    <Sheet.Close>Apply</Sheet.Close>
  </Sheet.Panel>
</Sheet.Root>`),
    ),
    section(
      "Sheet.Portal",
      "Portal accepts a resolved DOM host or a React ref. Passing a ref is the preferred form for a host rendered by the same component because it does not require callback-ref state.",
      code("tsx", `const portalHostRef = useRef<HTMLDivElement>(null);

<div ref={portalHostRef} className="portal-host" />

<Sheet.Portal container={portalHostRef}>
  <Sheet.View side="right">...</Sheet.View>
</Sheet.Portal>`),
      "If the ref is assigned during the same commit as an already-open sheet, Velvet waits for the ref and mounts the portal after it resolves. A supplied ref never silently falls back to document.body while its current value is null.",
    ),
    section("Sheet.View", viewProps),
    section(
      "View callbacks",
      `| Callback | Payload |
| --- | --- |
| \`onTravel\` | \`{ progress, range, progressAtDetents }\` |
| \`onTravelStart\` | no payload |
| \`onTravelEnd\` | no payload |
| \`onTravelStatusChange\` | idleOutside, entering, idleInside, stepping, exiting |
| \`onClickOutside\` | object or handler with \`changeDefault\` |
| \`onEscapeKeyDown\` | object or handler with \`changeDefault\` |`,
      code("tsx", `<Sheet.View
  onClickOutside={{ dismiss: false }}
  onEscapeKeyDown={({ changeDefault }) => {
    if (formState.isDirty) changeDefault({ dismiss: false });
  }}
/>`),
    ),
    section(
      "Visual and action parts",
      `| Part | Important props |
| --- | --- |
| \`Sheet.Portal\` | \`container: Element \| DocumentFragment \| RefObject\` |
| \`Sheet.Backdrop\` | \`travelAnimation\`, \`asChild\` |
| \`Sheet.Content\` | \`travelAnimation\`, \`stackingAnimation\`, \`asChild\` |
| \`Sheet.BleedingBackground\` | normal div props, \`asChild\` |
| \`Sheet.Outlet\` | travel and stacking animation |
| \`Sheet.Trigger\` | \`action\`, \`snapTo\`, \`onPress\`, \`asChild\` |
| \`Sheet.Close\` | Trigger fixed to close intent |
| \`Sheet.Step\` | \`snapTo\`, \`direction: up \\| down\` |
| \`Sheet.Handle\` | close or step \`action\` |
| \`Sheet.Title\` | heading props; supplies accessible name |
| \`Sheet.Description\` | paragraph props; supplies description |`,
    ),
    section(
      "Actions and detent indexes",
      "`0` means closed. Positive indexes address resting detents in travel order. Use `action=\"open\"`, `close`, `toggle`, `step`, or `{ type: 'step', snapTo, direction }`.",
      code("tsx", `<Sheet.Trigger action="open">Open</Sheet.Trigger>
<Sheet.Trigger action="toggle">Toggle</Sheet.Trigger>
<Sheet.Step snapTo={2}>Details</Sheet.Step>
<Sheet.Handle action={{ type: "step", direction: "down" }} />`),
    ),
    section(
      "asChild contract",
      "The child becomes the real DOM node. Pass one non-Fragment element and forward its ref, children, className, style, ARIA/data attributes, disabled state, and event handlers to the final DOM node.",
      "Child handlers run first and `event.preventDefault()` cancels Velvet's behavior. Refs are composed, class names are concatenated, and the child's inline style wins on collisions. See [Bring your own components](/docs/custom-components) for complete examples.",
    ),
  ),

  placement: guide(
    "Placement controls authored geometry. Tracks control direct-manipulation directions. Keeping those ideas separate makes detached dialogs, side drawers, and bidirectional media surfaces possible without a different primitive.",
    section(
      "Side and default track",
      `| side | Authored edge | Inferred track | Common use |
| --- | --- | --- | --- |
| bottom | bottom | bottom | task sheet, picker |
| top | top | top | inbox, notification tray |
| left | left | left | navigation drawer |
| right | right | right | inspector, settings |
| center | centered | bottom unless supplied | modal, lightbox, detached sheet |`,
    ),
    section(
      "Choose tracks explicitly",
      code("tsx", `<Sheet.View side="center" tracks={["top", "bottom"]}>
  <Sheet.Content className="modal-card">…</Sheet.Content>
</Sheet.View>

<Sheet.View side="right" tracks="right">
  <Sheet.Content className="inspector">…</Sheet.Content>
</Sheet.View>`),
      "A track names the edge the sheet travels toward when it leaves. `tracks=\"auto\"` gives a coordinated Scroll.View stable bidirectional geometry; native boundary chaining chooses the valid exit without reconfiguring the sheet during content scroll.",
    ),
    section(
      "Responsive geometry",
      code("css", `.filters {
  width: min(100%, 42rem);
  height: min(46rem, var(--velvet-100lvh));
}

@media (min-width: 64rem) {
  .filters {
    height: calc(var(--velvet-100lvh) - 32px);
    margin: 16px;
    border-radius: 28px;
  }
}`),
      "CSS may turn an edge sheet into a detached surface without remounting state. Change the `side` prop only when the physical gesture direction must also change.",
    ),
    section(
      "Edge-navigation conflicts",
      "Set `nativeEdgeSwipePrevention` when a left or right sheet uses the same screen edge as browser history navigation. Test the browser back gesture before enabling it globally.",
    ),
  ),

  detents: guide(
    "Detents are ordered CSS lengths measured along the sheet axis. Velvet adds the fully open content length after the supplied stops, so you declare intermediate resting positions rather than duplicating the final height.",
    section(
      "Index model",
      `| Index | Meaning |
| ---: | --- |
| 0 | closed, when dismissible |
| 1 | first supplied snap point |
| 2…n | later supplied snap points |
| final | measured full content length |`,
      "Numbers are pixels. Strings accept any resolvable CSS length such as `96px`, `42dvh`, `70lvh`, or `min(680px, 82dvh)`. Keep stops in ascending physical size.",
    ),
    section(
      "Controlled detent",
      code("tsx", `const [snap, setSnap] = useState(1);

<Sheet.Root
  defaultOpen
  snap={snap}
  onSnapChange={setSnap}
>
  <Sheet.Panel
    snapPoints={["96px", "52dvh"]}
    dismissible={false}
  >
    <Sheet.Step direction="up">Expand</Sheet.Step>
    <Sheet.Step direction="down">Collapse</Sheet.Step>
  </Sheet.Panel>
</Sheet.Root>`),
      "Do not pass a fixed `snap` while ignoring `onSnapChange`; that intentionally rejects every gesture and action.",
    ),
    section(
      "Persistent lower stop",
      "With `dismissible={false}`, travel cannot settle at index 0. A downward swipe returns to the first detent, which is the correct model for mini players, tool palettes, and persistent composers.",
    ),
    section(
      "Common mistakes",
      "- Do not include the full content height as the last supplied point.\n- Do not use descending or duplicate lengths.\n- Do not measure viewport height in React when CSS can express it.\n- Do not put the primary action below an unreachable detent.\n- Test browser chrome, safe areas, and the virtual keyboard.",
    ),
  ),

  dismissal: guide(
    "Dismissal has three independent inputs: travel, outside interaction, and Escape. Treat them as product policy rather than assuming every overlay should close from every input.",
    section(
      "Policy matrix",
      `| Input | Control |
| --- | --- |
| swipe or programmatic close destination | \`dismissible\` |
| outside pointer interaction | \`onClickOutside\` |
| Escape | \`onEscapeKeyDown\` |
| enabled travel directions | \`tracks\` |
| native rubber-band beyond the end | \`swipeOvershoot\` |`,
    ),
    section(
      "Static and conditional policy",
      code("tsx", `<Sheet.View
  dismissible
  onClickOutside={{ dismiss: false }}
  onEscapeKeyDown={({ changeDefault, nativeEvent }) => {
    if (formState.isDirty) {
      changeDefault({ dismiss: false });
      announce("Save or discard your changes first");
    }
  }}
/>`),
      "`changeDefault` changes Velvet's default for that interaction. It does not cancel unrelated application handlers.",
    ),
    section(
      "Alert dialogs",
      "Use `sheetRole=\"alertdialog\"` only for an urgent decision. Swipe dismissal is disabled by default and the workflow should present explicit safe and destructive actions.",
    ),
    section(
      "Nested dismissal",
      "Only the frontmost modal responds to Escape or outside interaction. Closing it restores focus to its opener inside the previous layer; closing the last layer restores focus to the page trigger.",
    ),
  ),

  triggers: guide(
    "Trigger parts are real buttons by default and expose stateful intent without forcing a product button style.",
    section(
      "Actions",
      `| Component or action | Result |
| --- | --- |
| \`Sheet.Trigger\` / \`action=\"open\"\` | open at the requested or default detent |
| \`action=\"close\"\` / \`Sheet.Close\` | request closed |
| \`action=\"toggle\"\` | invert open state |
| \`Sheet.Step direction=\"up\"\` | next larger detent |
| \`Sheet.Step direction=\"down\"\` | next smaller detent |
| \`Sheet.Step snapTo={n}\` | exact detent index |`,
      code("tsx", `<Sheet.Trigger asChild>
  <Button>Open filters</Button>
</Sheet.Trigger>
<Sheet.Step direction="up">More</Sheet.Step>
<Sheet.Step snapTo={1}>Compact</Sheet.Step>
<Sheet.Close asChild><Button>Done</Button></Sheet.Close>`),
    ),
    section(
      "Disabled state",
      "Only the public `disabled` prop disables an action. A new open, close, toggle, or step intent may interrupt an active transition and continues from the rendered position.",
    ),
    section(
      "asChild requirements",
      "The single non-Fragment child receives the ref, children, click handler, disabled state, ARIA/data attributes, className, and style. Forward all of them. If the design system composes click handlers, respect `event.defaultPrevented` and do not silently replace Velvet's handler. See [Bring your own components](/docs/custom-components).",
    ),
    section(
      "onPress and onClick",
      "`onClick` runs first, then `onPress`, then Velvet changes state. Either callback may call `event.preventDefault()` to cancel the Velvet action. Keep application state changes in one callback so the same gesture does not run logic twice.",
    ),
  ),

  "motion-api": guide(
    "Velvet's motion engine is a framework-free public module. Use the same sampled springs, interruption policy, reduced-motion settlement, and progress interpolation outside Sheet without importing React or any component runtime.",
    section(
      "Choose the smallest entry",
      code("tsx", `// Any JavaScript or framework
import {
  animate,
  springEasing,
  resolveTravelStyles,
} from "@velvetui/react/motion";

// React lifecycle helpers only
import {
  useAnimate,
  useReducedMotion,
  useSpringEasing,
} from "@velvetui/react/motion/react";`),
      "`@velvetui/react/motion` has no React dependency. `@velvetui/react/motion/react` adds only the hooks and their lifecycle ownership. Neither entry imports Sheet, Scroll, Toast, or a stylesheet.",
    ),
    section(
      "Animate any element",
      code("tsx", `import { animate } from "@velvetui/react/motion";

const playback = animate(card, {
  transform: ["translateY(16px) scale(.98)", "translateY(0) scale(1)"],
  opacity: [0, 1],
}, {
  id: "card-enter",
  preset: "snappy",
  commit: true,
});

const status = await playback.finished;
// "finished" | "cancelled" | "skipped"`),
      "`id` is local to one element. Starting another Velvet animation with the same element and id cancels the old playback; unrelated browser or library animations are untouched. Pass `id: false` only when concurrent effects are intentional.",
      "`finished` never rejects during normal cancellation. By default the final keyframe is committed to inline styles and the completed WAAPI animation is released. Set `commit: false` when another owner must retain final-style control.",
    ),
    section(
      "Public functions",
      `| Export | Contract |
| --- | --- |
| \`animate(element, keyframes, options)\` | Interruptible, reduced-motion-safe WAAPI playback |
| \`sampleSpring(settings, { from, to, v0 })\` | Finite normalized spring samples and settle duration |
| \`springEasing(settings, sampleOptions)\` | CSS \`linear()\` easing and duration |
| \`resolveMotionTiming(settings)\` | Normalized duration and easing |
| \`prefersReducedMotion(target?)\` | Current preference for an Element, Document, Window, or global window |
| \`resolveTravelStyles(map, progress, context?)\` | Resolve a progress map without touching the DOM |
| \`applyTravelStyles(element, map, progress, context?)\` | Resolve and apply the same map |
| \`linearEasingFromSamples(values)\` | Safe CSS easing serialization |
| \`decimateSpring(values, amount?)\` | Reduce a sampled curve for CSS or WAAPI |`,
    ),
    section(
      "SpringSettings",
      `| Field | Type | Default or behavior |
| --- | --- | --- |
| \`preset\` | gentle, smooth, snappy, brisk, bouncy, elastic | overrides conflicting physical fields |
| \`easing\` | spring, ease, ease-in, ease-out, ease-in-out, linear | \`spring\` |
| \`stiffness\` | number | \`300\` without component fallback |
| \`damping\` | number | \`34\` without component fallback |
| \`mass\` | number | \`1\` |
| \`precision\` | number | \`0.1\` |
| \`initialVelocity\` | number | \`0\` |
| \`duration\` | milliseconds | timing-easing override |
| \`delay\` | milliseconds | \`0\` |
| \`skip\` | boolean, \`auto\`, or \`never\` | follows reduced motion |`,
      "Physics are normalized to finite operating ranges. A zero mass, infinite stiffness, NaN endpoint, or equal endpoints cannot create an endless loop or non-finite keyframe list. Unknown settings fall back to a smooth spring.",
    ),
    section(
      "Preset values",
      `| Preset | Stiffness | Damping | Mass | Character |
| --- | ---: | ---: | ---: | --- |
| gentle | 560 | 68 | 1.85 | deliberate and heavy |
| smooth | 580 | 60 | 1.35 | default opening |
| snappy | 350 | 34 | 0.9 | compact controls |
| brisk | 350 | 28 | 0.65 | fast state change |
| bouncy | 240 | 19 | 0.7 | visible overshoot |
| elastic | 260 | 20 | 1 | softer rebound |`,
      code("tsx", `const timing = springEasing("smooth");
const samples = sampleSpring(
  { stiffness: 520, damping: 44, mass: 1 },
  { from: 0, to: 240, v0: 0.4 },
);`),
      "A recognized preset wins over physical values in the same object. Use either a preset or custom physics, not both.",
    ),
    section(
      "TravelAnimation",
      "`travelAnimation` and `stackingAnimation` accept a property map or `{ properties: map }`. Each value may be a literal, `[from, to]`, a callback, `false`, or `null`.",
      `| Value | Meaning |
| --- | --- |
| \`[0, 1]\` | interpolate with CSS \`calc()\` |
| \`["24px", "0px"]\` | interpolate compatible CSS values |
| \`({ progress }) => value\` | compute any property |
| \`({ tween }) => tween(from, to)\` | generate interpolation explicitly |
| literal | keep the property fixed through travel |
| \`false\`, \`null\`, \`"ignore"\` | leave the property untouched |`,
      code("tsx", `<Sheet.Backdrop travelAnimation={{ opacity: [0, 0.42] }} />
<Sheet.Content travelAnimation={{
  translateY: ["28px", "0px"],
  scale: [0.97, 1],
  borderRadius: ({ progress }) => \`\${32 - progress * 8}px\`,
}} />`),
      code("tsx", `const styles = resolveTravelStyles({
  opacity: [0, 1],
  translateY: ["12px", "0px"],
  "--scrim-strength": [0, 0.42],
}, progress);

Object.assign(node.style, styles);`),
      "Non-finite progress becomes zero. Invalid entries, unsafe object keys, and a property callback that throws are isolated instead of corrupting the rest of the map. Supply `onError(error, detail)` in the context when the application needs reporting.",
    ),
    section(
      "Transform composition",
      "The transform aliases are `translate`, `translateX/Y/Z`, `scale/X/Y/Z`, `rotate/X/Y/Z`, and `skew/X/Y`. Velvet combines them into one transform in declaration order. A literal `transform` can also participate, but product CSS should not animate the same transform property at the same time.",
    ),
    section(
      "React hooks",
      code("tsx", `function SaveButton() {
  const animate = useAnimate();
  const reduceMotion = useReducedMotion();

  return (
    <button onClick={(event) => {
      animate(event.currentTarget, {
        transform: ["scale(.96)", "scale(1)"],
      }, {
        id: "press",
        preset: "snappy",
        skip: reduceMotion,
      });
    }}>
      Save
    </button>
  );
}`),
      "`useAnimate` cancels every playback it owns when the component unmounts. `useReducedMotion` is hydration-safe and remains subscribed when the operating-system setting changes. `useSpringEasing` memoizes a CSS easing for render-time integration; pass a stable custom settings object.",
    ),
    section(
      "Sheet integration",
      code("tsx", `<Sheet.View
  enteringAnimationSettings="smooth"
  steppingAnimationSettings="snappy"
  exitingAnimationSettings={{ stiffness: 520, damping: 44, mass: 1 }}
/>`),
      `| Callback | Use |
| --- | --- |
| \`onTravel({ progress, range, progressAtDetents })\` | synchronize product UI |
| \`onTravelStart()\` | start expensive visual work |
| \`onTravelEnd()\` | settle derived state |
| \`onTravelStatusChange(status)\` | observe idleOutside, entering, idleInside, stepping, exiting |`,
      "Avoid writing `progress` to React state on every frame. Update an imperative ref, CSS variable, canvas, or external animation when continuous rendering is required.",
    ),
    section(
      "Reduced motion",
      "All spring entry points read `prefers-reduced-motion` when motion starts, not when the module loads. `skip=\"auto\"` follows the current media query, `skip={true}` forces immediate settlement, and `skip=\"never\"` deliberately opts out for motion that conveys essential state.",
      "Skipped motion still applies the final keyframe and resolves its playback as `skipped`; a missing element or unavailable WAAPI follows the same safe path. Keep the final keyframe complete enough to represent the settled UI.",
    ),
  ),

  "sheet-stack": guide(
    "SheetStack is a document-local coordinator for nested layers. It does not impose a two-sheet ceiling: each registered sheet publishes its progress, every layer receives the accumulated progress above it, and only the frontmost modal owns dismissal and focus.",
    section(
      "Primitive stack",
      code("tsx", `<SheetStack.Root>
  <SheetStack.Outlet stackingAnimation={{
    scale: ({ progress }) => Math.max(0.78, 1 - progress * 0.05),
    translateY: ({ progress }) => \`min(\${progress * 14}px, 84px)\`,
    borderRadius: ({ progress }) => \`min(\${progress * 3}px, 42px)\`,
  }}>
    <Application />
  </SheetStack.Outlet>

  <FirstSheet />
</SheetStack.Root>`),
      "Nest the next `Sheet.Root` inside the content that launches it. Registration order, not a hard-coded z-index list, defines the stack.",
    ),
    section(
      "Arbitrary depth",
      code("tsx", `function NestedLevel({ level = 1 }) {
  return (
    <Sheet.Root>
      <Sheet.Trigger>Open level {level}</Sheet.Trigger>
      <Sheet.Panel side="bottom">
        <Sheet.Title>Level {level}</Sheet.Title>
        {level < 10 && <NestedLevel level={level + 1} />}
      </Sheet.Panel>
    </Sheet.Root>
  );
}`),
      "Ten open layers remain bounded only if the visual map is bounded. Clamp translation, scale, radius, brightness, and dimming; never multiply one unbounded transform by raw depth.",
    ),
    section(
      "Depth Sheet already bounds ten layers",
      "DepthSheet joins the nearest stack automatically and reuses its portal host. Its default stacking map clamps translation at `80px`, scale at `0.76`, radius at `42px`, and brightness at `0.7`.",
      code("tsx", `<DepthSheet.Root>
  <DepthSheet.Page><Home /></DepthSheet.Page>
  <DepthSheet.Trigger>Open first level</DepthSheet.Trigger>
  <DepthSheet.Content>
    <FirstProfile>
      <DepthSheet.Root>
        <DepthSheet.Trigger>Open second level</DepthSheet.Trigger>
        <DepthSheet.Content>…repeat as needed…</DepthSheet.Content>
      </DepthSheet.Root>
    </FirstProfile>
  </DepthSheet.Content>
</DepthSheet.Root>`),
    ),
    section(
      "Ownership rules",
      "- Use one SheetStack.Root per independent application region.\n- Do not create a new stack root at every nested level.\n- Let nested DepthSheet roots discover the nearest coordinator.\n- Render third-party portals through ExternalOverlay when they belong to the front sheet.\n- Keep background actions in the backing page; modality makes them inert while a modal layer is active.\n- Give every layer a unique title and a reachable close path.",
    ),
    section(
      "Stack API",
      `| Part | Props |
| --- | --- |
| \`SheetStack.Root\` | DOM props and \`asChild\` |
| \`SheetStack.Outlet\` | DOM props, \`asChild\`, \`stackingAnimation\` |
| \`Sheet.Content\` | \`stackingAnimation\` for the sheet surface under later layers |
| \`DepthSheet.Page\` | bounded Depth stacking by default |`,
    ),
  ),

  accessibility: guide(
    "Velvet supplies dialog semantics and interaction infrastructure, but accessible product copy and workflow remain application responsibilities.",
    section(
      "What Velvet handles",
      "- `dialog` or `alertdialog` role.\n- Accessible naming from Sheet.Title and description from Sheet.Description.\n- Modal focus containment and focus restoration.\n- Background inertness and scroll locking for modal sheets.\n- Escape and outside-interaction policy.\n- Frontmost ownership in nested stacks.\n- Reduced-motion settlement.\n- Keyboard-operable Trigger, Close, Step, and Handle controls.",
    ),
    section(
      "What you must provide",
      "- A meaningful title for every surface, visually hidden when necessary.\n- A description when the consequence is not obvious from the title.\n- Visible focus styles in your theme.\n- A reachable close or completion action.\n- Form errors connected to their controls.\n- Alternative text and captions for meaningful media.\n- Correct action labels; avoid unlabeled icon buttons.",
      code("tsx", `<Sheet.Content>
  <VisuallyHidden.Root asChild>
    <Sheet.Title>Command palette</Sheet.Title>
  </VisuallyHidden.Root>
  <Sheet.Description>Search commands and recent pages.</Sheet.Description>
  <AutoFocusTarget asChild>
    <input aria-label="Search commands" />
  </AutoFocusTarget>
  <Sheet.Close aria-label="Close command palette">×</Sheet.Close>
</Sheet.Content>`),
    ),
    section(
      "Nested Root ownership",
      "`Sheet.Title` and `Sheet.Description` register with the nearest `Sheet.Root`. Keep the parent modal's labels outside a nested child Root, then give the child its own labels inside that Root. In development, Velvet warns when a presented View has neither a registered Title nor an explicit accessible label.",
      code("tsx", `<Sheet.Root>
  <Sheet.Title>Component library</Sheet.Title>

  <Sheet.Root>
    <Sheet.Title>Component details</Sheet.Title>
  </Sheet.Root>
</Sheet.Root>`),
    ),
    section(
      "Dialog versus alert dialog",
      "`sheetRole=\"dialog\"` is the ordinary default. Use `alertdialog` only when immediate attention is required and a decision blocks the workflow. Alert dialogs reject swipe dismissal by default; provide explicit actions and do not turn dismissal back on casually.",
    ),
    section(
      "Non-modal sheets",
      "PersistentSheet defaults to `modal={false}` so the page remains operable. Do not add a backdrop that visually implies blocked content unless interactions are actually blocked. Keep the collapsed control in a predictable tab position.",
    ),
    section(
      "Manual test",
      "Open with Enter and Space, tab through every control, reverse with Shift+Tab, operate detents from the keyboard, test Escape policy, close, and confirm focus returns to the trigger. Repeat with a screen reader, 200% zoom, reduced motion, and ten nested layers.",
    ),
  ),

  "composition-api": guide(
    "Compositions are small wrappers around Sheet primitives. They set good interaction defaults, emit stable data hooks, and expose the underlying part props instead of hiding them.",
    section(
      "Shared Content escape hatches",
      compositionContentProps,
      "`on` and `off` describe the composition default, not whether the slot is available. A supported visual slot accepts `true`, `false`/`null`, or your React element.",
    ),
    section(
      "BottomSheet",
      "Parts: Root, Trigger, Content, Close, Step, Title, Description, Handle.",
      "Defaults: bottom placement, automatic scroll handoff, edge-swipe prevention, backdrop, handle, and coordinated scrolling.",
      code("tsx", `import { BottomSheet } from "@velvetui/react/bottom-sheet";
import "@velvetui/react/sheet.css";
import "@velvetui/react/bottom-sheet.css";

<BottomSheet.Root>
  <BottomSheet.Trigger>Open cart</BottomSheet.Trigger>
  <BottomSheet.Content
    viewProps={{ snapPoints: ["42lvh", "82lvh"] }}
    scrollViewProps={{ safeArea: "visual-viewport" }}
  >
    <BottomSheet.Title>Your cart</BottomSheet.Title>
    <Cart />
  </BottomSheet.Content>
</BottomSheet.Root>`),
    ),
    section(
      "PersistentSheet",
      "Parts match BottomSheet. Defaults: `88px` collapsed detent, a full detent bounded at 720px, `dismissible={false}`, `modal={false}`, and no backdrop.",
      "The outer view is click-through while the sheet content remains interactive. Override defaults through `viewProps` only when the new policy is intentional.",
    ),
    section(
      "CardExpansion",
      "Parts: Root, Trigger, Content, Close, Title, Description.",
      "Defaults: center placement, top and bottom dismissal, no swipe overshoot, trigger morph, backdrop, and coordinated scrolling.",
      "`from` accepts `\"trigger\"`, an Element, a ref, or a falsy value. Set `from={false}` to keep modal scale travel without source geometry.",
    ),
    section(
      "Lightbox",
      "Parts: Root, Trigger, Content, Close, Title, Description.",
      "Defaults: full-screen center surface, top and bottom dismissal, no swipe overshoot, black theme backdrop, and scale/fade travel.",
    ),
    section(
      "DepthSheet",
      "Parts: Root, Page, Content, Trigger, Close, Step, Title, Description, Handle.",
      "Root accepts Sheet state props plus `tokens`, `sheetProps`, `id`, className, style, and DOM props. Page accepts `stackingAnimation`. Content exposes the shared escape hatches above.",
      "Nested roots reuse the nearest portal host and stack coordinator. There is no supported-depth limit.",
    ),
    section(
      "Depth tokens",
      `| Token prop | CSS variable | Default |
| --- | --- | --- |
| \`inset\` | \`--velvet-depth-inset\` | safe-area max 24px |
| \`radius\` | \`--velvet-depth-radius\` | 28px |
| \`shift\`, \`shiftLimit\` | shift variables | 14px, 80px |
| \`scaleLoss\`, \`scaleMinimum\` | scale variables | 0.06, 0.76 |
| \`radiusStep\`, \`radiusLimit\` | radius variables | 2px, 42px |
| \`dimming\`, \`brightnessMinimum\` | brightness variables | 0.1, 0.7 |
| color and shadow props | matching variables | composition defaults |`,
    ),
  ),

  "styled-compositions": guide(
    "Start with a composition when its behavior matches the task. Drop to Sheet primitives only when the DOM, placement, tracks, or visual layers need a different contract.",
    section(
      "Decision table",
      `| Need | Use |
| --- | --- |
| Mobile detail, picker, checkout, short task | BottomSheet |
| Tool or media control that must remain present | PersistentSheet |
| Hierarchical full-width navigation with backing-page depth | DepthSheet |
| A normal card that expands into a modal | CardExpansion |
| Immersive photo or media | Lightbox |
| Drawer, top sheet, modal, detached, full-screen, parallax | Sheet primitives |`,
    ),
    section(
      "Compositions stay headless where it matters",
      "Every Content forwards refs and DOM props and supports `asChild`. Supply your own `view`, `backdrop`, `handle`, and `bleedingBackground` elements where that part exists; Velvet composes primitive behavior onto those nodes.",
      "`viewProps`, `portalProps`, and part-specific prop bags reach the underlying primitive. The supplied CSS establishes responsive geometry and safe-area behavior, while color and product layout remain overrideable through variables, classes, or replacement components. See [Bring your own components](/docs/custom-components).",
    ),
    section(
      "Imports",
      code("tsx", `import { BottomSheet } from "@velvetui/react/bottom-sheet";
import { CardExpansion } from "@velvetui/react/card-expansion";
import { DepthSheet } from "@velvetui/react/depth-sheet";
import { Lightbox } from "@velvetui/react/lightbox";
import { PersistentSheet } from "@velvetui/react/persistent-sheet";`),
    ),
  ),

  "scroll-api": guide(
    "Scroll coordinates long content, virtual keyboards, programmatic travel, and the gesture handoff between a nested scroller and its parent sheet.",
    section(
      "Primitive tree",
      code("tsx", `<Scroll.Root componentRef={scrollApi}>
  <Scroll.View
    axis="y"
    safeArea="visual-viewport"
    onScrollProgress={({ progress, distance }) => {}}
  >
    <Scroll.Content><Article /></Scroll.Content>
  </Scroll.View>
</Scroll.Root>`),
      "When Root and View render as separate elements, Root establishes the flex layout and View shrinks to the available height. Give Root a constrained height or place it in a constrained flex region; View then owns the overflow. With `asChild`, the merged View is the scroll container itself.",
    ),
    section(
      "Scroll.Root and imperative API",
      "`componentRef` receives `getProgress`, `getDistance`, `getAvailableDistance`, `scrollTo`, and `scrollBy`.",
      code("tsx", `scrollApi.current?.scrollTo({
  progress: 1,
  animationSettings: "smooth",
});

scrollApi.current?.scrollBy({
  distance: -160,
  animationSettings: { stiffness: 420, damping: 40 },
});`),
    ),
    section(
      "Scroll.View props",
      `| Prop | Type | Default |
| --- | --- | --- |
| \`axis\` | \`x \\| y\` | \`y\` |
| \`safeArea\` | none, layout-viewport, visual-viewport | visual-viewport |
| \`scrollGestureTrap\` | boolean or axis object | false |
| \`scrollGestureOvershoot\` | boolean | true |
| \`onScrollProgress\` | progress callback | — |
| \`onFocusInside\` | policy object or callback | — |
| \`nativeFocusScrollPrevention\` | boolean | true |`,
    ),
    section(
      "Scroll.Trigger",
      code("tsx", `<Scroll.Trigger action={{
  type: "scroll-to",
  progress: 1,
  animationSettings: "snappy",
}}>
  Jump to end
</Scroll.Trigger>`),
      "The action type is `scroll-to` or `scroll-by`. Supply either `distance` in pixels or normalized `progress`.",
    ),
    section(
      "Sheet handoff",
      code("tsx", `<Sheet.View side="bottom" tracks="auto">
  <Sheet.Content asChild>
    <Scroll.Root asChild>
      <Scroll.View><Scroll.Content><Feed /></Scroll.Content></Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>`),
      "With `tracks=\"auto\"`, native boundary chaining chooses the direction without changing sheet geometry while content scrolls. A downward drag dismisses only after the scroller reaches its start; an upward drag can hand off at the end.",
    ),
    section(
      "Swipe-back side sheets",
      code("tsx", `<Sheet.View side="right" nativeEdgeSwipePrevention>
  <Sheet.Content className="Page-content">
    <header><Sheet.Close>Back</Sheet.Close></header>
    <Scroll.Root>
      <Scroll.View>
        <Scroll.Content><Page /></Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>`),
      "Leave `scrollGestureTrap` unset on a scrollable side-sheet page. Its default `false` explicitly applies `overscroll-behavior: auto`, so vertical movement stays with the content while a horizontal drag hands off to the sheet for swipe-back navigation. Setting `scrollGestureTrap` (or overriding the inline style with `contain`) on the page-wide Scroll.View prevents that handoff, so reserve containment for an isolated region that must retain the gesture.",
      "`nativeEdgeSwipePrevention` only resolves the conflict with browser history navigation. It does not disable Velvet's own swipe gesture.",
    ),
    section(
      "Keyboard-safe forms",
      "Use `safeArea=\"visual-viewport\"` and include `interactive-widget=resizes-content` in the viewport meta tag. Keep the focused field and fixed composer inside the same Scroll.View.",
      "Scroll restoration is scoped to text-entry focus that recorded an origin. Blurring a button, link, checkbox, or sheet trigger never resets the View to the top.",
      code("html", `<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
/>`),
    ),
  ),

  scroll: guide(
    "Use Scroll whenever content can move independently of its sheet. The component prevents a drag from scrolling content and dismissing the sheet at the same time.",
    section(
      "The common pattern",
      code("tsx", `<Sheet.View side="bottom" tracks="auto">
  <Sheet.Content asChild>
    <Scroll.Root asChild>
      <Scroll.View className="sheet-scroll">
        <Scroll.Content className="sheet-body">
          <Article />
        </Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>`),
      "The element with `Scroll.View` is the real overflow container. Give it a definite height and `overflow-y: auto` through product or composition CSS.",
    ),
    section(
      "Avoid these handoff bugs",
      "- Do not place another vertical overflow container between View and Content.\n- Do not set `pointer-events: none` on the scroller.\n- Do not force the native sheet runway to show a scrollbar.\n- Do not mirror scrollTop into React state for gesture policy.\n- Do not disable overscroll globally without testing nested sheets.",
    ),
    section(
      "Continue to the full API",
      "The Scroll API guide covers imperative scrolling, progress callbacks, horizontal axes, keyboard safe areas, and focus policy.",
    ),
  ),

  "toast-api": guide(
    "The toast package exposes one imperative dispatcher and one portal renderer. The full contract is typed and works with styled or unstyled surfaces.",
    section(
      "Methods",
      `| Method | Result |
| --- | --- |
| \`toast(message, options)\` | Neutral toast id |
| \`toast.success/error/info/warning/message/loading\` | Typed toast id |
| \`toast.custom(content, options)\` | Custom React content |
| \`toast.update(id, patchOrUpdater)\` | Updates one toast |
| \`toast.dismiss(id?, reason?)\` | Dismisses one or all |
| \`toast.promise(task, phases)\` | Returns the original promise |`,
      code("tsx", `const id = toast.loading("Uploading");

try {
  const file = await upload();
  toast.update(id, {
    type: "success",
    message: "Uploaded",
    description: file.name,
  });
} catch {
  toast.update(id, { type: "error", message: "Upload failed" });
}`),
    ),
    section("ToastOptions", toastOptions),
    section("Toaster props", toasterProps),
    section(
      "Positions and swipe directions",
      "Positions support top/bottom plus left/center/right, and logical `start`/`end` variants. Swipe directions support top, right, bottom, left, start, and end.",
      "When `swipeDirections` is omitted, corner toasts accept left and right while centered toasts accept top and bottom. This keeps the cross axis available for page panning. Pass it to `Toaster` for the global policy or to one toast for a local override; logical directions resolve from `dir`.",
    ),
    section(
      "Controls and custom content",
      "A tap on a button or link activates it normally. Once movement passes the gesture slop, the same pointer stream becomes a toast swipe and its compatibility click is suppressed, so an action cannot fire accidentally after dismissal.",
      "The built-in close button floats outside the content row, so it never consumes action space. Set `closeButtonPosition=\"left\"` or `\"right\"` globally, or in one toast's options. Use `icons.close` to replace the cross; `classNames.closeButton` and `classNames.closeIcon` style the two layers independently.",
      code("tsx", `<Toaster
  closeButtonPosition="left"
  icons={{ close: <CloseIcon /> }}
  classNames={{
    closeButton: "AppToast-close",
    closeIcon: "AppToast-closeIcon",
  }}
/>`),
      code("css", `.AppToast-close {
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
}`),
      code("tsx", `<Toaster
  icons={{ close: <CloseIcon /> }}
  classNames={{
    closeButton:
      "size-5 rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50",
    closeIcon: "size-2.5",
  }}
/>`),
      "Plain CSS, CSS Modules, and Tailwind utilities work directly through the class hooks. The default skin uses low-specificity selectors, so ordinary properties can override it without `!important`. You may also target `[data-slot=\"close-button\"]` and `[data-slot=\"close-icon\"]`; the `--velvet-toast-close-*` variables are optional shorthand.",
      "Inputs, textareas, selects, and editable content do not begin a toast swipe. Put `data-velvet-toast-swipe-ignore` on any additional custom region that must retain pointer ownership.",
      code("tsx", `toast.custom(
  <div className="upload-toast">
    <span>Upload ready</span>
    <div data-velvet-toast-swipe-ignore>
      <InlineEditor />
    </div>
  </div>
);`),
    ),
    section(
      "Promise phases",
      code("tsx", `await toast.promise(() => saveDocument(), {
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
});`),
      "Each phase may be a ReactNode, an object, or a function. The promise returned by `toast.promise` keeps its original value and rejection behavior.",
    ),
    section(
      "Accessibility behavior",
      "Ordinary updates use a polite live region. Errors and `important` updates use an assertive region. Option+T on macOS, or Alt+T elsewhere, focuses the front toast by default; Escape dismisses the focused or front toast.",
      "Actions are real buttons. After keyboard dismissal, focus moves to the next toast or returns to the element focused before the toast stack.",
    ),
    section(
      "Dismiss reasons",
      "`programmatic`, `timeout`, `swipe`, `action`, `cancel`, `close-button`, and `escape` are built in. Custom strings remain accepted for application-level analytics.",
    ),
  ),

  utilities: guide(
    "Utilities solve focus, portal, fixed-layer, responsive, theme-color, and scroll integration problems without adding them to every Sheet or motion import.",
    section(
      "Focused import",
      code("tsx", `import {
  AutoFocusTarget,
  ExternalOverlay,
  Fixed,
  Island,
  Scroll,
  VisuallyHidden,
} from "@velvetui/react/utilities";
import "@velvetui/react/sheet.css";`),
      "The utilities entry does not pull Toast or any styled composition. Import motion from `@velvetui/react/motion` and SheetStack from `@velvetui/react/sheet`; those capabilities have separate bundle ownership.",
    ),
    section(
      "Utility components",
      `| Export | Use |
| --- | --- |
| \`VisuallyHidden.Root\` | Accessible text without visual layout |
| \`AutoFocusTarget\` | Explicit initial focus destination |
| \`Fixed\` | Viewport-fixed content that ignores sheet travel |
| \`Island\` | Interactive region belonging to the frontmost sheet |
| \`ExternalOverlay.Root\` | Third-party portal joined to sheet modality |
| \`ThemeBackdrop\` | Backdrop plus browser theme-color dimming |
| \`SheetMorph.Content\` | Shared-origin geometry |
| \`SheetStack.Root/Outlet\` | Nested layer coordination |`,
      code("tsx", `<Sheet.Content>
  <VisuallyHidden.Root asChild>
    <Sheet.Title>Command palette</Sheet.Title>
  </VisuallyHidden.Root>
  <AutoFocusTarget asChild><input aria-label="Search" /></AutoFocusTarget>
</Sheet.Content>`),
    ),
    section(
      "Portalled third-party UI",
      code("tsx", `<ExternalOverlay.Root asChild>
  <ThirdPartyDatePickerPortal />
</ExternalOverlay.Root>`),
      "Without this wrapper, a modal sheet can treat the third-party portal as outside content and make it inert.",
    ),
    section(
      "Hooks and helpers",
      `| Export | Contract |
| --- | --- |
| \`useClientMediaQuery(query)\` | Client-safe boolean media match |
| \`updateThemeColor(color)\` | Updates the active theme-color meta value |
| \`useThemeColorDimmingOverlay(options)\` | Sets or animates theme dimming opacity |
| \`SPRING_PRESETS\` from \`motion\` | gentle, smooth, snappy, brisk, bouncy, elastic |
| \`depthSheetVariables\` from \`depth-sheet\` | token keys mapped to CSS variable names |
| \`depthSheetDefaultTokens\` from \`depth-sheet\` | values supplied by the composition CSS |
| \`depthSheetStackingAnimation\` from \`depth-sheet\` | bounded public Depth travel animation |`,
    ),
  ),

  "gallery-recipes": guide(
    "Every homepage card is built from the public package. The concise recipes explain the reusable structure; the source links below are generated from the exact live JSX and CSS, so the documentation cannot silently drift away from the gallery.",
    section(
      "Exact live source",
      demoSourceLinks,
      "The raw files include playground icons, image helpers, and local import paths because they are the real implementation. Replace those helpers with product assets and use the package imports from the concise recipe.",
    ),
    section(
      "1. Bottom Sheet",
      code("tsx", `<BottomSheet.Root>
  <BottomSheet.Trigger>View stay</BottomSheet.Trigger>
  <BottomSheet.Content>
    <BottomSheet.Title>Five nights in Tulum</BottomSheet.Title>
    <StayDetails />
    <BottomSheet.Close>Done</BottomSheet.Close>
  </BottomSheet.Content>
</BottomSheet.Root>`),
    ),
    section(
      "2. Modal Dialog",
      code("tsx", `<Sheet.Root>
  <Sheet.Trigger>Invite people</Sheet.Trigger>
  <Sheet.Panel
    side="center"
    viewProps={{ tracks: ["top", "bottom"], swipeOvershoot: false }}
  >
    <Sheet.Title>Join Atlas Redesign?</Sheet.Title>
    <InviteForm />
  </Sheet.Panel>
</Sheet.Root>`),
    ),
    section(
      "3. Navigation Drawer",
      code("tsx", `<Sheet.Root>
  <Sheet.Trigger>Menu</Sheet.Trigger>
  <Sheet.Panel side="left" className="navigation-drawer">
    <Sheet.Title>Workspace navigation</Sheet.Title>
    <Navigation />
  </Sheet.Panel>
</Sheet.Root>`),
    ),
    section(
      "4. Detent Sheet",
      code("tsx", `<Sheet.Root defaultSnap={1}>
  <Sheet.Trigger>Open queue</Sheet.Trigger>
  <Sheet.Panel side="bottom" snapPoints={["92px", "72lvh"]}>
    <Sheet.Step direction="up">Expand</Sheet.Step>
    <Queue />
  </Sheet.Panel>
</Sheet.Root>`),
    ),
    section(
      "5. Top Sheet",
      code("tsx", `<Sheet.Root>
  <Sheet.Trigger>Notifications</Sheet.Trigger>
  <Sheet.Panel side="top">
    <Sheet.Title>Team inbox</Sheet.Title>
    <Notifications />
  </Sheet.Panel>
</Sheet.Root>`),
    ),
    section(
      "6. Scrollable Sheet",
      code("tsx", `<Sheet.Root>
  <Sheet.Trigger>Open recipe</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.View side="bottom" tracks="auto">
      <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.4] }} />
      <Sheet.Content asChild>
        <Scroll.Root asChild>
          <Scroll.View><Scroll.Content><Recipe /></Scroll.Content></Scroll.View>
        </Scroll.Root>
      </Sheet.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet.Root>`),
    ),
    section(
      "7. Stacked Sheets",
      code("tsx", `<SheetStack.Root>
  <Sheet.Root>
    <Sheet.Trigger>Product</Sheet.Trigger>
    <Sheet.Panel side="bottom">
      <Product />
      <Sheet.Root>
        <Sheet.Trigger>Select size</Sheet.Trigger>
        <Sheet.Panel side="bottom"><SizePicker /></Sheet.Panel>
      </Sheet.Root>
    </Sheet.Panel>
  </Sheet.Root>
</SheetStack.Root>`),
      "Repeat the nested Root pattern for any number of layers. The frontmost modal owns Escape, focus, and outside interaction.",
    ),
    section(
      "8. Detached Sheet",
      code("tsx", `<Sheet.Panel
  side="center"
  className="detached-sheet"
  viewProps={{ tracks: ["top", "bottom"] }}
>
  <WatchDetails />
</Sheet.Panel>`),
      code("css", `.detached-sheet {
  width: min(92vw, 38rem);
  max-height: calc(100dvh - 32px);
  border-radius: 28px;
}`),
    ),
    section(
      "9. Full-Screen Sheet",
      code("tsx", `<Sheet.Panel side="bottom" className="full-screen-sheet">
  <Sheet.Title>New note</Sheet.Title>
  <Editor />
</Sheet.Panel>`),
      code("css", `.full-screen-sheet {
  width: 100%;
  height: var(--velvet-100lvh);
  max-height: none;
}`),
    ),
    section(
      "10. Depth Sheet",
      code("tsx", `<DepthSheet.Root>
  <DepthSheet.Page asChild>
    <main>
      <Home />
      <DepthSheet.Trigger>Open profile</DepthSheet.Trigger>
    </main>
  </DepthSheet.Page>
  <DepthSheet.Content>
    <DepthSheet.Title>Mara Vale</DepthSheet.Title>
    <Profile />
  </DepthSheet.Content>
</DepthSheet.Root>`),
    ),
    section(
      "11. Lightbox",
      code("tsx", `<Lightbox.Root>
  <Lightbox.Trigger asChild><button><Thumbnail /></button></Lightbox.Trigger>
  <Lightbox.Content>
    <Lightbox.Title>Golden hour</Lightbox.Title>
    <Gallery />
    <Lightbox.Close aria-label="Close">×</Lightbox.Close>
  </Lightbox.Content>
</Lightbox.Root>`),
    ),
    section(
      "12. Parallax Sheet",
      code("tsx", `<Sheet.View side="bottom" tracks="auto">
  <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.3] }} />
  <Sheet.Outlet travelAnimation={{
    transform: ({ tween }) => "translateY(" + tween(0, -48) + "px)",
  }}>
    <Cover />
  </Sheet.Outlet>
  <Sheet.Content><Article /></Sheet.Content>
</Sheet.View>`),
    ),
    section(
      "13. Side Sheet",
      code("tsx", `<Sheet.Root>
  <Sheet.Trigger>Account</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.View side="right" nativeEdgeSwipePrevention>
      <Sheet.Backdrop />
      <Sheet.Content className="Page-content">
        <header>
          <Sheet.Close>Back</Sheet.Close>
          <Sheet.Title>Account settings</Sheet.Title>
        </header>
        <Scroll.Root>
          <Scroll.View>
            <Scroll.Content><Settings /></Scroll.Content>
          </Scroll.View>
        </Scroll.Root>
      </Sheet.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet.Root>`),
      "The scrollable body leaves `scrollGestureTrap` at its default `false`, so a horizontal drag anywhere on the page can dismiss the right-side sheet as back navigation.",
    ),
    section(
      "14. Keyboard-Aware Sheet",
      code("tsx", `<Sheet.View side="bottom" tracks="auto">
  <Sheet.Content asChild>
    <Scroll.Root asChild>
      <Scroll.View safeArea="visual-viewport">
        <Scroll.Content><Conversation /><Composer /></Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>`),
    ),
    section(
      "15. Card Expansion",
      code("tsx", `<CardExpansion.Root>
  <CardExpansion.Trigger asChild><article><StoryCard /></article></CardExpansion.Trigger>
  <CardExpansion.Content>
    <CardExpansion.Title>Designing motion that feels real</CardExpansion.Title>
    <Story />
    <CardExpansion.Close>Done</CardExpansion.Close>
  </CardExpansion.Content>
</CardExpansion.Root>`),
    ),
    section(
      "16. Persistent Sheet",
      code("tsx", `<PersistentSheet.Root defaultOpen defaultSnap={1}>
  <PersistentSheet.Content>
    <PersistentSheet.Title>Midnight Drive</PersistentSheet.Title>
    <MiniPlayer />
    <PersistentSheet.Step direction="up">Open queue</PersistentSheet.Step>
  </PersistentSheet.Content>
</PersistentSheet.Root>`),
    ),
    section(
      "Required imports",
      code("tsx", `import { Sheet, SheetStack, Scroll } from "@velvetui/react";
import { BottomSheet } from "@velvetui/react/bottom-sheet";
import { CardExpansion } from "@velvetui/react/card-expansion";
import { DepthSheet } from "@velvetui/react/depth-sheet";
import { Lightbox } from "@velvetui/react/lightbox";
import { PersistentSheet } from "@velvetui/react/persistent-sheet";`),
    ),
  ),

  "production-checklist": guide(
    "Run this checklist before shipping a sheet family. It catches the failures that unit snapshots miss: ownership, scroll handoff, mobile viewport changes, focus, stacking, and visual end states.",
    section(
      "State and actions",
      "- Test controlled and uncontrolled open state.\n- If `snap` is controlled, update it from `onSnapChange`.\n- Confirm actions are enabled on the first paint; do not wait for animation state to make the trigger usable.\n- Verify rapid open-close-open does not leave stale inertness or a backdrop.\n- Verify programmatic close and gesture close produce the same final state.",
    ),
    section(
      "Gestures and scroll",
      "- Slow drag, fast flick, cancelled drag, and direction reversal.\n- Start the dismissing swipe directly over text, cards, links, inputs, and blank space.\n- Scroll content to the middle: the sheet must not steal the gesture.\n- Scroll to the dismissal boundary: the next outward drag must transfer naturally.\n- Test mouse wheel, trackpad rubber-band, touch, keyboard paging, and scrollbar dragging.\n- Confirm the native runway never becomes the visible product scrollbar.",
    ),
    section(
      "Mobile viewport and keyboard",
      "- Small phone in portrait and landscape.\n- Browser chrome expanded and collapsed.\n- Bottom safe area and Android navigation area.\n- Focus the first, middle, and last input.\n- Composer and primary action remain visible above the keyboard.\n- Rotate or resize with the keyboard open.\n- Close the keyboard without closing the sheet, then dismiss the sheet.",
    ),
    section(
      "Accessibility",
      "- Unique title and optional useful description for every Root.\n- Inspect nested dialogs: parent and child must each reference their own title.\n- Enter, Space, Escape, Tab, Shift+Tab, arrow and detent controls.\n- Focus enters the front sheet and returns to the correct trigger.\n- Background is inert only for modal sheets.\n- Alert dialogs cannot disappear through an accidental swipe.\n- Reduced motion settles immediately without missing content.",
    ),
    section(
      "Stacks and portals",
      "- Open at least three ordinary sheets and ten Depth Sheets.\n- Only the front layer reacts to Escape and outside interaction.\n- Every underlying layer stays visually bounded.\n- A custom Portal container stays clipped to its intended host at desktop and mobile sizes.\n- Third-party menus, date pickers, and tooltips remain interactive through ExternalOverlay.\n- Closing several layers restores focus in reverse order without jumping to the page or changing its scroll position.",
    ),
    section(
      "Performance",
      "- Inspect the production bundle and import focused subpaths.\n- Keep continuous travel work outside React state.\n- Avoid simultaneous CSS and Velvet animation of the same transform.\n- Check for layout reads in application callbacks.\n- Confirm composition CSS is loaded once and in stable order.",
    ),
  ),

  troubleshooting: guide(
    "Most failures come from missing structural CSS, swallowed refs, unclear state ownership, or the wrong overflow element. Check these before tuning springs.",
    section(
      "The trigger renders but nothing opens",
      "Confirm `sheet.css`, `base.css`, or `styles.css` is loaded. Verify the trigger is inside the same Root. If using `asChild`, confirm the child forwards its ref and click props.",
    ),
    section(
      "The sheet looks unstyled",
      "The headless package intentionally supplies mechanics only. Import the matching composition CSS, use `styles.css`, or author a product class on Content or Panel.",
    ),
    section(
      "Each toast appears twice",
      "Mount exactly one `Toaster` per document. Every Toaster subscribes to the same global toast store, so two renderers intentionally produce two visual copies. Velvet logs a direct warning when it detects this setup.",
    ),
    section(
      "The controlled sheet snaps back",
      "When `open` or `snap` is controlled, update it from `onOpenChange` or `onSnapChange`. Passing a fixed value while ignoring the callback rejects every gesture request.",
    ),
    section(
      "Scroll and swipe fight each other",
      "Use one real overflow container through Scroll.View and set `tracks=\"auto\"` on the Sheet.View. Remove intermediate vertical scrollers.",
    ),
    section(
      "Swipe works beside the content but not over it",
      "Leave `scrollGestureTrap` at its default `false` when a right or left sheet contains a vertical scroller. If vertical chaining must stop, use `scrollGestureTrap={{ y: true }}`; never use `true`, which traps both axes. Remove application CSS such as `overscroll-behavior: contain`, then test the swipe by starting directly over a paragraph or card.",
    ),
    section(
      "The nested sheet has no scrollbar",
      "Give the modal body and nested View a bounded height, then use exactly one `Scroll.Root → Scroll.View → Scroll.Content` chain. Every flex ancestor above Scroll.View needs `min-height: 0`; Scroll.View is the element that receives `overflow-y: auto` and scrollbar styling.",
    ),
    section(
      "Clicking Back or Close jumps the page",
      "Use a real `<button type=\"button\">`. An anchor with `href=\"#\"` navigates to the document top, and a button without an explicit type submits its nearest form. Do not repair either behavior with preventDefault; give the control the correct semantics.",
    ),
    section(
      "The child dialog has the parent's title",
      "Titles register with the nearest Root. Render the parent Title and Description before the child `Sheet.Root`, then render a separate Title and Description inside the child Root.",
    ),
    section(
      "The nested sheet escapes the parent modal",
      "Create a clipped, positioned portal host inside the modal and pass its ref directly: `<Sheet.Portal container={nestedHostRef}>`. Position the nested View absolutely so it resolves against that host instead of the viewport.",
    ),
    section(
      "A bottom action is hidden on mobile",
      "Use `--velvet-100lvh`, safe-area padding, and Scroll.View with `safeArea=\"visual-viewport\"`. Avoid fixed pixel heights derived from `window.innerHeight`.",
    ),
    section(
      "The keyboard causes jumps",
      "Add `interactive-widget=resizes-content`, keep the composer in the coordinated Scroll.View, and avoid translating the sheet in a separate focus handler.",
    ),
    section(
      "A third-party popup cannot be clicked",
      "Wrap its portal root with ExternalOverlay.Root so the modal manager treats it as part of the active sheet instead of inert background content.",
    ),
    section(
      "Nested sheets dim or shrink too much",
      "Use SheetStack or DepthSheet nesting and bound custom stacking functions by depth. Do not add another app-wide backdrop for each nested layer.",
    ),
    section(
      "Hydration differs",
      "Keep portal-only reads out of render. Prefer CSS media queries; use `useClientMediaQuery` only when behavior, not appearance, must branch after hydration.",
    ),
  ),
};
