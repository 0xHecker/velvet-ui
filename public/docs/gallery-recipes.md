# Gallery recipes

> The gallery demonstrates production-shaped layouts such as bottom sheets, drawers, modals, detents, lightboxes, and persistent surfaces.

Web: https://velvetui.co/docs/gallery-recipes

Every homepage card is built from the public package. The concise recipes explain the reusable structure; the source links below are generated from the exact live JSX and CSS, so the documentation cannot silently drift away from the gallery.

## Exact live source

1. [Bottom Sheet exact JSX and CSS](/docs/examples/bottom-sheet.md)
2. [Modal Dialog exact JSX and CSS](/docs/examples/modal.md)
3. [Navigation Drawer exact JSX and CSS](/docs/examples/sidebar.md)
4. [Detent Sheet exact JSX and CSS](/docs/examples/detent.md)
5. [Top Sheet exact JSX and CSS](/docs/examples/top-sheet.md)
6. [Scrollable Sheet exact JSX and CSS](/docs/examples/long-sheet.md)
7. [Stacked Sheets exact JSX and CSS](/docs/examples/stacked.md)
8. [Detached Sheet exact JSX and CSS](/docs/examples/detached.md)
9. [Full-Screen Sheet exact JSX and CSS](/docs/examples/page-from-bottom.md)
10. [Depth Sheet exact JSX and CSS](/docs/examples/depth.md)
11. [Lightbox exact JSX and CSS](/docs/examples/lightbox.md)
12. [Parallax Sheet exact JSX and CSS](/docs/examples/parallax.md)
13. [Side Sheet exact JSX and CSS](/docs/examples/page.md)
14. [Keyboard-Aware Sheet exact JSX and CSS](/docs/examples/keyboard.md)
15. [Card Expansion exact JSX and CSS](/docs/examples/card.md)
16. [Persistent Sheet exact JSX and CSS](/docs/examples/persistent.md)

The raw files include playground icons, image helpers, and local import paths because they are the real implementation. Replace those helpers with product assets and use the package imports from the concise recipe.

## 1. Bottom Sheet

```tsx
<BottomSheet.Root>
  <BottomSheet.Trigger>View stay</BottomSheet.Trigger>
  <BottomSheet.Content>
    <BottomSheet.Title>Five nights in Tulum</BottomSheet.Title>
    <StayDetails />
    <BottomSheet.Close>Done</BottomSheet.Close>
  </BottomSheet.Content>
</BottomSheet.Root>
```

## 2. Modal Dialog

```tsx
<Sheet.Root>
  <Sheet.Trigger>Invite people</Sheet.Trigger>
  <Sheet.Panel
    side="center"
    viewProps={{ tracks: ["top", "bottom"], swipeOvershoot: false }}
  >
    <Sheet.Title>Join Atlas Redesign?</Sheet.Title>
    <InviteForm />
  </Sheet.Panel>
</Sheet.Root>
```

## 3. Navigation Drawer

```tsx
<Sheet.Root>
  <Sheet.Trigger>Menu</Sheet.Trigger>
  <Sheet.Panel side="left" className="navigation-drawer">
    <Sheet.Title>Workspace navigation</Sheet.Title>
    <Navigation />
  </Sheet.Panel>
</Sheet.Root>
```

## 4. Detent Sheet

```tsx
<Sheet.Root defaultSnap={1}>
  <Sheet.Trigger>Open queue</Sheet.Trigger>
  <Sheet.Panel side="bottom" snapPoints={["92px", "72lvh"]}>
    <Sheet.Step direction="up">Expand</Sheet.Step>
    <Queue />
  </Sheet.Panel>
</Sheet.Root>
```

## 5. Top Sheet

```tsx
<Sheet.Root>
  <Sheet.Trigger>Notifications</Sheet.Trigger>
  <Sheet.Panel side="top">
    <Sheet.Title>Team inbox</Sheet.Title>
    <Notifications />
  </Sheet.Panel>
</Sheet.Root>
```

## 6. Scrollable Sheet

```tsx
<Sheet.Root>
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
</Sheet.Root>
```

## 7. Stacked Sheets

```tsx
<SheetStack.Root>
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
</SheetStack.Root>
```

Repeat the nested Root pattern for any number of layers. The frontmost modal owns Escape, focus, and outside interaction.

## 8. Detached Sheet

```tsx
<Sheet.Panel
  side="center"
  className="detached-sheet"
  viewProps={{ tracks: ["top", "bottom"] }}
>
  <WatchDetails />
</Sheet.Panel>
```

```css
.detached-sheet {
  width: min(92vw, 38rem);
  max-height: calc(100dvh - 32px);
  border-radius: 28px;
}
```

## 9. Full-Screen Sheet

```tsx
<Sheet.Panel side="bottom" className="full-screen-sheet">
  <Sheet.Title>New note</Sheet.Title>
  <Editor />
</Sheet.Panel>
```

```css
.full-screen-sheet {
  width: 100%;
  height: var(--velvet-100lvh);
  max-height: none;
}
```

## 10. Depth Sheet

```tsx
<DepthSheet.Root>
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
</DepthSheet.Root>
```

## 11. Lightbox

```tsx
<Lightbox.Root>
  <Lightbox.Trigger asChild><button><Thumbnail /></button></Lightbox.Trigger>
  <Lightbox.Content>
    <Lightbox.Title>Golden hour</Lightbox.Title>
    <Gallery />
    <Lightbox.Close aria-label="Close">×</Lightbox.Close>
  </Lightbox.Content>
</Lightbox.Root>
```

## 12. Parallax Sheet

```tsx
<Sheet.View side="bottom" tracks="auto">
  <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.3] }} />
  <Sheet.Outlet travelAnimation={{
    transform: ({ tween }) => "translateY(" + tween(0, -48) + "px)",
  }}>
    <Cover />
  </Sheet.Outlet>
  <Sheet.Content><Article /></Sheet.Content>
</Sheet.View>
```

## 13. Side Sheet

```tsx
<Sheet.Root>
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
</Sheet.Root>
```

The scrollable body leaves `scrollGestureTrap` at its default `false`, so a horizontal drag anywhere on the page can dismiss the right-side sheet as back navigation.

## 14. Keyboard-Aware Sheet

```tsx
<Sheet.View side="bottom" tracks="auto">
  <Sheet.Content asChild>
    <Scroll.Root asChild>
      <Scroll.View safeArea="visual-viewport">
        <Scroll.Content><Conversation /><Composer /></Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>
```

## 15. Card Expansion

```tsx
<CardExpansion.Root>
  <CardExpansion.Trigger asChild><article><StoryCard /></article></CardExpansion.Trigger>
  <CardExpansion.Content>
    <CardExpansion.Title>Designing motion that feels real</CardExpansion.Title>
    <Story />
    <CardExpansion.Close>Done</CardExpansion.Close>
  </CardExpansion.Content>
</CardExpansion.Root>
```

## 16. Persistent Sheet

```tsx
<PersistentSheet.Root defaultOpen defaultSnap={1}>
  <PersistentSheet.Content>
    <PersistentSheet.Title>Midnight Drive</PersistentSheet.Title>
    <MiniPlayer />
    <PersistentSheet.Step direction="up">Open queue</PersistentSheet.Step>
  </PersistentSheet.Content>
</PersistentSheet.Root>
```

## Required imports

```tsx
import { Sheet, SheetStack, Scroll } from "@velvetui/react";
import { BottomSheet } from "@velvetui/react/bottom-sheet";
import { CardExpansion } from "@velvetui/react/card-expansion";
import { DepthSheet } from "@velvetui/react/depth-sheet";
import { Lightbox } from "@velvetui/react/lightbox";
import { PersistentSheet } from "@velvetui/react/persistent-sheet";
```
