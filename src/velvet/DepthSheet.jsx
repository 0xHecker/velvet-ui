import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useMemo,
  useState,
} from "react";
import { Scroll } from "./Scroll.jsx";
import { Sheet } from "./Sheet.jsx";
import { SheetStack, useSheetStack } from "./SheetStack.jsx";
import { ThemeBackdrop } from "./ThemeBackdrop.jsx";
import {
  depthSheetDefaultTokens,
  depthSheetVariable,
  depthSheetVariables,
  depthSheetTokenStyle,
} from "./depthSheetTokens.js";

const depthProgress = (progress) => Math.max(progress, 0);
const depthProduct = (token, progress) =>
  `calc(${token} * ${depthProgress(progress)})`;

/**
 * Public depth motion. Every value resolves through the same CSS custom
 * properties exposed by depthSheetVariables and DepthSheet.Root's `tokens`
 * prop, so responsive CSS and programmatic configuration share one contract.
 */
export const depthSheetStackingAnimation = Object.freeze({
  translateY: ({ progress }) =>
    `max(0px, min(${depthProduct(
      depthSheetVariable("shift"),
      progress
    )}, ${depthSheetVariable("shiftLimit")}))`,
  scale: ({ progress }) =>
    `clamp(0.5, max(${depthSheetVariable("scaleMinimum")}, calc(1 - ${depthProduct(
      depthSheetVariable("scaleLoss"),
      progress
    )})), 1)`,
  borderRadius: ({ progress }) =>
    depthProgress(progress) === 0
      ? "0px"
      : `max(0px, min(calc(${depthSheetVariable("radius")} + ${depthProduct(
          depthSheetVariable("radiusStep"),
          progress
        )}), ${depthSheetVariable("radiusLimit")}))`,
  filter: ({ progress }) =>
    `brightness(clamp(0.4, max(${depthSheetVariable("brightnessMinimum")}, calc(1 - ${depthProduct(
      depthSheetVariable("dimming"),
      progress
    )})), 1))`,
  transformOrigin: "50% 0",
});

const DEPTH_BACKDROP_TRAVEL = {
  opacity: ({ progress }) => Math.min(Math.max(progress, 0) * 0.28, 0.28),
};

const DEPTH_ENTERING_SPRING = {
  easing: "spring",
  stiffness: 420,
  damping: 42,
  mass: 1.2,
};

const DepthSheetContext = createContext(null);

const Root = forwardRef(function DepthSheetRoot(
  {
    children,
    className,
    style,
    sheetProps,
    open,
    defaultOpen,
    onOpenChange,
    snap,
    defaultSnap,
    onSnapChange,
    sheetRole,
    tokens,
    ...rootProps
  },
  forwardedRef
) {
  const parentStack = useSheetStack();
  const parentDepth = useContext(DepthSheetContext);
  const [portalHost, setPortalHost] = useState(null);
  const inheritedTokens = useMemo(
    () => ({ ...parentDepth?.tokens, ...tokens }),
    [parentDepth?.tokens, tokens]
  );
  const depthContext = useMemo(
    () => ({
      portalHost: parentDepth?.portalHost || portalHost,
      // A DepthSheet mounted directly in a consumer-owned SheetStack has no
      // private host to inherit. In that composition its portal should use the
      // same document-body fallback as Sheet.Portal instead of rendering null.
      defaultPortal:
        parentDepth?.defaultPortal || Boolean(parentStack && !parentDepth),
      tokens: inheritedTokens,
    }),
    [
      inheritedTokens,
      parentDepth,
      parentDepth?.defaultPortal,
      parentDepth?.portalHost,
      parentStack,
      portalHost,
    ]
  );
  const sheet = (
    <Sheet.Root
      {...sheetProps}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      snap={snap}
      defaultSnap={defaultSnap}
      onSnapChange={onSnapChange}
      sheetRole={sheetRole}
    >
      {children}
    </Sheet.Root>
  );

  // A nested DepthSheet joins the nearest coordinator and reuses its portal
  // host. No wrapper or new stack boundary is introduced, so this works at
  // arbitrary depth and every underlying layer receives stacking progress.
  if (parentStack) {
    return (
      <DepthSheetContext.Provider value={depthContext}>
        {sheet}
      </DepthSheetContext.Provider>
    );
  }

  return (
    <SheetStack.Root
      ref={forwardedRef}
      data-velvet-depth="root"
      className={className}
      style={{ ...depthSheetTokenStyle(tokens), ...style }}
      {...rootProps}
    >
      <DepthSheetContext.Provider value={depthContext}>
        {sheet}
        <div
          ref={setPortalHost}
          data-velvet-depth="portal-host"
        />
      </DepthSheetContext.Provider>
    </SheetStack.Root>
  );
});

const Page = forwardRef(function DepthSheetPage(
  { stackingAnimation = depthSheetStackingAnimation, ...props },
  forwardedRef
) {
  return (
    <SheetStack.Outlet
      ref={forwardedRef}
      stackingAnimation={stackingAnimation}
      data-velvet-depth="page"
      {...props}
    />
  );
});

const Content = forwardRef(function DepthSheetContent(
  {
    children,
    portalProps,
    viewProps,
    backdrop = true,
    backdropProps,
    handle = true,
    handleProps,
    bleedingBackgroundProps,
    scrollRootProps,
    scrollViewProps,
    scrollContentProps,
    ...contentProps
  },
  forwardedRef
) {
  const depthContext = useContext(DepthSheetContext);
  const portalHost = depthContext?.portalHost;
  const tokenStyle = depthSheetTokenStyle(depthContext?.tokens);
  const backdropNode =
    backdrop === false
      ? null
      : isValidElement(backdrop)
        ? cloneElement(backdrop, {
            ...backdrop.props,
            "data-velvet-depth": "backdrop",
          })
        : (
            <ThemeBackdrop
              themeColor="#020806"
              travelAnimation={DEPTH_BACKDROP_TRAVEL}
              {...backdropProps}
              data-velvet-depth="backdrop"
            />
          );
  const handleNode =
    handle === false
      ? null
      : isValidElement(handle)
        ? cloneElement(handle, {
            ...handle.props,
            "data-velvet-depth": "handle",
          })
        : <Sheet.Handle {...handleProps} data-velvet-depth="handle" />;

  if (
    !portalHost &&
    !portalProps?.container &&
    !depthContext?.defaultPortal
  ) {
    return null;
  }

  return (
    <Sheet.Portal
      {...portalProps}
      container={portalProps?.container || portalHost || undefined}
    >
      <Sheet.View
        side="center"
        tracks="auto"
        swipeOvershoot={false}
        nativeEdgeSwipePrevention
        enteringAnimationSettings={DEPTH_ENTERING_SPRING}
        {...viewProps}
        data-velvet-depth="view"
      >
        {backdropNode}
        <Sheet.Content
          ref={forwardedRef}
          stackingAnimation={depthSheetStackingAnimation}
          {...contentProps}
          style={{ ...tokenStyle, ...contentProps.style }}
          data-velvet-depth="content"
        >
          <Sheet.BleedingBackground
            {...bleedingBackgroundProps}
            data-velvet-depth="background"
          />
          {handleNode}
          <Scroll.Root {...scrollRootProps} data-velvet-depth="scroll-root">
            <Scroll.View {...scrollViewProps} data-velvet-depth="scroll">
              <Scroll.Content {...scrollContentProps} data-velvet-depth="scroll-content">
                {children}
              </Scroll.Content>
            </Scroll.View>
          </Scroll.Root>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  );
});

export const DepthSheet = {
  Root,
  Page,
  Content,
  Trigger: Sheet.Trigger,
  Close: Sheet.Close,
  Step: Sheet.Step,
  Title: Sheet.Title,
  Description: Sheet.Description,
  Handle: Sheet.Handle,
};

export { depthSheetDefaultTokens, depthSheetVariables };
