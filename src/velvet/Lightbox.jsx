import { cloneElement, forwardRef, isValidElement } from "react";
import { Sheet } from "./Sheet.jsx";
import { ThemeBackdrop } from "./ThemeBackdrop.jsx";

const LIGHTBOX_BACKDROP = {
  opacity: ({ progress }) => Math.min(Math.max(progress, 0) * 0.94, 0.94),
};

const LIGHTBOX_CONTENT = {
  opacity: ({ progress }) => Math.min(Math.max(progress, 0) * 1.8, 1),
  transform: ({ tween }) => `scale(${tween(0.82, 1)})`,
};

const Trigger = forwardRef(function LightboxTrigger(props, forwardedRef) {
  return (
    <Sheet.Trigger
      ref={forwardedRef}
      data-velvet-lightbox="trigger"
      {...props}
    />
  );
});

const Content = forwardRef(function LightboxContent(
  {
    children,
    portalProps,
    viewProps,
    backdrop = true,
    backdropProps,
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
            "data-velvet-lightbox": "backdrop",
          })
        : (
            <ThemeBackdrop
              themeColor="#000"
              travelAnimation={LIGHTBOX_BACKDROP}
              {...backdropProps}
              data-velvet-lightbox="backdrop"
            />
          );

  return (
    <Sheet.Portal {...portalProps}>
      <Sheet.View
        side="center"
        tracks={["top", "bottom"]}
        swipeOvershoot={false}
        nativeEdgeSwipePrevention
        {...viewProps}
        data-velvet-lightbox="view"
      >
        {backdropNode}
        <Sheet.Content
          ref={forwardedRef}
          travelAnimation={LIGHTBOX_CONTENT}
          {...contentProps}
          data-velvet-lightbox="content"
        >
          {children}
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  );
});

export const Lightbox = {
  Root: Sheet.Root,
  Trigger,
  Content,
  Close: Sheet.Close,
  Title: Sheet.Title,
  Description: Sheet.Description,
};
