import { GUIDE_CONTENT, createFallbackGuide } from "./guides.js";

const sheetQuickStart = `import { Sheet } from "@velvetui/react";
import "@velvetui/react/styles.css";

export function SettingsSheet() {
  return (
    <Sheet>
      <Sheet.Trigger>Open settings</Sheet.Trigger>
      <Sheet.Panel side="bottom">
        <Sheet.Title>Settings</Sheet.Title>
        <Sheet.Description>Change your preferences.</Sheet.Description>
        <Sheet.Close>Done</Sheet.Close>
      </Sheet.Panel>
    </Sheet>
  );
}`;

const docs = [
  ["overview", "Getting started", "Overview", "Velvet UI is a headless React sheet and toast toolkit built around composable primitives, resilient gestures, and WAAPI-driven motion.", "Start with the gallery to see the supplied compositions, then use the primitive API when the interaction needs to match your product exactly.", sheetQuickStart],
  ["installation", "Getting started", "Installation", "Install Velvet UI, then add the base stylesheet once at your application boundary.", "The package exports small entry points, so import the primitive or composition you use instead of a single all-in-one runtime.", `npm install @velvetui/react\n# or pnpm add @velvetui/react\n# or yarn add @velvetui/react`],
  ["package-exports", "Getting started", "Package exports", "Choose focused JavaScript and CSS entry points for smaller bundles, predictable style order, and server-rendered React applications.", "Framework-free motion, React hooks, Sheet, utilities, Toast, and every styled composition have explicit tree-shakable boundaries.", `import { Sheet } from "@velvetui/react/sheet";\nimport { animate } from "@velvetui/react/motion";\nimport "@velvetui/react/sheet.css";`],
  ["server-rendering", "Getting started", "Server rendering", "Keep routes server rendered while placing the smallest possible client boundary around interactive sheets, portals, and toast calls.", "Covers Next.js App Router, TanStack Start, Vite SSR, hydration, CSS placement, and deterministic initial state.", `import "@velvetui/react/base.css";\n\nexport function Route() {\n  return <InteractiveSheet />;\n}`],
  ["styling", "Getting started", "Styling", "Velvet exposes semantic classes and CSS custom properties so the component can inherit your design system without a styling runtime.", "Start from the shipped CSS, override tokens at a parent scope, and reserve class overrides for structural changes.", `import "@velvetui/react/styles.css";\n\n:root {\n  --velvet-surface: #fff;\n  --velvet-radius: 28px;\n  --velvet-backdrop: rgba(2, 6, 23, .42);\n}`],
  ["css-reference", "Getting started", "CSS reference", "Use the stable CSS entries, variables, and semantic data hooks without depending on internal wrapper order.", "The reference covers the core sheet skin and every supplied composition token.", `import "@velvetui/react/base.css";`],
  ["sheet-quick-start", "Sheet primitives", "Sheet quick start", "A Sheet groups a trigger, portal, motion surface, accessible title, description, and close action under one controlled or uncontrolled state.", "Use Sheet.Panel for the standard composition; move to Sheet.View and Sheet.Content when you need a fully custom tree.", sheetQuickStart],
  ["anatomy", "Sheet primitives", "Anatomy", "The primitive tree separates state, trigger, portal, view, backdrop, content, and accessible labels.", "This separation keeps visuals replaceable while preserving the same interaction and accessibility behaviour.", `<Sheet.Root>\n  <Sheet.Trigger>Open</Sheet.Trigger>\n  <Sheet.Portal>\n    <Sheet.View side="bottom">\n      <Sheet.Backdrop />\n      <Sheet.Content>\n        <Sheet.Title>Title</Sheet.Title>\n        <Sheet.Close>Close</Sheet.Close>\n      </Sheet.Content>\n    </Sheet.View>\n  </Sheet.Portal>\n</Sheet.Root>`],
  ["gallery-recipes", "Sheet primitives", "Gallery recipes", "The gallery demonstrates production-shaped layouts such as bottom sheets, drawers, modals, detents, lightboxes, and persistent surfaces.", "Treat them as composition references: copy the layout and swap in your own content, not the demo-specific visuals.", `import { BottomSheet } from "@velvetui/react/bottom-sheet";\nimport "@velvetui/react/bottom-sheet.css";`],
  ["open-state", "Sheet primitives", "Open state", "Sheets support uncontrolled defaults and controlled state for coordination with your router, form flow, or application state.", "Use controlled state when another part of the interface needs to decide when the surface opens or closes.", `const [open, setOpen] = useState(false);\n\n<Sheet open={open} onOpenChange={setOpen}>\n  <Sheet.Trigger>Open</Sheet.Trigger>\n  <Sheet.Panel side="bottom" />\n</Sheet>`],
  ["placement", "Sheet primitives", "Placement", "The panel side determines both the origin and the dismiss direction: bottom, top, left, right, or center.", "Center is the right base for modal and media surfaces; edge placements retain directional gesture semantics.", `<Sheet.Panel side="bottom" />\n<Sheet.Panel side="top" />\n<Sheet.Panel side="left" />\n<Sheet.Panel side="right" />\n<Sheet.Panel side="center" />`],
  ["detents", "Sheet primitives", "Detents", "Snap points create intermediate resting positions without a separate gesture implementation.", "Use viewport-relative lengths for responsive stops and Sheet.Step for intent-revealing controls.", `<Sheet defaultSnap={1}>\n  <Sheet.Panel snapPoints={["40lvh", "80lvh"]}>\n    <Sheet.Step direction="up">Expand</Sheet.Step>\n    <Sheet.Step direction="down">Collapse</Sheet.Step>\n  </Sheet.Panel>\n</Sheet>`],
  ["dismissal", "Sheet primitives", "Dismissal", "Dismissal is configurable per view: gestures, outside press, and Escape can each be allowed, prevented, or decided at runtime.", "Alert dialogs default to safer behaviour; persistent sheets can collapse rather than dismiss.", `<Sheet.View\n  dismissible\n  onClickOutside={{ dismiss: false }}\n  onEscapeKeyDown={({ changeDefault }) => {\n    if (hasUnsavedChanges) changeDefault({ dismiss: false });\n  }}\n/>`],
  ["travel-animation", "Motion", "Travel animation", "Travel animation maps a shared open progress value onto any visual property, keeping panel, backdrop, and surrounding UI synchronized.", "It is useful when the motion needs to express the product rather than a generic modal transition.", `<Sheet.Backdrop travelAnimation={{ opacity: [0, .42] }} />\n<Sheet.Content travelAnimation={{\n  transform: ({ tween }) => \`translateY(\${tween(24, 0)}px)\`,\n  opacity: ({ progress }) => Math.min(progress * 2, 1),\n}} />`],
  ["shared-origin-motion", "Motion", "Shared-origin motion", "SheetMorph starts content at the trigger or a supplied element’s measured geometry, then settles it into its authored layout.", "Import morph support only where the experience benefits from it, keeping ordinary sheets lean.", `import { Sheet } from "@velvetui/react/sheet";\nimport { SheetMorph } from "@velvetui/react/sheet-morph";\n\n<Sheet.Root>\n  <Sheet.Trigger className="story-card">Read</Sheet.Trigger>\n  <SheetMorph.Content from="trigger">…</SheetMorph.Content>\n</Sheet.Root>`],
  ["springs", "Motion", "Springs", "Presets make interaction tuning consistent across a product while retaining an escape hatch for custom physical values.", "Use named presets from the framework-free motion entry; define stiffness, damping, and mass only for an intentional exception.", `import { springEasing } from "@velvetui/react/motion";\n\nconst timing = springEasing("snappy");`],
  ["motion-api", "Motion", "Motion API", "Use Velvet's interruptible springs, WAAPI orchestration, travel interpolation, reduced-motion handling, and React lifecycle hooks anywhere.", "The framework-free entry stays independent from Sheet; React hooks are isolated under motion/react.", `import { animate } from "@velvetui/react/motion";\n\nanimate(node, { opacity: [0, 1] }, {\n  id: "enter",\n  preset: "smooth",\n});`],
  ["triggers", "Sheet primitives", "Triggers and actions", "Trigger, Close, and Step communicate intent directly and can render through your own button using asChild.", "They preserve keyboard and event behaviour while allowing your design system controls to remain the actual interactive element.", `<Sheet.Trigger asChild>\n  <Button>Open</Button>\n</Sheet.Trigger>\n<Sheet.Step direction="up">Expand</Sheet.Step>\n<Sheet.Close>Close</Sheet.Close>`],
  ["accessibility", "Foundations", "Accessibility", "Modal sheets apply dialog semantics, focus management, Escape handling, inert background treatment, and focus restoration.", "Always provide a title. Add a description when it gives users context beyond the title, and test your own interactive content with a keyboard.", `<Sheet.Content>\n  <Sheet.Title>Delete project</Sheet.Title>\n  <Sheet.Description>This cannot be undone.</Sheet.Description>\n  <Sheet.Close>Cancel</Sheet.Close>\n</Sheet.Content>`],
  ["sheet-api", "Reference", "Sheet API", "The sheet API is assembled from state, view, content, and action primitives so consumers can adopt only the layers they need.", "Use the component reference as the contract; presentation belongs in CSS classes and variables rather than undocumented DOM assumptions.", `import { Sheet, SheetStack } from "@velvetui/react/sheet";\n\nexport { Sheet, SheetStack };`],
  ["depth-sheet", "Compositions", "Depth Sheet", "DepthSheet gives a full-width surface the visual hierarchy of iOS stacked sheets by scaling and rounding the page behind it.", "Nest depth sheets freely: each level receives a bounded depth transform so long stacks remain legible instead of collapsing into a flat pile.", `import { DepthSheet } from "@velvetui/react/depth-sheet";\nimport "@velvetui/react/sheet.css";\nimport "@velvetui/react/depth-sheet.css";\n\n<DepthSheet.Root>\n  <DepthSheet.Page><App /></DepthSheet.Page>\n  <DepthSheet.Trigger>Open profile</DepthSheet.Trigger>\n  <DepthSheet.Content>…</DepthSheet.Content>\n</DepthSheet.Root>`],
  ["card-expansion", "Compositions", "Card Expansion", "CardExpansion opens a card into a focused modal surface while retaining the scale and edge response expected from a lightbox.", "The source card remains a normal card at rest; the expanded state is a modal with the same focus, inertness, and dismissal guarantees as Sheet.", `import { CardExpansion } from "@velvetui/react/card-expansion";\nimport "@velvetui/react/card-expansion.css";\n\n<CardExpansion>\n  <CardExpansion.Trigger>Read story</CardExpansion.Trigger>\n  <CardExpansion.Content>…</CardExpansion.Content>\n</CardExpansion>`],
  ["styled-compositions", "Compositions", "Styled compositions", "Styled compositions package the visual grammar for common interactions while preserving the underlying primitive API.", "Import the matching JavaScript and CSS entry point together. Composition-specific CSS is not pulled into the primitive package.", `import { BottomSheet } from "@velvetui/react/bottom-sheet";\nimport "@velvetui/react/bottom-sheet.css";`],
  ["composition-api", "Reference", "Composition API", "Compare every supplied composition, its parts, defaults, escape hatches, and CSS contract.", "Bottom Sheet, Persistent Sheet, Depth Sheet, Card Expansion, and Lightbox remain composable wrappers over Sheet.", `import { BottomSheet } from "@velvetui/react/bottom-sheet";`],
  ["toast-quick-start", "Toasts", "Toast quick start", "Render one Toaster near the application root and call toast from any client interaction.", "Mount one Toaster for the current browser context, then dispatch feedback from client events without prop drilling.", `import { Toaster, toast } from "@velvetui/react/toast";\n\n<Toaster position="bottom-right" />\ntoast.success("Saved");`],
  ["toast-variants", "Toasts", "Toast variants", "Toast variants cover neutral, success, error, warning, info, loading, action, promise, and custom JSX states.", "Loading toasts can be updated in place by reusing their id, avoiding duplicate feedback for one operation.", `const id = toast.loading("Uploading…");\ntoast.success("Uploaded", { id });`],
  ["toast-positioning", "Toasts", "Toast positioning", "The Toaster supports the six viewport corners and centers with a fixed viewport layer that does not inherit local layout offsets.", "Set placement once on the root Toaster and keep per-toast content independent of position.", `<Toaster position="bottom-right" />\n<Toaster position="top-center" />`],
  ["toast-options", "Toasts", "Toast options", "Toast options control duration, description, action, close affordance, visual treatment, and stacked expansion.", "Prefer concise titles; use descriptions for the recovery path rather than repeating the title.", `toast("Update available", {\n  description: "Version 0.2 is ready.",\n  duration: 8000,\n  action: { label: "Reload" },\n});`],
  ["toast-promise", "Toasts", "Toast promise", "toast.promise binds an async result to one continuous feedback item with loading, success, and error states.", "Pass a promise or a factory and keep the result messages action-oriented.", `toast.promise(uploadPhoto(), {\n  loading: "Uploading photo…",\n  success: "Photo uploaded",\n  error: "Upload failed",\n});`],
  ["toast-api", "Reference", "Toast API", "The toast API is a small imperative dispatcher with a single declarative renderer, Toaster.", "This split lets any client event report status without threading callbacks through the component tree.", `toast(message, options);\ntoast.success(message, options);\ntoast.error(message, options);\ntoast.dismiss(id);`],
  ["scroll", "Foundations", "Scroll coordination", "A scrollable sheet hands a downward drag to the sheet only when its internal scroll container has reached the top.", "Mark the actual scroll surface so nested content keeps native scrolling without fighting dismissal gestures.", `<Sheet.Content data-velvet-scroll="view">\n  <article>Long content…</article>\n</Sheet.Content>`],
  ["scroll-api", "Reference", "Scroll API", "Coordinate nested scrolling, virtual keyboards, focus, progress, and imperative spring scrolling.", "Scroll exposes a compound component and a small imperative ref API.", `import { Scroll } from "@velvetui/react";`],
  ["sheet-stack", "Foundations", "Sheet stacks", "SheetStack coordinates layering, backdrop ownership, focus restoration, and depth transforms for any number of nested sheets.", "Use one root around an application region. Nested triggers can then present new sheets without bespoke z-index management.", `<SheetStack.Root>\n  <App />\n</SheetStack.Root>`],
  ["utilities", "Reference", "Utilities", "Utilities cover scroll coordination, visually hidden labels, autofocus targets, fixed surfaces, islands, and external overlays.", "The focused utilities entry avoids Sheet, Toast, motion hooks, and styled compositions.", `import { VisuallyHidden, AutoFocusTarget } from "@velvetui/react/utilities";`],
  ["troubleshooting", "Resources", "Troubleshooting", "Diagnose missing styles, swallowed refs, controlled-state loops, gesture handoff, mobile keyboards, nested sheets, and third-party portals.", "Start with ownership, refs, overflow, and CSS before changing motion values.", `import "@velvetui/react/base.css";`],
  ["production-checklist", "Resources", "Production checklist", "A manual release checklist for state, gestures, scroll, mobile keyboards, accessibility, arbitrary-depth stacks, portals, and bundle cost.", "Use it before shipping because screenshots and unit tests do not exercise native momentum or focus restoration.", `// Test slow drags, fast flicks, keyboard focus,\n// mobile viewports, and ten nested layers.`],
  ["changelog", "Resources", "Changelog", "Release notes for changes that affect installation, APIs, styling, behavior, performance, or upgrades.", "Follow meaningful product changes without reading a raw commit log.", `npm install @velvetui/react@latest`],
];

export const DOCS = docs.map(([slug, group, title, description, body, code]) => ({
  slug,
  group,
  title,
  description,
  body,
  code,
  guide: GUIDE_CONTENT[slug] || createFallbackGuide({ body, code }),
}));

export const DOC_BY_SLUG = Object.fromEntries(DOCS.map((doc) => [doc.slug, doc]));

export const DOC_GROUPS = Object.entries(
  DOCS.reduce((groups, doc) => {
    (groups[doc.group] ||= []).push(doc);
    return groups;
  }, {}),
);

export const SITE_ORIGIN = "https://velvetui.co";

export const getDocPath = (slug) =>
  slug === "overview" ? "/docs" : `/docs/${slug}`;

export const docToMarkdown = (doc) => `# ${doc.title}

> ${doc.description}

Web: ${SITE_ORIGIN}${getDocPath(doc.slug)}

${doc.guide}
`;
