# Sheet stacks

> SheetStack coordinates layering, backdrop ownership, focus restoration, and depth transforms for any number of nested sheets.

Web: https://velvetui.co/docs/sheet-stack

SheetStack is a document-local coordinator for nested layers. It does not impose a two-sheet ceiling: each registered sheet publishes its progress, every layer receives the accumulated progress above it, and only the frontmost modal owns dismissal and focus.

## Primitive stack

```tsx
<SheetStack.Root>
  <SheetStack.Outlet stackingAnimation={{
    scale: ({ progress }) => Math.max(0.78, 1 - progress * 0.05),
    translateY: ({ progress }) => `min(${progress * 14}px, 84px)`,
    borderRadius: ({ progress }) => `min(${progress * 3}px, 42px)`,
  }}>
    <Application />
  </SheetStack.Outlet>

  <FirstSheet />
</SheetStack.Root>
```

Nest the next `Sheet.Root` inside the content that launches it. Registration order, not a hard-coded z-index list, defines the stack.

## Arbitrary depth

```tsx
function NestedLevel({ level = 1 }) {
  return (
    <Sheet.Root>
      <Sheet.Trigger>Open level {level}</Sheet.Trigger>
      <Sheet.Panel side="bottom">
        <Sheet.Title>Level {level}</Sheet.Title>
        {level < 10 && <NestedLevel level={level + 1} />}
      </Sheet.Panel>
    </Sheet.Root>
  );
}
```

Ten open layers remain bounded only if the visual map is bounded. Clamp translation, scale, radius, brightness, and dimming; never multiply one unbounded transform by raw depth.

## Depth Sheet already bounds ten layers

DepthSheet joins the nearest stack automatically and reuses its portal host. Its default stacking map clamps translation at `80px`, scale at `0.76`, radius at `42px`, and brightness at `0.7`.

```tsx
<DepthSheet.Root>
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
</DepthSheet.Root>
```

## Ownership rules

- Use one SheetStack.Root per independent application region.
- Do not create a new stack root at every nested level.
- Let nested DepthSheet roots discover the nearest coordinator.
- Render third-party portals through ExternalOverlay when they belong to the front sheet.
- Keep background actions in the backing page; modality makes them inert while a modal layer is active.
- Give every layer a unique title and a reachable close path.

## Stack API

| Part | Props |
| --- | --- |
| `SheetStack.Root` | DOM props and `asChild` |
| `SheetStack.Outlet` | DOM props, `asChild`, `stackingAnimation` |
| `Sheet.Content` | `stackingAnimation` for the sheet surface under later layers |
| `DepthSheet.Page` | bounded Depth stacking by default |
