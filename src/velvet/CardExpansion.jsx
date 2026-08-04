import { cloneElement, forwardRef, isValidElement } from "react";
import { Scroll } from "./Scroll.jsx";
import { Sheet } from "./Sheet.jsx";
import { SheetMorph } from "./SheetMorph.jsx";
import { ThemeBackdrop } from "./ThemeBackdrop.jsx";

const CARD_BACKDROP_TRAVEL = {
  opacity: ({ progress }) => Math.min(Math.max(progress, 0) * 0.5, 0.5),
};

const Trigger = forwardRef(function CardExpansionTrigger(props, forwardedRef) {
  return (
    <Sheet.Trigger
      ref={forwardedRef}
      data-velvet-card-expansion="trigger"
      {...props}
    />
  );
});

const Content = forwardRef(function CardExpansionContent(
  {
    children,
    portalProps,
    viewProps,
    backdrop = true,
    backdropProps,
    scroll = true,
    scrollRootProps,
    scrollViewProps,
    scrollContentProps,
    ...contentProps
  },
  forwardedRef
) {
  const backdropNode =
    backdrop === false
      ? null
      : isValidElement(backdrop)
        ? cloneElement(backdrop, {
            ...backdrop.props,
            "data-velvet-card-expansion": "backdrop",
          })
        : (
            <ThemeBackdrop
              themeColor="auto"
              travelAnimation={CARD_BACKDROP_TRAVEL}
              {...backdropProps}
              data-velvet-card-expansion="backdrop"
            />
          );

  const body = scroll ? (
    <Scroll.Root {...scrollRootProps} data-velvet-card-expansion="scroll-root">
      <Scroll.View {...scrollViewProps} data-velvet-card-expansion="scroll">
        <Scroll.Content
          {...scrollContentProps}
          data-velvet-card-expansion="scroll-content"
        >
          {children}
        </Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  ) : children;

  return (
    <Sheet.Portal {...portalProps}>
      <Sheet.View
        side="center"
        tracks={["top", "bottom"]}
        swipeOvershoot={false}
        nativeEdgeSwipePrevention
        {...viewProps}
        data-velvet-card-expansion="view"
      >
        {backdropNode}
        <SheetMorph.Content
          ref={forwardedRef}
          from="trigger"
          {...contentProps}
          data-velvet-card-expansion="content"
        >
          {body}
        </SheetMorph.Content>
      </Sheet.View>
    </Sheet.Portal>
  );
});

export const CardExpansion = {
  Root: Sheet.Root,
  Trigger,
  Content,
  Close: Sheet.Close,
  Title: Sheet.Title,
  Description: Sheet.Description,
};
