import { cloneElement, forwardRef, isValidElement } from "react";
import { mapSlottedChildren } from "./core/Slot.jsx";
import { Scroll } from "./Scroll.jsx";
import { Sheet } from "./Sheet.jsx";

const DEFAULT_SNAP_POINTS = [
  "88px",
  "min(720px, calc(var(--velvet-100lvh, 100dvh) - 24px))",
];

const Trigger = forwardRef(function PersistentSheetTrigger(
  props,
  forwardedRef
) {
  return (
    <Sheet.Trigger
      ref={forwardedRef}
      data-velvet-persistent-sheet="trigger"
      {...props}
    />
  );
});

const Content = forwardRef(function PersistentSheetContent(
  {
    children,
    portalProps,
    view: viewSlot,
    viewProps,
    backdrop = false,
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
      : backdrop === true
        ? <Sheet.Backdrop {...backdropProps} data-velvet-persistent-sheet="backdrop" />
        : isValidElement(backdrop) && backdrop.type === Sheet.Backdrop
          ? cloneElement(backdrop, {
              ...backdropProps,
              ...backdrop.props,
              "data-velvet-persistent-sheet": "backdrop",
            })
          : (
              <Sheet.Backdrop
                {...backdropProps}
                asChild
                data-velvet-persistent-sheet="backdrop"
              >
                {backdrop}
              </Sheet.Backdrop>
            );
  const handleNode =
    handle === false || handle == null
      ? null
      : isValidElement(handle)
        ? handle.type === Sheet.Handle
          ? cloneElement(handle, {
              ...handleProps,
              ...handle.props,
              "data-velvet-persistent-sheet": "handle",
            })
          : (
              <Sheet.Handle
                {...handleProps}
                asChild
                data-velvet-persistent-sheet="handle"
              >
                {handle}
              </Sheet.Handle>
            )
        : (
            <Sheet.Handle
              {...handleProps}
              data-velvet-persistent-sheet="handle"
            />
          );
  const backgroundNode =
    bleedingBackground === false || bleedingBackground == null
      ? null
      : bleedingBackground === true
        ? (
            <Sheet.BleedingBackground
              {...bleedingBackgroundProps}
              data-velvet-persistent-sheet="background"
            />
          )
        : isValidElement(bleedingBackground) &&
            bleedingBackground.type === Sheet.BleedingBackground
          ? cloneElement(bleedingBackground, {
              ...bleedingBackgroundProps,
              ...bleedingBackground.props,
              "data-velvet-persistent-sheet": "background",
            })
          : (
              <Sheet.BleedingBackground
                {...bleedingBackgroundProps}
                asChild
                data-velvet-persistent-sheet="background"
              >
                {bleedingBackground}
              </Sheet.BleedingBackground>
            );
  const renderBody = (authoredChildren) => scroll ? (
    <Scroll.Root
      {...scrollRootProps}
      data-velvet-persistent-sheet="scroll-root"
    >
      <Scroll.View
        {...scrollViewProps}
        data-velvet-persistent-sheet="scroll"
      >
        <Scroll.Content
          {...scrollContentProps}
          data-velvet-persistent-sheet="scroll-content"
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
    "PersistentSheet.Content"
  );
  const contentNode = (
    <Sheet.Content
      ref={forwardedRef}
      {...contentProps}
      data-velvet-persistent-sheet="content"
    >
      {renderedContentChildren}
    </Sheet.Content>
  );
  const renderedViewChildren = viewSlot
    ? mapSlottedChildren(
        true,
        viewSlot,
        (viewChildren) => (
          <>
            {viewChildren}
            {backdropNode}
            {contentNode}
          </>
        ),
        "PersistentSheet.Content view slot"
      )
    : (
        <>
          {backdropNode}
          {contentNode}
        </>
      );

  return (
    <Sheet.Portal {...portalProps}>
      <Sheet.View
        side="bottom"
        tracks="auto"
        snapPoints={DEFAULT_SNAP_POINTS}
        dismissible={false}
        modal={false}
        nativeEdgeSwipePrevention
        {...viewProps}
        asChild={Boolean(viewSlot)}
        data-velvet-persistent-sheet="view"
      >
        {renderedViewChildren}
      </Sheet.View>
    </Sheet.Portal>
  );
});

export const PersistentSheet = {
  Root: Sheet.Root,
  Trigger,
  Content,
  Close: Sheet.Close,
  Step: Sheet.Step,
  Title: Sheet.Title,
  Description: Sheet.Description,
  Handle: Sheet.Handle,
};
