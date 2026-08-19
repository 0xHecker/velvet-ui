import { cloneElement, forwardRef, isValidElement } from "react";
import { mapSlottedChildren } from "./core/Slot.jsx";
import { Sheet } from "./Sheet.jsx";
import { ThemeBackdrop } from "./ThemeBackdrop.jsx";

const LIGHTBOX_BACKDROP = {
  opacity: ({ progress }) => Math.min(Math.max(progress, 0) * 0.94, 0.94),
};

const LIGHTBOX_CONTENT = {
  opacity: ({ progress }) => Math.min(Math.max(progress, 0) * 1.8, 1),
  transform: ({ tween }) => `scale(${tween(0.82, 1)})`,
};

const Root = (props) => <Sheet.Root {...props} componentFamily="lightbox" />;

const Trigger = forwardRef(function LightboxTrigger(props, forwardedRef) {
  return (
    <Sheet.Trigger
      ref={forwardedRef}
      data-velvet-lightbox="trigger"
      {...props}
      __velvetFamily="lightbox"
      __velvetPart="Trigger"
    />
  );
});

const Content = forwardRef(function LightboxContent(
  {
    children,
    portalProps,
    view: viewSlot,
    viewProps,
    backdrop = true,
    backdropProps,
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
              travelAnimation: LIGHTBOX_BACKDROP,
              ...backdropProps,
              ...backdrop.props,
              "data-velvet-lightbox": "backdrop",
            })
          : (
              <ThemeBackdrop
                themeColor="#000"
                travelAnimation={LIGHTBOX_BACKDROP}
                {...backdropProps}
                asChild
                data-velvet-lightbox="backdrop"
              >
                {backdrop}
              </ThemeBackdrop>
            )
        : (
            <ThemeBackdrop
              themeColor="#000"
              travelAnimation={LIGHTBOX_BACKDROP}
              {...backdropProps}
              data-velvet-lightbox="backdrop"
            />
          );
  const contentNode = (
    <Sheet.Content
      ref={forwardedRef}
      travelAnimation={LIGHTBOX_CONTENT}
      {...contentProps}
      data-velvet-lightbox="content"
    >
      {children}
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
        "Lightbox.Content view slot"
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
        data-velvet-lightbox="view"
      >
        {renderedViewChildren}
      </Sheet.View>
    </Sheet.Portal>
  );
});

const Close = forwardRef(function LightboxClose(props, forwardedRef) {
  return (
    <Sheet.Close
      {...props}
      ref={forwardedRef}
      __velvetFamily="lightbox"
      __velvetPart="Close"
    />
  );
});

const Title = forwardRef(function LightboxTitle(props, forwardedRef) {
  return (
    <Sheet.Title
      {...props}
      ref={forwardedRef}
      __velvetFamily="lightbox"
      __velvetPart="Title"
    />
  );
});

const Description = forwardRef(function LightboxDescription(props, forwardedRef) {
  return (
    <Sheet.Description
      {...props}
      ref={forwardedRef}
      __velvetFamily="lightbox"
      __velvetPart="Description"
    />
  );
});

export const Lightbox = {
  Root,
  Trigger,
  Content,
  Close,
  Title,
  Description,
};
