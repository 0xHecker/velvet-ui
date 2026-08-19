# Scroll API

> Coordinate nested scrolling, virtual keyboards, focus, progress, and imperative spring scrolling.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/scroll-api

Scroll coordinates long content, virtual keyboards, programmatic travel, and the gesture handoff between a nested scroller and its parent sheet.

## Primitive tree

```tsx
<Scroll.Root componentRef={scrollApi}>
  <Scroll.View
    axis="y"
    safeArea="visual-viewport"
    onScrollProgress={({ progress, distance }) => {}}
  >
    <Scroll.Content><Article /></Scroll.Content>
  </Scroll.View>
</Scroll.Root>
```

When Root and View render as separate elements, Root establishes the flex layout and View shrinks to the available height. Give Root a constrained height or place it in a constrained flex region; View then owns the overflow. With `asChild`, the merged View is the scroll container itself.

## Scroll.Root and imperative API

`componentRef` receives `getProgress`, `getDistance`, `getAvailableDistance`, `scrollTo`, and `scrollBy`.

```tsx
scrollApi.current?.scrollTo({
  progress: 1,
  animationSettings: "smooth",
});

scrollApi.current?.scrollBy({
  distance: -160,
  animationSettings: { stiffness: 420, damping: 40 },
});
```

## Scroll.View props

| Prop | Type | Default |
| --- | --- | --- |
| `axis` | `x \| y` | `y` |
| `safeArea` | none, layout-viewport, visual-viewport | visual-viewport |
| `scrollGestureTrap` | boolean or axis object | false |
| `scrollGestureOvershoot` | boolean | true |
| `onScrollProgress` | progress callback | — |
| `onFocusInside` | policy object or callback | — |
| `nativeFocusScrollPrevention` | boolean | true |

## Scroll.Trigger

```tsx
<Scroll.Trigger action={{
  type: "scroll-to",
  progress: 1,
  animationSettings: "snappy",
}}>
  Jump to end
</Scroll.Trigger>
```

The action type is `scroll-to` or `scroll-by`. Supply either `distance` in pixels or normalized `progress`.

## Sheet handoff

```tsx
<Sheet.View side="bottom" tracks="auto">
  <Sheet.Content asChild>
    <Scroll.Root asChild>
      <Scroll.View><Scroll.Content><Feed /></Scroll.Content></Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>
```

With `tracks="auto"`, native boundary chaining chooses the direction without changing sheet geometry while content scrolls. A downward drag dismisses only after the scroller reaches its start; an upward drag can hand off at the end.

## Swipe-back side sheets

```tsx
<Sheet.View side="right" nativeEdgeSwipePrevention>
  <Sheet.Content className="Page-content">
    <header><Sheet.Close>Back</Sheet.Close></header>
    <Scroll.Root>
      <Scroll.View>
        <Scroll.Content><Page /></Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  </Sheet.Content>
</Sheet.View>
```

Leave `scrollGestureTrap` unset on a scrollable side-sheet page. Its default `false` explicitly applies `overscroll-behavior: auto`, so vertical movement stays with the content while a horizontal drag hands off to the sheet for swipe-back navigation. Setting `scrollGestureTrap` (or overriding the inline style with `contain`) on the page-wide Scroll.View prevents that handoff, so reserve containment for an isolated region that must retain the gesture.

`nativeEdgeSwipePrevention` only resolves the conflict with browser history navigation. It does not disable Velvet's own swipe gesture.

## Keyboard-safe forms

Use `safeArea="visual-viewport"` and include `interactive-widget=resizes-content` in the viewport meta tag. Keep the focused field and fixed composer inside the same Scroll.View.

Scroll restoration is scoped to text-entry focus that recorded an origin. Blurring a button, link, checkbox, or sheet trigger never resets the View to the top.

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
/>
```
