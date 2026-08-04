import { API_GUIDES } from "./api-guides.js";

const code = (language, source) => `\`\`\`${language}\n${source.trim()}\n\`\`\``;
const section = (title, ...content) => [`## ${title}`, ...content].join("\n\n");
const guide = (...content) => content.filter(Boolean).join("\n\n");

const install = `npm install @velvetui/react
# pnpm add @velvetui/react
# yarn add @velvetui/react
# bun add @velvetui/react`;

const rootSetup = `import "@velvetui/react/styles.css";
import { Toaster } from "@velvetui/react/toast";

export function App() {
  return (
    <>
      <YourApp />
      <Toaster position="bottom-right" />
    </>
  );
}`;

const basicSheet = `import { Sheet } from "@velvetui/react/sheet";
import "@velvetui/react/sheet.css";

export function SettingsSheet() {
  return (
    <Sheet.Root>
      <Sheet.Trigger className="button">Open settings</Sheet.Trigger>
      <Sheet.Panel side="bottom" className="settings-sheet">
        <Sheet.Title>Settings</Sheet.Title>
        <Sheet.Description>Choose how the workspace behaves.</Sheet.Description>
        <SettingsForm />
        <Sheet.Close className="button">Done</Sheet.Close>
      </Sheet.Panel>
    </Sheet.Root>
  );
}`;

const nestedModalNavigation = `import { useRef, useState } from "react";
import { Sheet } from "@velvetui/react/sheet";
import { Scroll } from "@velvetui/react/utilities";
import "@velvetui/react/sheet.css";

export function StudioLibrary() {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const nestedHostRef = useRef(null);

  const closeAll = () => {
    setArticleOpen(false);
    setLibraryOpen(false);
  };

  return (
    <Sheet.Root open={libraryOpen} onOpenChange={setLibraryOpen}>
      <Sheet.Trigger type="button">Open library</Sheet.Trigger>

      <Sheet.Portal>
        <Sheet.View
          side="center"
          tracks="auto"
          swipeOvershoot={false}
          onClickOutside={{ dismiss: false }}
        >
          <Sheet.Backdrop />
          <Sheet.Content className="library-modal">
            {/* Parent labels must stay outside the nested Root. */}
            <header className="library-header">
              <div>
                <Sheet.Title>Studio library</Sheet.Title>
                <Sheet.Description>Notes from the studio.</Sheet.Description>
              </div>
              <Sheet.Close type="button" aria-label="Close library">×</Sheet.Close>
            </header>

            <Sheet.Root open={articleOpen} onOpenChange={setArticleOpen}>
              <Scroll.Root className="library-scroll-root">
                <Scroll.View className="library-scroll-view">
                  <Scroll.Content>
                    <button type="button" onClick={() => setArticleOpen(true)}>
                      Read launch notes
                    </button>
                  </Scroll.Content>
                </Scroll.View>
              </Scroll.Root>

              <div ref={nestedHostRef} className="nested-portal-host" />

              <Sheet.Portal container={nestedHostRef}>
                <Sheet.View
                  className="nested-detail-view"
                  side="right"
                  nativeEdgeSwipePrevention
                  swipeOvershoot={false}
                  onClickOutside={{ dismiss: false }}
                >
                  <Sheet.Backdrop />
                  <Sheet.Content className="nested-detail-panel">
                    <header className="detail-header">
                      <Sheet.Close type="button" aria-label="Back to library">←</Sheet.Close>
                      <Sheet.Title>Launch notes</Sheet.Title>
                      <button type="button" aria-label="Close library" onClick={closeAll}>×</button>
                    </header>

                    <Scroll.Root className="detail-scroll-root">
                      <Scroll.View
                        className="detail-scroll-view"
                        scrollGestureTrap={{ y: true }}
                      >
                        <Scroll.Content><Article /></Scroll.Content>
                      </Scroll.View>
                    </Scroll.Root>
                  </Sheet.Content>
                </Sheet.View>
              </Sheet.Portal>
            </Sheet.Root>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}`;

const nestedModalCss = `.library-modal {
  position: relative;
  isolation: isolate;
  display: flex;
  width: min(64rem, calc(100vw - 2rem));
  height: min(48rem, calc(var(--velvet-100lvh) - 2rem));
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
  border-radius: 1.75rem;
  background: white;
}

.library-header,
.detail-header { flex: none; }

.library-scroll-root,
.detail-scroll-root {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  flex-direction: column;
}

.library-scroll-view,
.detail-scroll-view {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

.nested-portal-host {
  position: absolute;
  z-index: 20;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

.nested-detail-view { position: absolute !important; }

.nested-detail-panel {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
  border-radius: inherit;
  background: white;
}

@media (max-width: 700px) {
  .library-modal {
    width: 100vw;
    height: var(--velvet-100lvh);
    border-radius: 0;
  }
}`;

const nestedModalTailwind = `// The component tree is identical; replace the structural classes only.
<Sheet.Content className="relative isolate flex h-[min(48rem,calc(var(--velvet-100lvh)_-_2rem))] min-h-0 w-[min(64rem,calc(100vw_-_2rem))] flex-col overflow-hidden rounded-[28px] bg-white max-[700px]:h-[var(--velvet-100lvh)] max-[700px]:w-screen max-[700px]:rounded-none">
  <header className="shrink-0">...</header>

  <Sheet.Root open={articleOpen} onOpenChange={setArticleOpen}>
    <Scroll.Root className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Scroll.View className="h-full min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
        <Scroll.Content>...</Scroll.Content>
      </Scroll.View>
    </Scroll.Root>

    <div ref={nestedHostRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]" />
    <Sheet.Portal container={nestedHostRef}>
      <Sheet.View className="!absolute" side="right" nativeEdgeSwipePrevention>
        <Sheet.Content className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[inherit] bg-white">
          <header className="shrink-0">...</header>
          <Scroll.Root className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Scroll.View
              className="h-full min-h-0 overflow-y-auto [scrollbar-gutter:stable]"
              scrollGestureTrap={{ y: true }}
            >
              <Scroll.Content><Article /></Scroll.Content>
            </Scroll.View>
          </Scroll.Root>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
</Sheet.Content>`;

const compositionImports = `import { BottomSheet } from "@velvetui/react/bottom-sheet";
import { CardExpansion } from "@velvetui/react/card-expansion";
import { DepthSheet } from "@velvetui/react/depth-sheet";
import { Lightbox } from "@velvetui/react/lightbox";
import { PersistentSheet } from "@velvetui/react/persistent-sheet";

import "@velvetui/react/sheet.css";
import "@velvetui/react/bottom-sheet.css";
import "@velvetui/react/card-expansion.css";
import "@velvetui/react/depth-sheet.css";
import "@velvetui/react/lightbox.css";
import "@velvetui/react/persistent-sheet.css";`;

const EDITORIAL_GUIDES = {
  overview: guide(
    "Velvet gives React applications native-feeling sheets, stacked surfaces, lightboxes, card expansion, scroll coordination, and toasts. You choose a ready-made composition or assemble the primitives yourself.",
    section(
      "Start in three minutes",
      code("bash", install),
      code("tsx", rootSetup),
      "Use a composition when its behavior matches your product. Use `Sheet` primitives when you need a different DOM tree, placement, snap model, or visual treatment.",
    ),
    section(
      "Pick the right entry point",
      "- `@velvetui/react/sheet` — headless sheet primitives.\n- `@velvetui/react/motion` — framework-free spring and WAAPI tools.\n- `@velvetui/react/motion/react` — motion hooks with cleanup.\n- `@velvetui/react/utilities` — Scroll and integration primitives.\n- `@velvetui/react/bottom-sheet` — a production bottom sheet.\n- `@velvetui/react/depth-sheet` — iOS-style page recession and nesting.\n- `@velvetui/react/card-expansion` — a modal card with shared-origin motion.\n- `@velvetui/react/lightbox` — full-screen media with bidirectional dismissal.\n- `@velvetui/react/toast` — viewport-fixed feedback.",
      "> Import `sheet.css` with sheet primitives, `toast.css` with an unstyled Toaster, or `base.css` when both families are present. Import the matching composition CSS beside each styled composition.",
    ),
    section(
      "The mental model",
      "A sheet has state, a trigger, a portal, a gesture view, a backdrop, and content. `Sheet.Panel` composes those parts for the common case. Every open, drag, snap, and close uses the same travel value and spring model.",
      "If an implementation feels stuck, first ask: who owns `open`, which element scrolls, which direction can dismiss, and whether the page behind should remain interactive?",
    ),
  ),

  installation: guide(
    "Install the package once, then choose either the complete stylesheet or granular CSS entries. Velvet supports React 18 and 19 and does not require a styling runtime.",
    section("Install", code("bash", install)),
    section(
      "Add CSS at the application boundary",
      code("tsx", rootSetup),
      "`styles.css` includes structural rules and every supplied skin. For a smaller bundle, import `sheet.css` or `toast.css` and only the composition CSS you use. `base.css` is the convenience structural entry when the application uses both Sheet and Toast.",
    ),
    section(
      "Framework placement",
      "- Vite or TanStack Start: import CSS in the client root or root route.\n- Next.js App Router: import CSS from `app/layout.tsx`.\n- Remix or React Router: import CSS through the root route stylesheet mechanism.\n- Component libraries: keep CSS imports in the consuming application so bundlers preserve order.",
      "Render triggers during SSR as normal. Portals mount after hydration, so the page remains valid HTML without duplicating modal content.",
    ),
    section(
      "Verify the setup",
      code("tsx", basicSheet),
      "If the trigger renders but nothing opens, confirm that `sheet.css`, `base.css`, or `styles.css` is loaded and that no ancestor applies `display: none` or a global `pointer-events: none` rule to portal content.",
    ),
  ),

  styling: guide(
    "Velvet owns interaction geometry; your product owns appearance. Style stable classes, data attributes, and CSS variables. Avoid selectors that depend on internal wrapper depth.",
    section(
      "Plain CSS",
      code("css", `.settings-sheet {
  --velvet-panel-radius: 28px;
  width: min(100%, 42rem);
  padding: 1.25rem;
  border-radius: var(--velvet-panel-radius) var(--velvet-panel-radius) 0 0;
  background: Canvas;
  color: CanvasText;
  box-shadow: 0 -24px 70px rgb(15 23 42 / 18%);
}

[data-velvet="backdrop"] {
  background: rgb(2 6 23 / 46%);
}`),
      "Scope overrides to a product class when multiple sheets need different themes. Data attributes are stable behavioral hooks; classes remain the best place for product styling.",
    ),
    section(
      "Tailwind CSS v4",
      code("css", `@import "tailwindcss";`),
      code("tsx", `<Sheet.Panel
  side="bottom"
  className="mx-auto w-full max-w-2xl rounded-t-[28px] bg-white p-6 text-slate-950 shadow-2xl"
>
  <Sheet.Title className="text-xl font-semibold tracking-tight">
    Project settings
  </Sheet.Title>
</Sheet.Panel>`),
      "Tailwind utilities work directly through `className`. Keep the structural Velvet CSS import; utilities should style the surface rather than reimplement gesture tracks.",
    ),
    section(
      "Styled Components or Emotion",
      code("tsx", `const Surface = styled(Sheet.Content)\`
  width: min(100%, 42rem);
  padding: 24px;
  border-radius: 28px 28px 0 0;
  background: ${({ theme }) => theme.surface};
\`;

<Sheet.Panel asChild side="bottom">
  <Surface>...</Surface>
</Sheet.Panel>`),
      "Use `asChild` when the styling library must own the actual element. Ensure the child forwards refs and event props; gesture measurement depends on that ref.",
    ),
    section(
      "Responsive and dark themes",
      code("css", `@media (min-width: 48rem) {
  .settings-sheet {
    margin: 1rem;
    border-radius: 28px;
  }
}

@media (prefers-color-scheme: dark) {
  .settings-sheet {
    background: #101114;
    color: #f8fafc;
  }
}`),
      "Prefer CSS media queries over JavaScript viewport checks. The interaction model stays mounted while CSS changes the authored layout.",
    ),
  ),

  "sheet-quick-start": guide(
    "Start with `Sheet.Panel`. It supplies the portal, backdrop, gesture view, content surface, and handle while leaving your content and classes untouched.",
    section("A complete sheet", code("tsx", basicSheet)),
    section(
      "Controlled state",
      code("tsx", `const [open, setOpen] = useState(false);

<Sheet.Root open={open} onOpenChange={setOpen}>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Panel side="bottom">...</Sheet.Panel>
</Sheet.Root>`),
      "Use controlled state when routing, validation, or another component decides whether the sheet may close. Otherwise prefer uncontrolled state and let the trigger own the interaction.",
    ),
    section(
      "When to use the lower-level tree",
      "Reach for `Sheet.View`, `Sheet.Backdrop`, and `Sheet.Content` when the backdrop sits elsewhere, the content uses a custom portal host, or multiple visual layers share one travel value.",
    ),
  ),

  anatomy: guide(
    "The parts are separate so styling and composition can change without rewriting gesture, focus, and modality behavior.",
    section(
      "Primitive tree",
      code("tsx", `<Sheet.Root>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.View side="bottom">
      <Sheet.Backdrop />
      <Sheet.Content>
        <Sheet.Handle />
        <Sheet.Title>Account</Sheet.Title>
        <Sheet.Description>Manage your profile.</Sheet.Description>
        <Sheet.Close>Done</Sheet.Close>
      </Sheet.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet.Root>`),
      "- `Root` owns open and snap state.\n- `Trigger`, `Close`, and `Step` express actions.\n- `View` owns tracks, gestures, modality, and travel.\n- `Backdrop` handles dimming and outside interaction.\n- `Content` is the authored surface.\n- `Outlet` animates UI outside the portal.",
    ),
    section(
      "What must remain intact",
      "Forward refs through custom children, keep the real scroll element identifiable, and render `Title` even when it is visually hidden. Those three details prevent most integration failures.",
    ),
  ),

  "nested-modal-navigation": guide(
    "A nested side sheet can stay physically inside a centered modal while retaining native scrolling, swipe-back, focus ownership, and independent Back and Close actions.",
    section(
      "Complete React structure",
      code("tsx", nestedModalNavigation),
      "`Sheet.Portal` accepts either a resolved element or a React ref. Passing the ref directly avoids callback-ref state and the extra guarded render that older recipes needed.",
    ),
    section(
      "Required layout CSS",
      code("css", nestedModalCss),
      "The portal host establishes the clipping boundary. The nested View must be absolute because a normal Sheet.View is viewport-fixed. Keep the sticky header outside Scroll.View so only the article becomes the native overflow surface.",
    ),
    section(
      "Tailwind CSS v4",
      code("css", `@import "tailwindcss";`),
      code("tsx", nestedModalTailwind),
      "Keep `import \"@velvetui/react/sheet.css\"` in the JavaScript entry. Tailwind owns the authored surface; Velvet's stylesheet owns gesture tracks, portal mechanics, modality, and Scroll coordination.",
    ),
    section(
      "Live package examples",
      "- [Open the plain CSS StackBlitz](https://stackblitz.com/edit/vitejs-vite-dptpaa1d?file=App.jsx&view=preview)\n- [Open the Tailwind CSS v4 StackBlitz](https://stackblitz.com/edit/vitejs-vite-rrfjnly7?file=App.jsx,vite.config.js&view=preview)",
      "Both projects install `@velvetui/react` from npm. They do not alias the package to repository source or copy Velvet's internals into the example.",
    ),
    section(
      "Rules that prevent the common failures",
      "- Put the parent `Sheet.Title` and `Sheet.Description` before the child `Sheet.Root`; labels always register with the nearest Root.\n- Use exactly one `Scroll.Root → Scroll.View → Scroll.Content` chain per scrolling layer.\n- Give every Back, Close, and row trigger `type=\"button\"`; `href=\"#\"` causes page jumps and an implicit submit button can trigger a form.\n- Never use `scrollGestureTrap={true}` for a full-page horizontal child. Leave it `false`, or use `{ y: true }` to contain only vertical chaining while horizontal swipe-back remains available over paragraphs, cards, and controls.\n- Style the scrollbar on `Scroll.View`; it is the real browser overflow element.\n- Control both roots only when a child action must close the complete flow. A child `Sheet.Close` should otherwise dismiss only the child.",
    ),
    section(
      "Mobile check",
      "Test after a cold reload on a phone. Scroll the article from the middle, swipe back beginning directly over text, use Back to preserve the parent modal, use Close to leave both layers, and confirm the page and parent scroll positions never change.",
    ),
  ),

  "gallery-recipes": guide(
    "The homepage demos are product-shaped examples built from the public API. These condensed recipes show the primitive or composition behind every card.",
    section("Composition imports", code("tsx", compositionImports)),
    section(
      "Bottom Sheet, Modal, Drawer, Detents",
      code("tsx", `<BottomSheet.Root>
  <BottomSheet.Trigger>View stay</BottomSheet.Trigger>
  <BottomSheet.Content><StayDetails /></BottomSheet.Content>
</BottomSheet.Root>

<Sheet.Root>
  <Sheet.Trigger>Invite people</Sheet.Trigger>
  <Sheet.Panel side="center" tracks={["top", "bottom"]}>
    <InviteForm />
  </Sheet.Panel>
</Sheet.Root>

<Sheet.Root>
  <Sheet.Trigger>Open navigation</Sheet.Trigger>
  <Sheet.Panel side="left"><Navigation /></Sheet.Panel>
</Sheet.Root>

<Sheet.Root defaultSnap={1}>
  <Sheet.Panel side="bottom" snapPoints={["38lvh", "78lvh"]}>
    <Queue />
  </Sheet.Panel>
</Sheet.Root>`),
    ),
    section(
      "Top, Scrollable, Stacked, Detached",
      code("tsx", `<Sheet.Panel side="top"><Notification /></Sheet.Panel>

<Sheet.View side="bottom" tracks="auto">
  <Sheet.Content>
    <Scroll.Root>
      <Scroll.View><Scroll.Content><Article /></Scroll.Content></Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>

<SheetStack.Root>
  <ProductSheet>
    <SizeSheet />
  </ProductSheet>
</SheetStack.Root>

<Sheet.Panel side="center" className="detached-sheet">
  <QuickView />
</Sheet.Panel>`),
      "A detached sheet is still a center sheet. Its margin, maximum width, radius, and shadow are authored CSS rather than a separate gesture primitive.",
    ),
    section(
      "Full Screen, Depth, Lightbox, Parallax",
      code("tsx", `<Sheet.Panel side="bottom" className="full-screen-sheet">
  <Editor />
</Sheet.Panel>

<DepthSheet.Root>
  <DepthSheet.Page><Home /></DepthSheet.Page>
  <DepthSheet.Content><Profile /></DepthSheet.Content>
</DepthSheet.Root>

<Lightbox.Root>
  <Lightbox.Trigger>Open photo</Lightbox.Trigger>
  <Lightbox.Content><Gallery /></Lightbox.Content>
</Lightbox.Root>

<Sheet.Outlet travelAnimation={{ transform: ({ tween }) =>
  \`translateY(\${tween(0, -48)}px)\`
}}>
  <Cover />
</Sheet.Outlet>`),
    ),
    section(
      "Side, Keyboard-aware, Card Expansion, Persistent",
      code("tsx", `<Sheet.Panel side="right"><AccountSettings /></Sheet.Panel>

<Sheet.Panel side="bottom">
  <Scroll.View safeArea="visual-viewport"><Conversation /></Scroll.View>
</Sheet.Panel>

<CardExpansion.Root>
  <CardExpansion.Trigger><StoryCard /></CardExpansion.Trigger>
  <CardExpansion.Content><StoryPreview /></CardExpansion.Content>
</CardExpansion.Root>

<PersistentSheet.Root defaultOpen defaultSnap={1}>
  <PersistentSheet.Content><MiniPlayer /></PersistentSheet.Content>
</PersistentSheet.Root>`),
      "The repository playground contains the full product UI for each demo. The snippets above show the reusable Velvet structure without demo-only markup.",
    ),
  ),

  "open-state": guide(
    "Use uncontrolled state for self-contained UI. Use controlled state when the sheet participates in routing, validation, or a multi-step workflow.",
    section(
      "Uncontrolled",
      code("tsx", `<Sheet.Root defaultOpen={false}>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Panel side="bottom">...</Sheet.Panel>
</Sheet.Root>`),
      "`defaultOpen` is read once. Triggers, outside interaction, Escape, and gestures update the internal state.",
    ),
    section(
      "Controlled",
      code("tsx", `const [open, setOpen] = useState(searchParams.has("settings"));

<Sheet.Root
  open={open}
  onOpenChange={(nextOpen) => {
    setOpen(nextOpen);
    updateUrl(nextOpen);
  }}
>
  ...
</Sheet.Root>`),
      "Do not ignore `onOpenChange` while passing `open`; the sheet will request a state change but your UI will remain frozen.",
    ),
  ),

  placement: guide(
    "Placement describes where content enters. Tracks describe which gestures may dismiss it. They usually match, but center surfaces often support both vertical directions.",
    section(
      "Available sides",
      code("tsx", `<Sheet.Panel side="bottom" />
<Sheet.Panel side="top" />
<Sheet.Panel side="left" />
<Sheet.Panel side="right" />
<Sheet.Panel side="center" tracks={["top", "bottom"]} />`),
      "- Bottom opens upward and dismisses downward.\n- Top opens downward and dismisses upward.\n- Left and right behave as edge drawers.\n- Center is appropriate for modals, lightboxes, and floating surfaces.",
    ),
    section(
      "Responsive placement",
      "If the interaction changes materially between mobile and desktop, render the same root and alter layout with CSS first. Only branch the side prop when the gesture direction must also change.",
    ),
  ),

  detents: guide(
    "Detents are intermediate resting positions along one sheet travel. They are CSS lengths, so they adapt to the viewport without a parallel measurement system.",
    section(
      "Declare stops",
      code("tsx", `<Sheet.Root defaultSnap={1}>
  <Sheet.Panel side="bottom" snapPoints={["36lvh", "72lvh"]}>
    <Sheet.Step direction="up">Expand</Sheet.Step>
    <Sheet.Step direction="down">Collapse</Sheet.Step>
  </Sheet.Panel>
</Sheet.Root>`),
      "`0` is closed. `1` is the first supplied stop. The final index is fully open. Prefer `lvh` or `dvh` when browser chrome and virtual keyboards affect the available height.",
    ),
    section(
      "Persistent collapse",
      code("tsx", `<Sheet.Panel
  side="bottom"
  snapPoints="96px"
  dismissible={false}
  modal={false}
>
  <MiniPlayer />
</Sheet.Panel>`),
      "With `dismissible={false}`, a downward swipe returns to the lower detent instead of removing the surface.",
    ),
  ),

  dismissal: guide(
    "Dismissal is policy, not styling. Decide separately whether dragging, an outside press, and Escape may close the current state.",
    section(
      "Guard unsaved work",
      code("tsx", `<Sheet.View
  dismissible
  onClickOutside={{ dismiss: false }}
  onEscapeKeyDown={({ changeDefault }) => {
    if (dirty) changeDefault({ dismiss: false });
  }}
/>`),
      "For a destructive confirmation, use `sheetRole=\"alertdialog\"`. It starts with safer outside and Escape behavior and still supports an explicit close action.",
    ),
    section(
      "Gesture directions",
      "`tracks={['top', 'bottom']}` enables bidirectional vertical dismissal for modal cards and lightboxes. An upward flick is not enabled automatically on a normal bottom sheet.",
    ),
  ),

  "travel-animation": guide(
    "Travel animation maps the same physical progress used by the sheet onto CSS properties. This keeps the surface, backdrop, page, and decorative layers synchronized.",
    section(
      "Animate panel and page together",
      code("tsx", `<Sheet.Backdrop travelAnimation={{ opacity: [0, 0.44] }} />

<Sheet.Content travelAnimation={{
  opacity: ({ progress }) => Math.min(progress * 1.8, 1),
  transform: ({ tween }) => \`translateY(\${tween(24, 0)}px)\`,
}} />

<Sheet.Outlet travelAnimation={{
  transform: ({ tween }) => \`scale(\${tween(1, 0.96)})\`,
  borderRadius: [0, 28],
}}>
  <Page />
</Sheet.Outlet>`),
      "A value may be a `[from, to]` pair, a function of `{ progress, tween }`, or a literal. Use transform and opacity when possible to avoid layout work during a drag.",
    ),
  ),

  "shared-origin-motion": guide(
    "Shared-origin motion visually connects a trigger to its expanded surface. It is opt-in so ordinary sheets do not pay for geometry measurement.",
    section(
      "Expand from the trigger",
      code("tsx", `import { SheetMorph } from "@velvetui/react/sheet-morph";

<Sheet.Root>
  <Sheet.Trigger className="story-card">Read story</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.View side="center" tracks={["top", "bottom"]}>
      <SheetMorph.Content from="trigger" className="story-modal">
        <Story />
      </SheetMorph.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet.Root>`),
      "The destination still needs authored width, height, and radius. Velvet measures both rectangles and folds the difference into the same interruptible sheet spring.",
    ),
    section(
      "When not to use it",
      "Skip morphing when the source and destination have unrelated content, when the source may unmount during navigation, or when the visual connection makes a simple task feel slower.",
    ),
  ),

  springs: guide(
    "Named spring presets make motion consistent. Custom values are an escape hatch for a deliberate material change, not a requirement for each component.",
    section(
      "Presets",
      "- `gentle` — slow and soft.\n- `smooth` — balanced default with little overshoot.\n- `snappy` — quick with a small amount of life.\n- `brisk` — fast dismissal response.\n- `bouncy` — visible overshoot.\n- `elastic` — loose, expressive motion.",
      code("tsx", `import { SPRING_PRESETS } from "@velvetui/react/motion";

<Sheet.View
  enteringAnimationSettings="snappy"
  exitingAnimationSettings="brisk"
/>`),
    ),
    section(
      "Custom physics",
      code("tsx", `<Sheet.View enteringAnimationSettings={{
  easing: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.9,
}} />`),
      "Always test a custom spring after an interrupted drag. A value that looks good from rest may feel wrong when it inherits real gesture momentum.",
    ),
  ),

  triggers: guide(
    "Action primitives keep intent visible in the tree and preserve keyboard semantics. They may render your design-system control through `asChild`.",
    section(
      "Open, close, and step",
      code("tsx", `<Sheet.Trigger asChild>
  <Button>Open</Button>
</Sheet.Trigger>

<Sheet.Step direction="up">Expand</Sheet.Step>
<Sheet.Step snapTo={2}>Open details</Sheet.Step>
<Sheet.Close>Done</Sheet.Close>`),
      "The `asChild` element must accept a ref, `onClick`, ARIA attributes, and `disabled`. If a wrapped button does not open the sheet, check its prop and ref forwarding first.",
    ),
  ),

  accessibility: guide(
    "Velvet handles modal semantics, focus containment, inert background branches, Escape ownership, and focus restoration. Your content still determines whether the final experience is accessible.",
    section(
      "Required labels",
      code("tsx", `<Sheet.Content>
  <Sheet.Title>Delete project</Sheet.Title>
  <Sheet.Description>
    The project and its files will be permanently deleted.
  </Sheet.Description>
  <button>Delete project</button>
  <Sheet.Close>Cancel</Sheet.Close>
</Sheet.Content>`),
      "Use `VisuallyHidden` around a title only when a visible heading would duplicate the surrounding UI. Never omit the accessible name.",
    ),
    section(
      "Focus checklist",
      "- The opener receives focus again after close.\n- Tab and Shift+Tab remain inside the frontmost modal.\n- Escape closes only the frontmost dismissible layer.\n- A non-modal persistent sheet does not make the page inert.\n- Portalled third-party overlays join the sheet through `ExternalOverlay.Root`.",
    ),
    section(
      "Reduced motion",
      "Velvet honors the user’s reduced-motion preference. Do not add a separate CSS animation that continues after the sheet has skipped its own travel.",
    ),
  ),

  "sheet-api": guide(
    "This is the contract for the headless primitives. Start with `Sheet.Panel`; consult this page when a composition needs lower-level control.",
    section(
      "Root state",
      "- `open?: boolean` — controlled visibility.\n- `defaultOpen?: boolean` — initial uncontrolled visibility.\n- `onOpenChange?: (open) => void` — receives every requested visibility change.\n- `snap?: number` and `onSnapChange?: (index) => void` — controlled detent.\n- `defaultSnap?: number` — initial uncontrolled detent.\n- `sheetRole?: 'dialog' | 'alertdialog'` — accessible modal role.",
    ),
    section(
      "View behavior",
      "- `side?: 'bottom' | 'top' | 'left' | 'right' | 'center'`.\n- `tracks?: Track | Track[] | 'auto'` — allowed dismissal tracks.\n- `snapPoints?: string | string[]` — intermediate CSS-length stops.\n- `draggable?: boolean` — enables native gesture travel.\n- `dismissible?: boolean` — allows travel to reach closed.\n- `modal?: boolean` — scroll lock, inert background, and focus containment.\n- `onClickOutside` and `onEscapeKeyDown` — static or per-event dismissal policy.",
    ),
    section(
      "Motion callbacks",
      "- `enteringAnimationSettings`, `exitingAnimationSettings`, `steppingAnimationSettings`.\n- `onTravel`, `onTravelStart`, `onTravelEnd`, `onTravelStatusChange`.\n- `travelAnimation` on Backdrop, Content, and Outlet.\n- `stackingAnimation` on stack outlets and compositions.",
      code("tsx", basicSheet),
    ),
  ),

  "depth-sheet": guide(
    "Depth Sheet creates an iOS-like hierarchy: the current page recedes, rounds, and dims while the new full-width surface rises. It uses the actual page as the backing layer.",
    section(
      "Basic depth sheet",
      code("tsx", `import { DepthSheet } from "@velvetui/react/depth-sheet";
import "@velvetui/react/sheet.css";
import "@velvetui/react/depth-sheet.css";

<DepthSheet.Root>
  <DepthSheet.Page asChild>
    <main><DepthSheet.Trigger>Open profile</DepthSheet.Trigger></main>
  </DepthSheet.Page>
  <DepthSheet.Content>
    <DepthSheet.Title>Mara Vale</DepthSheet.Title>
    <Profile />
  </DepthSheet.Content>
</DepthSheet.Root>`),
      "`Page` must wrap the page that should visually recede. `Content` remains a normal authored surface and may contain another Depth Sheet.",
    ),
    section(
      "Nest any number of sheets",
      code("tsx", `<DepthSheet.Root>
  <DepthSheet.Page><Home /></DepthSheet.Page>
  <DepthSheet.Content>
    <Profile />
    <DepthSheet.Root>
      <DepthSheet.Trigger>Open field note</DepthSheet.Trigger>
      <DepthSheet.Content>
        <FieldNote />
        <DepthSheet.Root>{/* third layer */}</DepthSheet.Root>
      </DepthSheet.Content>
    </DepthSheet.Root>
  </DepthSheet.Content>
</DepthSheet.Root>`),
      "Each nested root joins the nearest coordinator. Transforms are bounded, so a deep stack remains legible rather than shrinking every older layer indefinitely.",
    ),
    section(
      "Tune depth without rewriting motion",
      code("tsx", `<DepthSheet.Root tokens={{
  shift: "16px",
  scaleLoss: 0.055,
  dimming: 0.085,
  radius: "28px",
}}>
  ...
</DepthSheet.Root>`),
      "The same values are exposed as `--velvet-depth-*` variables. Use props for component-level tokens and CSS variables for responsive or theme-based changes.",
    ),
    section(
      "The three Depth exports",
      `| Export | What it actually contains | Typical use |
| --- | --- | --- |
| \`depthSheetVariables\` | token key to CSS custom-property name | computed style keys and CSS-in-JS |
| \`depthSheetDefaultTokens\` | values shipped by \`depth-sheet.css\` | inspect or extend the default material |
| \`depthSheetStackingAnimation\` | bounded \`TravelAnimation\` used by Page and nested Content | reuse or shallow-copy one property |`,
      code("tsx", `import {
  DepthSheet,
  depthSheetDefaultTokens,
  depthSheetStackingAnimation,
  depthSheetVariables,
} from "@velvetui/react/depth-sheet";

const rootStyle = {
  [depthSheetVariables.shadow]: "0 -18px 56px rgb(0 0 0 / 22%)",
};

const softerStack = {
  ...depthSheetStackingAnimation,
  filter: ({ progress }) => \`brightness(\${1 - Math.min(progress, 3) * .06})\`,
};`),
      "`depthSheetVariables` contains names such as `--velvet-depth-shadow`; it does not contain values. `depthSheetDefaultTokens` contains the matching default values. `depthSheetStackingAnimation` is motion, not a configuration object.",
    ),
    section(
      "Defensive bounds",
      "Numeric token props are normalized: scale loss and dimming stay between 0 and 0.25, minimum scale stays between 0.5 and 1, and minimum brightness stays between 0.4 and 1. Invalid token names, non-finite numbers, and empty values are ignored.",
      "CSS-authored values still use browser validation. The supplied stacking animation clamps scale, brightness, radius, and shift at every depth, so ten nested surfaces retain a usable hierarchy.",
    ),
  ),

  "card-expansion": guide(
    "Card Expansion keeps the resting card simple. On open, it becomes a centered modal surface with shared-origin motion and the scale response of a lightbox.",
    section(
      "Modal card",
      code("tsx", `import { CardExpansion } from "@velvetui/react/card-expansion";
import "@velvetui/react/card-expansion.css";

<CardExpansion.Root>
  <CardExpansion.Trigger asChild>
    <article className="story-card"><StorySummary /></article>
  </CardExpansion.Trigger>
  <CardExpansion.Content scroll={false}>
    <CardExpansion.Title>Designing motion that feels real</CardExpansion.Title>
    <StoryPreview />
    <CardExpansion.Close>Close</CardExpansion.Close>
  </CardExpansion.Content>
</CardExpansion.Root>`),
      "The trigger stays a normal card. The content is a modal with focus containment, inert background behavior, Escape support, and upward or downward swipe dismissal.",
    ),
    section(
      "Scrollable content",
      "Set `scroll` when the expanded card exceeds the viewport. Keep the header or close control outside the scroll region if it must remain reachable on small devices.",
      "Use `from={null}` when the source should not morph. The modal still scales with travel and dismisses bidirectionally.",
    ),
  ),

  "styled-compositions": guide(
    "Styled compositions package interaction policy, stable classes, CSS variables, and a sensible surface. They are tree-shakable entry points rather than one mandatory theme.",
    section("Import only what you use", code("tsx", compositionImports)),
    section(
      "Which composition should I choose?",
      "- `BottomSheet` for mobile detail and task flows.\n- `PersistentSheet` for media controls or tools that collapse but remain available.\n- `DepthSheet` for hierarchical, full-width navigation.\n- `CardExpansion` for preview-to-modal transitions.\n- `Lightbox` for immersive media.\n- Headless `Sheet` for everything else.",
    ),
    section(
      "Override safely",
      "Start with composition variables, then add a product class. Do not copy the internal scroll-track rules into application CSS; those rules are the behavioral contract the composition already supplies.",
    ),
  ),

  "toast-quick-start": guide(
    "Render one `Toaster` near the application root. Call `toast` from any client interaction; no provider or prop drilling is required.",
    section(
      "Setup",
      code("tsx", `import { Toaster, toast } from "@velvetui/react/toast";
import "@velvetui/react/styles.css";

export function App() {
  return (
    <>
      <Routes />
      <Toaster position="bottom-right" />
    </>
  );
}

toast.success("Changes saved");`),
      "The toaster is fixed to the viewport, so it should not be placed inside a transformed or clipped product container.",
    ),
  ),

  "toast-variants": guide(
    "Variants communicate meaning, not decoration. Use the neutral default for ordinary feedback and reserve warning or error color for states that need attention.",
    section(
      "Available variants",
      code("tsx", `toast("Draft saved");
toast.success("Published");
toast.error("Could not publish");
toast.warning("Connection is unstable");
toast.info("A new version is available");

const id = toast.loading("Uploading…");
toast.success("Uploaded", { id });`),
      "Reusing an id updates a toast in place. This is better than stacking loading and completion messages for the same operation.",
    ),
  ),

  "toast-positioning": guide(
    "Position belongs to the `Toaster`, not individual messages. Choose one predictable location for an application region.",
    section(
      "Positions",
      code("tsx", `<Toaster position="top-left" />
<Toaster position="top-center" />
<Toaster position="top-right" />
<Toaster position="bottom-left" />
<Toaster position="bottom-center" />
<Toaster position="bottom-right" />`),
      "Corner positions accept left and right swipes by default; centered positions accept up and down. Pass `swipeDirections` to `Toaster` for the global policy or to one toast for a local override. On mobile, bottom-center is usually easiest to reach; avoid covering persistent navigation or form submit controls.",
    ),
  ),

  "toast-options": guide(
    "A toast title should say what happened. The description should explain impact or recovery. Actions should be short and safe to repeat.",
    section(
      "Options",
      code("tsx", `toast("Update available", {
  id: "app-update",
  description: "Reload when you are ready.",
  duration: 8_000,
  icon: <Sparkles />,
  action: {
    label: "Reload",
    onClick: () => window.location.reload(),
  },
  closeButton: true,
  closeButtonPosition: "left",
});`),
      "Common options include `id`, `description`, `duration`, `icon`, `action`, `closeButton`, `closeButtonPosition`, `important`, `dismissible`, and per-toast class or style overrides.",
    ),
  ),

  "toast-promise": guide(
    "`toast.promise` turns one asynchronous operation into one continuous feedback item. It prevents duplicate loading, success, and failure notifications.",
    section(
      "Bind a promise",
      code("tsx", `toast.promise(uploadPhoto(file), {
  loading: "Uploading photo…",
  success: (photo) => ({
    message: "Photo uploaded",
    description: photo.name,
  }),
  error: (error) => ({
    message: "Upload failed",
    description: error.message,
  }),
});`),
      "Return user-facing messages from the settled value. Log technical detail elsewhere; a toast is not a stack trace.",
    ),
  ),

  "toast-api": guide(
    "The toast API is an imperative dispatcher plus one declarative renderer. Mount one Toaster for the current browser context and call toast from client interactions.",
    section(
      "Methods",
      "- `toast(message, options)` — neutral toast.\n- `toast.success`, `toast.error`, `toast.warning`, `toast.info`.\n- `toast.loading(message, options)` — persistent loading state.\n- `toast.promise(promise, states)` — async lifecycle.\n- `toast.custom(render, options)` — custom JSX.\n- `toast.dismiss(id?)` — dismiss one or every toast.",
    ),
    section(
      "Toaster values",
      "- `position` — six viewport positions.\n- `duration` — default timeout in milliseconds.\n- `visibleToasts` — maximum visible stack.\n- `gap` — space between expanded items.\n- `closeButtonPosition` — place the floating close affordance on the physical left or right.\n- `richColors`, `closeButton`, `stack`, `expand`, and `swipeDirections`.",
    ),
    section(
      "Swipe and controls",
      "Buttons and links still respond to a tap or click. Dragging from the same control dismisses the toast and suppresses its click, so the action never fires by accident. Corner toasts use the horizontal axis by default; centered toasts use the vertical axis.",
      "Inputs, textareas, selects, and editable content keep pointer ownership. Add `data-velvet-toast-swipe-ignore` to any other custom region that must not begin a swipe.",
      code("tsx", `<Toaster swipeDirections={["right"]} />

toast("Archived", { swipeDirections: ["left"] });

toast.custom(
  <div data-velvet-toast-swipe-ignore>
    <InlineEditor />
  </div>
);`),
    ),
  ),

  scroll: guide(
    "Scrollable content and sheet travel must agree about gesture ownership. Velvet hands a drag to the sheet only when the nested scroller reaches the relevant edge.",
    section(
      "Coordinated scroll",
      code("tsx", `<Sheet.View side="bottom" tracks="auto">
  <Sheet.Content asChild>
    <Scroll.Root asChild>
      <Scroll.View className="article-scroll">
        <Scroll.Content><Article /></Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>`),
      "`tracks=\"auto\"` keeps stable bidirectional geometry and lets native scroll chaining choose the valid boundary. Do not mirror scroll position into React state just to decide whether a drag may dismiss.",
    ),
    section(
      "Keyboard-safe input",
      code("tsx", `<Scroll.View safeArea="visual-viewport">
  <Conversation />
  <Composer />
</Scroll.View>`),
      "Also use `interactive-widget=resizes-content` in the viewport meta tag. Keep the composer inside the visual-viewport-aware surface so focused inputs remain reachable.",
    ),
    section(
      "Horizontal swipe through vertical content",
      "For a right or left sheet whose body scrolls vertically, leave `scrollGestureTrap` at its default `false` and keep `scrollGestureOvershoot` at its default `true`. Cross-axis containment on a page-sized Scroll.View blocks swipe-back when the gesture begins over text or cards.",
      "When vertical chaining must be contained, use `scrollGestureTrap={{ y: true }}`. It contains the scrolling axis while leaving horizontal swipe-back open; never use `scrollGestureTrap={true}` on the full sheet body.",
    ),
  ),

  "sheet-stack": guide(
    "A stack coordinates depth, focus, inertness, and Escape ownership across nested sheets. There is no two-layer limit.",
    section(
      "Application stack",
      code("tsx", `<SheetStack.Root>
  <App />
</SheetStack.Root>`),
      "Nested `Sheet.Root` and `DepthSheet.Root` instances discover the nearest stack automatically. The frontmost modal owns Escape and focus; closing it restores the previous layer.",
    ),
    section(
      "Animate the backing page",
      code("tsx", `<SheetStack.Outlet stackingAnimation={{
  transform: ({ depth }) => \`scale(\${1 - Math.min(depth, 3) * 0.045})\`,
  borderRadius: ({ depth }) => \`\${Math.min(depth, 1) * 28}px\`,
}}>
  <Page />
</SheetStack.Outlet>`),
      "Bound the visual effect by depth. Ten nested sheets should preserve hierarchy without turning the oldest page into a thumbnail.",
    ),
  ),

  utilities: guide(
    "Utilities cover the integration details that do not belong in the main sheet tree. Import them only where needed.",
    section(
      "Accessibility utilities",
      "- `VisuallyHidden` — keeps text available to assistive technology.\n- `AutoFocusTarget` — chooses the initial focus target.\n- `ExternalOverlay.Root` — joins a third-party portal to the active focus scope.",
      code("tsx", `import {
  AutoFocusTarget,
  ExternalOverlay,
  VisuallyHidden,
} from "@velvetui/react/utilities";`),
    ),
    section(
      "Motion and composition utilities",
      "- `SheetMorph` from `@velvetui/react/sheet-morph` — shared-origin geometry.\n- `ThemeBackdrop` from `@velvetui/react/theme-backdrop` — browser theme-color travel.\n- `SheetStack` from `@velvetui/react/sheet` — nested layer coordination.\n- `Scroll` from `@velvetui/react/utilities` — progress-aware scroll and gesture handoff.\n- `depthSheetVariables` from `@velvetui/react/depth-sheet` — stable CSS variable names for CSS-in-JS.\n- `animate` and interpolation helpers from `@velvetui/react/motion` — framework-free motion outside components.\n- React lifecycle hooks from `@velvetui/react/motion/react`.",
    ),
    section(
      "Client helpers",
      "`useClientMediaQuery` avoids server/client markup disagreement by resolving media state after hydration. Prefer CSS media queries when only presentation changes.",
    ),
  ),

  changelog: guide(
    "A human-readable record of the changes that affect how Velvet is installed, composed, styled, or experienced. Internal refactors appear only when they change reliability, bundle size, or extension points.",
    section(
      "0.2.0 · 2026-08-04",
      "### Documentation",
      "- Moved every guide to its own server-rendered route.\n- Added a Markdown response for every page at `/docs/<slug>.md`.\n- Added View as Markdown and Copy Markdown controls.\n- Added complete nested-modal navigation recipes for plain CSS and Tailwind CSS v4.\n- Added a bring-your-own-components guide covering custom actions, surfaces, Views, visual parts, layouts, refs, and event precedence.\n- Added Bun alongside npm, pnpm, and Yarn in installation examples.\n- Documented label ownership, native scrollbar placement, swipe-back through content, button semantics, and mobile verification.\n- Documented framework-free motion, React motion hooks, interruption, failure behavior, focused CSS, and the complete Depth contract.",
      "### Library",
      "- `Sheet.Portal` and `Sheet.Panel` now accept a React ref directly as their container.\n- `Sheet.Panel` and every styled composition now accept a custom `view` element while retaining gesture, focus, and modal behavior.\n- Backdrop, handle, and bleeding-background slots accept custom elements; `false` or `null` removes an optional part.\n- `Sheet.Panel asChild` and composition `Content asChild` support fully custom, ref-forwarding surface components.\n- Persistent Sheet exposes an optional backdrop slot while remaining non-modal and backdrop-free by default.\n- Added a development diagnostic for a presented View without a registered Title.\n- Split the sheet runtime into state, motion, gesture, modal, and focus controllers.\n- Added document-scoped managers so multiple documents and embedded previews remain isolated.\n- Added framework-free `motion`, React-only `motion/react`, and focused `utilities` entry points.\n- Added interruptible WAAPI playback, safe spring sampling, travel interpolation, and lifecycle-owned motion hooks.\n- Renamed the Depth contract to `depthSheetVariables`, `depthSheetDefaultTokens`, and `depthSheetStackingAnimation`.\n- Added focused `sheet.css`, `toast.css`, and `toast-theme.css` entries alongside the convenience bundles.\n- Added tree-shakable entry points for the supplied compositions.\n- Added per-toast `swipeDirections` overrides and a duplicate-Toaster runtime diagnostic.\n- Minified published JavaScript with repeated standards-safe Terser passes and every CSS entry with Lightning CSS, without property-name mangling or unsafe transforms.",
      "### Fixed",
      "- Removed stale pure annotations from published chunks so consumer Rollup builds remain warning-free.\n- Fixed `Sheet.View asChild` forwarding and custom Panel/composition surfaces with injected mechanics.\n- Preserved custom View children and composition backdrop travel when replacing visual parts.\n- Made opener capture and focus restoration deterministic for custom triggers, including motion-skipped exits.\n- Kept horizontal swipe-back available when a gesture starts over vertically scrollable sheet content.\n- Prevented non-text focus and sheet action clicks from resetting coordinated content to the top.\n- Hardened Toast swipes against duplicate fallback events, touch streams reporting `buttons: 0`, coalesced pointer-up coordinates, pointer-capture loss, direction reversal, and secondary-pointer takeover.\n- Made Toast dismissal bidirectional on its natural placement axis, allowed swipes to begin on action controls without firing them, and stopped non-dismissible toasts from blocking mobile page panning.\n- Reconciled focus and hover ownership after swipe removal so the remaining stack collapses and paused timeout countdowns resume.\n- Floated the built-in Toast close control outside the content row, added left/right placement plus low-specificity CSS/Tailwind button and icon hooks, and clarified the macOS Option shortcut.\n- Added a clear development error for invalid `asChild` children.\n- Restored the shared trigger-geometry helper after the controller split.\n- Removed the obsolete SPA entry that could override TanStack Start SSR during development.",
    ),
    section(
      "0.1.0 · Initial preview",
      "### Added",
      "- Headless Sheet primitives with native scroll-snap gestures and spring-driven programmatic travel.\n- Snap points, controlled and uncontrolled state, modal focus management, and nested Sheet Stack coordination.\n- Bottom Sheet, Depth Sheet, Card Expansion, Persistent Sheet, and Lightbox compositions.\n- Viewport-fixed toast stacks with variants, promises, actions, and flick dismissal.",
      "### Upgrade notes",
      "This is the first published contract. Import structural CSS explicitly and prefer the focused package entry points shown in each guide.",
    ),
  ),
};

export const GUIDE_CONTENT = {
  ...EDITORIAL_GUIDES,
  ...API_GUIDES,
};

export const createFallbackGuide = (doc) =>
  guide(
    doc.body,
    section("Example", code("tsx", doc.code)),
    section(
      "Implementation notes",
      "Start with the example, keep state ownership explicit, and add product styling through classes or CSS variables. Test keyboard access and interrupted gestures before shipping.",
    ),
  );
