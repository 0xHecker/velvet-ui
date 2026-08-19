# Scroll coordination

> A scrollable sheet hands a drag to the sheet only when its internal Scroll.View reaches the matching boundary.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/scroll

Use Scroll whenever content can move independently of its sheet. The component prevents a drag from scrolling content and dismissing the sheet at the same time.

## The common pattern

```tsx
<Sheet.View side="bottom" tracks="auto">
  <Sheet.Content asChild>
    <Scroll.Root asChild>
      <Scroll.View className="sheet-scroll">
        <Scroll.Content className="sheet-body">
          <Article />
        </Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>
```

The element with `Scroll.View` is the real overflow container. Give it a definite height and `overflow-y: auto` through product or composition CSS.

## Avoid these handoff bugs

- Do not place another vertical overflow container between View and Content.
- Do not set `pointer-events: none` on the scroller.
- Do not force the native sheet runway to show a scrollbar.
- Do not mirror scrollTop into React state for gesture policy.
- Do not disable overscroll globally without testing nested sheets.

## Continue to the full API

The Scroll API guide covers imperative scrolling, progress callbacks, horizontal axes, keyboard safe areas, and focus policy.
