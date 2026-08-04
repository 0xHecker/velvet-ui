import { cloneElement, forwardRef, isValidElement } from "react";
import { mapSlottedChildren } from "./core/Slot.jsx";
import { Scroll } from "./Scroll.jsx";
import { Sheet } from "./Sheet.jsx";
import { ThemeBackdrop } from "./ThemeBackdrop.jsx";

const BOTTOM_SHEET_BACKDROP = {
  opacity: ({ progress }) => Math.min(Math.max(progress, 0) * 0.42, 0.42),
};

const Trigger = forwardRef(function BottomSheetTrigger(props, forwardedRef) {
  return (
    <Sheet.Trigger
      ref={forwardedRef}
      data-velvet-bottom-sheet="trigger"
      {...props}
    />
  );
});

const Content = forwardRef(function BottomSheetContent(
  {
    children,
    portalProps,
    view: viewSlot,
    viewProps,
    backdrop = true,
    backdropProps,
    handle = true,
    handleProps,
    bleedingBackground = true,
    bleedingBackgroundProps,
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
              travelAnimation: BOTTOM_SHEET_BACKDROP,
              ...backdropProps,
              ...backdrop.props,
              "data-velvet-bottom-sheet": "backdrop",
            })
          : (
              <ThemeBackdrop
                themeColor="auto"
                travelAnimation={BOTTOM_SHEET_BACKDROP}
                {...backdropProps}
                asChild
                data-velvet-bottom-sheet="backdrop"
              >
                {backdrop}
              </ThemeBackdrop>
            )
        : (
            <ThemeBackdrop
              themeColor="auto"
              travelAnimation={BOTTOM_SHEET_BACKDROP}
              {...backdropProps}
              data-velvet-bottom-sheet="backdrop"
            />
          );
  const handleNode =
    handle === false || handle == null
      ? null
      : isValidElement(handle)
        ? handle.type === Sheet.Handle
          ? cloneElement(handle, {
              ...handleProps,
              ...handle.props,
              "data-velvet-bottom-sheet": "handle",
            })
          : (
              <Sheet.Handle
                {...handleProps}
                asChild
                data-velvet-bottom-sheet="handle"
              >
                {handle}
              </Sheet.Handle>
            )
        : (
            <Sheet.Handle
              {...handleProps}
              data-velvet-bottom-sheet="handle"
            />
          );
  const backgroundNode =
    bleedingBackground === false || bleedingBackground == null
      ? null
      : bleedingBackground === true
        ? (
            <Sheet.BleedingBackground
              {...bleedingBackgroundProps}
              data-velvet-bottom-sheet="background"
            />
          )
        : isValidElement(bleedingBackground) &&
            bleedingBackground.type === Sheet.BleedingBackground
          ? cloneElement(bleedingBackground, {
              ...bleedingBackgroundProps,
              ...bleedingBackground.props,
              "data-velvet-bottom-sheet": "background",
            })
          : (
              <Sheet.BleedingBackground
                {...bleedingBackgroundProps}
                asChild
                data-velvet-bottom-sheet="background"
              >
                {bleedingBackground}
              </Sheet.BleedingBackground>
            );
  const renderBody = (authoredChildren) => scroll ? (
    <Scroll.Root
      {...scrollRootProps}
      data-velvet-bottom-sheet="scroll-root"
    >
      <Scroll.View
        {...scrollViewProps}
        data-velvet-bottom-sheet="scroll"
      >
        <Scroll.Content
          {...scrollContentProps}
          data-velvet-bottom-sheet="scroll-content"
        >
          {authoredChildren}
        </Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  ) : authoredChildren;
  const renderedContentChildren = mapSlottedChildren(
    contentProps.asChild,
    children,
    (authoredChildren) => (
      <>
        {backgroundNode}
        {handleNode}
        {renderBody(authoredChildren)}
      </>
    ),
    "BottomSheet.Content"
  );
  const contentNode = (
    <Sheet.Content
      ref={forwardedRef}
      {...contentProps}
      data-velvet-bottom-sheet="content"
    >
      {renderedContentChildren}
    </Sheet.Content>
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
        "BottomSheet.Content view slot"
      )
    : authoredViewChildren;

  return (
    <Sheet.Portal {...portalProps}>
      <Sheet.View
        side="bottom"
        tracks="auto"
        nativeEdgeSwipePrevention
        {...viewProps}
        asChild={Boolean(viewSlot)}
        data-velvet-bottom-sheet="view"
      >
        {renderedViewChildren}
      </Sheet.View>
    </Sheet.Portal>
  );
});

export const BottomSheet = {
  Root: Sheet.Root,
  Trigger,
  Content,
  Close: Sheet.Close,
  Step: Sheet.Step,
  Title: Sheet.Title,
  Description: Sheet.Description,
  Handle: Sheet.Handle,
};
