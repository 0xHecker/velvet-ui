import { cloneElement, forwardRef, isValidElement } from "react";
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
    viewProps,
    backdrop = true,
    backdropProps,
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
  const backdropNode =
    backdrop === false
      ? null
      : isValidElement(backdrop)
        ? cloneElement(backdrop, {
            ...backdrop.props,
            "data-velvet-bottom-sheet": "backdrop",
          })
        : (
            <ThemeBackdrop
              themeColor="auto"
              travelAnimation={BOTTOM_SHEET_BACKDROP}
              {...backdropProps}
              data-velvet-bottom-sheet="backdrop"
            />
          );
  const handleNode =
    handle === false
      ? null
      : isValidElement(handle)
        ? cloneElement(handle, {
            ...handle.props,
            "data-velvet-bottom-sheet": "handle",
          })
        : (
            <Sheet.Handle
              {...handleProps}
              data-velvet-bottom-sheet="handle"
            />
          );
  const body = scroll ? (
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
        nativeEdgeSwipePrevention
        {...viewProps}
        data-velvet-bottom-sheet="view"
      >
        {backdropNode}
        <Sheet.Content
          ref={forwardedRef}
          {...contentProps}
          data-velvet-bottom-sheet="content"
        >
          <Sheet.BleedingBackground
            {...bleedingBackgroundProps}
            data-velvet-bottom-sheet="background"
          />
          {handleNode}
          {body}
        </Sheet.Content>
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
