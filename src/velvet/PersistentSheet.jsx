import { cloneElement, forwardRef, isValidElement } from "react";
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
    viewProps,
    handle = true,
    handleProps,
    bleedingBackgroundProps,
    scroll = true,
    scrollRootProps,
    scrollViewProps,
    scrollContentProps,
    ...contentProps
  },
  forwardedRef
) {
  const handleNode =
    handle === false
      ? null
      : isValidElement(handle)
        ? cloneElement(handle, {
            ...handle.props,
            "data-velvet-persistent-sheet": "handle",
          })
        : (
            <Sheet.Handle
              {...handleProps}
              data-velvet-persistent-sheet="handle"
            />
          );
  const body = scroll ? (
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
          {children}
        </Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  ) : children;

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
        data-velvet-persistent-sheet="view"
      >
        <Sheet.Content
          ref={forwardedRef}
          {...contentProps}
          data-velvet-persistent-sheet="content"
        >
          <Sheet.BleedingBackground
            {...bleedingBackgroundProps}
            data-velvet-persistent-sheet="background"
          />
          {handleNode}
          {body}
        </Sheet.Content>
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
