import { cloneElement, forwardRef, isValidElement } from "react";
import { mapSlottedChildren } from "./core/Slot.jsx";
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
    view: viewSlot,
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
    backdrop === false || backdrop == null
      ? null
      : isValidElement(backdrop)
        ? backdrop.type === Sheet.Backdrop || backdrop.type === ThemeBackdrop
          ? cloneElement(backdrop, {
              travelAnimation: CARD_BACKDROP_TRAVEL,
              ...backdropProps,
              ...backdrop.props,
              "data-velvet-card-expansion": "backdrop",
            })
          : (
              <ThemeBackdrop
                themeColor="auto"
                travelAnimation={CARD_BACKDROP_TRAVEL}
                {...backdropProps}
                asChild
                data-velvet-card-expansion="backdrop"
              >
                {backdrop}
              </ThemeBackdrop>
            )
        : (
            <ThemeBackdrop
              themeColor="auto"
              travelAnimation={CARD_BACKDROP_TRAVEL}
              {...backdropProps}
              data-velvet-card-expansion="backdrop"
            />
          );

  const renderBody = (authoredChildren) => scroll ? (
    <Scroll.Root {...scrollRootProps} data-velvet-card-expansion="scroll-root">
      <Scroll.View {...scrollViewProps} data-velvet-card-expansion="scroll">
        <Scroll.Content
          {...scrollContentProps}
          data-velvet-card-expansion="scroll-content"
        >
          {authoredChildren}
        </Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  ) : authoredChildren;
  const renderedContentChildren = mapSlottedChildren(
    contentProps.asChild,
    children,
    renderBody,
    "CardExpansion.Content"
  );
  const contentNode = (
    <SheetMorph.Content
      ref={forwardedRef}
      from="trigger"
      {...contentProps}
      data-velvet-card-expansion="content"
    >
      {renderedContentChildren}
    </SheetMorph.Content>
  );
  const authoredViewChildren = (
    <>
      {backdropNode}
      {contentNode}
    </>
  );
  const renderedViewChildren = viewSlot
    ? mapSlottedChildren(
        true,
        viewSlot,
        (viewChildren) => (
          <>
            {viewChildren}
            {authoredViewChildren}
          </>
        ),
        "CardExpansion.Content view slot"
      )
    : authoredViewChildren;

  return (
    <Sheet.Portal {...portalProps}>
      <Sheet.View
        side="center"
        tracks={["top", "bottom"]}
        swipeOvershoot={false}
        nativeEdgeSwipePrevention
        {...viewProps}
        asChild={Boolean(viewSlot)}
        data-velvet-card-expansion="view"
      >
        {renderedViewChildren}
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
