# Nested modal navigation

> Keep a side sheet inside a centered modal with an independent native scrollbar, swipe-back through content, and separate Back and Close actions.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/nested-modal-navigation

A nested side sheet can stay physically inside a centered modal while retaining native scrolling, swipe-back, focus ownership, and independent Back and Close actions.

## Complete React structure

```tsx
import { useState } from "react";
import { Sheet } from "@velvetui/react/sheet";
import { Scroll } from "@velvetui/react/utilities";
import "@velvetui/react/sheet.css";

export function StudioLibrary() {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);

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
          <Sheet.NestedPortalHost asChild>
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

              <Sheet.NestedPanel
                side="right"
                nativeEdgeSwipePrevention
                swipeOvershoot={false}
                onClickOutside={{ dismiss: false }}
                className="nested-detail-panel"
              >
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
              </Sheet.NestedPanel>
            </Sheet.Root>
            </Sheet.Content>
          </Sheet.NestedPortalHost>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
```

`Sheet.NestedPortalHost` supplies the child portal boundary and deliberate relative clipping. `Sheet.NestedPanel` discovers that host, portals into it, and applies host-relative View positioning without ref state or hand-authored portal plumbing.

## Required layout CSS

```css
.library-modal {
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
}
```

The host establishes the clipping boundary and NestedPanel supplies absolute positioning internally. Keep the sticky header outside Scroll.View so only the article becomes the native overflow surface.

## Tailwind CSS v4

```css
@import "tailwindcss";
```

```tsx
// NestedPortalHost owns relative clipping; utilities own the authored surface.
<Sheet.NestedPortalHost asChild>
<Sheet.Content className="isolate flex h-[min(48rem,calc(var(--velvet-100lvh)_-_2rem))] min-h-0 w-[min(64rem,calc(100vw_-_2rem))] flex-col rounded-[28px] bg-white max-[700px]:h-[var(--velvet-100lvh)] max-[700px]:w-screen max-[700px]:rounded-none">
  <header className="shrink-0">...</header>

  <Sheet.Root open={articleOpen} onOpenChange={setArticleOpen}>
    <Scroll.Root className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Scroll.View className="h-full min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
        <Scroll.Content>...</Scroll.Content>
      </Scroll.View>
    </Scroll.Root>

    <Sheet.NestedPanel side="right" nativeEdgeSwipePrevention className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[inherit] bg-white">
          <header className="shrink-0">...</header>
          <Scroll.Root className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Scroll.View
              className="h-full min-h-0 overflow-y-auto [scrollbar-gutter:stable]"
              scrollGestureTrap={{ y: true }}
            >
              <Scroll.Content><Article /></Scroll.Content>
            </Scroll.View>
          </Scroll.Root>
    </Sheet.NestedPanel>
  </Sheet.Root>
</Sheet.Content>
</Sheet.NestedPortalHost>
```

Keep `import "@velvetui/react/sheet.css"` in the JavaScript entry. Tailwind owns the authored surface; Velvet owns gesture tracks, portal mechanics, modality, Scroll coordination, and the nested View's structural inline position. That last detail avoids Tailwind v4's layered `absolute` utility losing to an unlayered fixed rule.

## Live package examples

- [Run the embedded plain CSS recipe](/recipes/nested-modal-navigation) or [open its StackBlitz](https://stackblitz.com/edit/vitejs-vite-dptpaa1d?file=App.jsx&view=preview).
- [Run the embedded Tailwind CSS v4 recipe](/recipes/nested-modal-navigation-tailwind-v4) or [open its StackBlitz](https://stackblitz.com/edit/vitejs-vite-rrfjnly7?file=App.jsx,vite.config.js&view=preview).

Both projects install `@velvetui/react` from npm. They do not alias the package to repository source or copy Velvet's internals into the example.

## Rules that prevent the common failures

- Put the parent `Sheet.Title` and `Sheet.Description` before the child `Sheet.Root`; labels always register with the nearest Root.
- Use exactly one `Scroll.Root → Scroll.View → Scroll.Content` chain per scrolling layer.
- Give every Back, Close, and row trigger `type="button"`; `href="#"` causes page jumps and an implicit submit button can trigger a form.
- Never use `scrollGestureTrap={true}` for a full-page horizontal child. Leave it `false`, or use `{ y: true }` to contain only vertical chaining while horizontal swipe-back remains available over paragraphs, cards, and controls.
- Style the scrollbar on `Scroll.View`; it is the real browser overflow element.
- Control both roots only when a child action must close the complete flow. A child `Sheet.Close` should otherwise dismiss only the child.

## Mobile check

Test after a cold reload on a phone. Scroll the article from the middle, swipe back beginning directly over text, use Back to preserve the parent modal, use Close to leave both layers, and confirm the page and parent scroll positions never change.
