# Bring your own components

> Keep Velvet's gestures, focus, accessibility, and motion while your design system owns every visible element.

Web: https://velvetui.co/docs/custom-components

Use Velvet for state, gestures, focus, accessibility, and motion while your design system owns every visible element. Buttons, surfaces, headings, backdrops, handles, and the outer View can all remain your components.

## Use your own buttons

```tsx
const ProductButton = forwardRef(function ProductButton(
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
</Sheet.Root>
```

`Trigger`, `Close`, `Step`, and `Handle` render a button by default. With `asChild`, your element is the button; Velvet composes its ref, action, disabled state, and ARIA attributes onto that same node.

## Replace the entire Panel and its visual parts

```tsx
<Sheet.Root>
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
</Sheet.Root>
```

`Sheet.Panel asChild` makes `ProductSurface` the real content node. The `view`, `backdrop`, and `handle` elements become the real behavioral nodes too. Children authored inside a custom View are preserved before Velvet's backdrop and surface layers.

## Do the same with a styled composition

```tsx
import { BottomSheet } from "@velvetui/react/bottom-sheet";
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
</BottomSheet.Root>
```

The composition keeps its placement, scroll handoff, travel animation, and data hooks. Your elements keep their content, class names, inline styles, handlers, and refs. Use `false` or `null` for `backdrop`, `handle`, or `bleedingBackground` to remove that part; use `true` for Velvet's default part.

## The asChild contract

Pass exactly one non-Fragment React element. A custom React component must forward the received ref and all DOM props to its final DOM node; React 18 consumers should use `forwardRef`. Velvet composes refs, concatenates class names, and lets the child's inline style override the same Velvet style key.

The child's event handler runs first. Calling `event.preventDefault()` intentionally cancels Velvet's action, which is useful for validation or unsaved-change gates. Replacing or swallowing the received handler makes a control appear interactive without opening or closing the sheet, so prop spreading is part of the component contract.

```tsx
const ProductSurface = forwardRef(function ProductSurface(
  { children, ...domProps },
  ref,
) {
  return <section ref={ref} {...domProps}>{children}</section>;
});
```

## Bring your own layout and scroll

Set `scroll={false}` on BottomSheet, PersistentSheet, or CardExpansion when your surface owns its layout. If long content should hand a boundary swipe to the sheet, compose `Scroll.Root`, `Scroll.View`, and `Scroll.Content` yourself. DepthSheet keeps coordinated scrolling as part of its navigation contract; primitive Sheet gives complete control over the tree.

Use `viewProps`, `backdropProps`, `handleProps`, `bleedingBackgroundProps`, `scrollRootProps`, `scrollViewProps`, and `scrollContentProps` for behavior or props on a specific layer. Use the dedicated `view={<YourView />}` slot—not `viewProps.asChild`—to replace the outer View element.

## Fast debugging checklist

- The `asChild` value is one element, not a Fragment or sibling list.
- The custom component forwards `ref`, `children`, event handlers, ARIA/data attributes, className, and style.
- A click handler is not calling `preventDefault()` unintentionally.
- Action controls are buttons, or have equivalent keyboard semantics; avoid `href="#"`.
- Structural `sheet.css` is still imported even when every visible part is custom.
- Use `scroll={false}` only when your replacement layout handles overflow intentionally.
