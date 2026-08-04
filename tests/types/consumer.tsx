import * as React from "react";
import {
  AutoFocusTarget,
  BottomSheet,
  CardExpansion,
  depthSheetVariables,
  DepthSheet,
  ExternalOverlay,
  Lightbox,
  PersistentSheet,
  Scroll,
  Sheet,
  SheetMorph,
  SheetStack,
  ThemeBackdrop,
  Toaster,
  toast,
} from "@velvetui/react";
import { Sheet as SheetSubpath } from "@velvetui/react/sheet";
import {
  animate,
  applyTravelStyles,
  resolveTravelStyles,
  sampleSpring,
  springEasing,
} from "@velvetui/react/motion";
import {
  useAnimate,
  useReducedMotion,
  useSpringEasing,
} from "@velvetui/react/motion/react";
import {
  Scroll as ScrollSubpath,
  VisuallyHidden as VisuallyHiddenSubpath,
} from "@velvetui/react/utilities";
import { SheetMorph as SheetMorphSubpath } from "@velvetui/react/sheet-morph";
import { ThemeBackdrop as ThemeBackdropSubpath } from "@velvetui/react/theme-backdrop";
import { CardExpansion as CardExpansionSubpath } from "@velvetui/react/card-expansion";
import { DepthSheet as DepthSheetSubpath } from "@velvetui/react/depth-sheet";
import { BottomSheet as BottomSheetSubpath } from "@velvetui/react/bottom-sheet";
import { PersistentSheet as PersistentSheetSubpath } from "@velvetui/react/persistent-sheet";
import { Lightbox as LightboxSubpath } from "@velvetui/react/lightbox";
import { Toaster as ToasterSubpath, toast as toastSubpath } from "@velvetui/react/toast";

const scrollRef = React.createRef<import("@velvetui/react").ScrollApi>();

export function ConsumerFixture() {
  const [open, setOpen] = React.useState(false);
  const [snap, setSnap] = React.useState(1);
  const play = useAnimate();
  const reduceMotion = useReducedMotion();
  const timing = useSpringEasing("smooth");

  return (
    <>
      <SheetStack.Root>
        <Sheet open={open} onOpenChange={setOpen} snap={snap} onSnapChange={setSnap}>
          <Sheet.Trigger action="open">Open</Sheet.Trigger>
          <Sheet.Panel
            side="bottom"
            snapPoints={["35dvh", "80dvh"]}
            className="rounded-t-3xl bg-white"
            backdropProps={{ className: "bg-black/40" }}
            viewProps={{
              swipeTrap: { x: true, y: false },
              onTravel: ({ progress, range, progressAtDetents }) =>
                `${progress}:${range.start}:${progressAtDetents.length}`,
              onClickOutside: { dismiss: false },
              onEscapeKeyDown: ({ changeDefault, nativeEvent }) => {
                nativeEvent.preventDefault();
                changeDefault({ dismiss: false });
              },
            }}
          >
            <Sheet.Title>Preferences</Sheet.Title>
            <Sheet.Description>Choose how the workspace behaves.</Sheet.Description>
            <AutoFocusTarget asChild>
              <button>First field</button>
            </AutoFocusTarget>
            <Sheet.Step snapTo={2}>Expand</Sheet.Step>
            <Sheet.Close>Done</Sheet.Close>
          </Sheet.Panel>
        </Sheet>
      </SheetStack.Root>

      <Scroll.Root componentRef={scrollRef}>
        <Scroll.View onScrollProgress={({ progress }) => progress.toFixed(2)}>
          <Scroll.Content>Scrollable</Scroll.Content>
        </Scroll.View>
      </Scroll.Root>

      <DepthSheet.Root
        tokens={{
          shift: "18px",
          scaleLoss: 0.07,
          surfaceBackground: "#fff",
        }}
        style={{ [depthSheetVariables.shadow]: "0 -20px 60px rgb(0 0 0 / 0.2)" }}
      >
        <DepthSheet.Page>
          <DepthSheet.Trigger>Open depth sheet</DepthSheet.Trigger>
        </DepthSheet.Page>
        <DepthSheet.Content
          viewProps={{ tracks: "auto" }}
          scrollViewProps={{
            "aria-label": "Profile content",
            safeArea: "visual-viewport",
            scrollGestureTrap: { x: false, y: true },
          }}
        >
          <DepthSheet.Title>Profile</DepthSheet.Title>
          <DepthSheet.Description>Ten nested layers remain coordinated.</DepthSheet.Description>
          <ExternalOverlay.Root asChild>
            <button>Open color picker</button>
          </ExternalOverlay.Root>
          <DepthSheet.Root>
            <DepthSheet.Trigger>Open nested layer</DepthSheet.Trigger>
            <DepthSheet.Content>
              <DepthSheet.Title>Nested layer</DepthSheet.Title>
            </DepthSheet.Content>
          </DepthSheet.Root>
        </DepthSheet.Content>
      </DepthSheet.Root>

      <CardExpansion.Root>
        <CardExpansion.Trigger>Read story</CardExpansion.Trigger>
        <CardExpansion.Content
          scroll={false}
          from={null}
          travelAnimation={{ transform: ({ tween }) => `scale(${tween(0.88, 1)})` }}
        >
          <CardExpansion.Title>Story</CardExpansion.Title>
          <CardExpansion.Description>Six minute read</CardExpansion.Description>
          <CardExpansion.Close>Close</CardExpansion.Close>
        </CardExpansion.Content>
      </CardExpansion.Root>

      <BottomSheet.Root>
        <BottomSheet.Trigger>Open details</BottomSheet.Trigger>
        <BottomSheet.Content
          scrollViewProps={{
            "aria-label": "Details",
            safeArea: "layout-viewport",
            onScrollProgress: ({ progress }) => progress.toFixed(2),
          }}
        >
          <BottomSheet.Title>Details</BottomSheet.Title>
          <BottomSheet.Description>A production bottom sheet.</BottomSheet.Description>
          <BottomSheet.Step direction="up">Expand</BottomSheet.Step>
          <BottomSheet.Close>Done</BottomSheet.Close>
        </BottomSheet.Content>
      </BottomSheet.Root>

      <PersistentSheet.Root defaultOpen defaultSnap={1}>
        <PersistentSheet.Content
          viewProps={{ snapPoints: ["96px", "70dvh"] }}
        >
          <PersistentSheet.Title>Now playing</PersistentSheet.Title>
          <PersistentSheet.Description>Swipe to resize without dismissing.</PersistentSheet.Description>
          <PersistentSheet.Step direction="up">Expand</PersistentSheet.Step>
          <PersistentSheet.Close>Close player</PersistentSheet.Close>
        </PersistentSheet.Content>
      </PersistentSheet.Root>

      <Lightbox.Root>
        <Lightbox.Trigger>Open photo</Lightbox.Trigger>
        <Lightbox.Content>
          <Lightbox.Title>Mountain at dusk</Lightbox.Title>
          <Lightbox.Description>Swipe either direction to close.</Lightbox.Description>
          <Lightbox.Close>Close</Lightbox.Close>
        </Lightbox.Content>
      </Lightbox.Root>

      <Toaster
        position="bottom-end"
        visibleToasts={3}
        classNames={{ toast: "toast", title: "font-medium" }}
      />
      <button
        onClick={(event) =>
          play(
            event.currentTarget,
            { transform: ["scale(.96)", "scale(1)"] },
            { id: "press", preset: "snappy", skip: reduceMotion },
          )
        }
        data-duration={timing.duration}
      >
        Animate
      </button>
    </>
  );
}

const id = toast.success("Saved", {
  description: "Everything is up to date.",
  action: { label: "Undo", onClick: () => false },
  onDismiss: (_item, detail) => detail.reason,
});
toast.update(id, { description: "Synced just now" });
toast.promise(Promise.resolve({ name: "Draft" }), {
  id: "draft-save",
  loading: "Saving…",
  success: ({ name }) => ({ message: `${name} saved`, duration: 2500 }),
  error: (error) => ({ message: String(error), duration: 6000 }),
});
scrollRef.current?.scrollTo({
  progress: 1,
  animationSettings: { easing: "spring", stiffness: 380, damping: 32 },
});
const sample = sampleSpring("snappy", { from: 0, to: 120, v0: 0.2 });
const cssTiming = springEasing({ stiffness: 380, damping: 32 });
const styles = resolveTravelStyles({ opacity: [0, 1] }, 0.5);
applyTravelStyles(null, { scale: [0.96, 1] }, 0.5);
animate(null, [{ opacity: 0 }, { opacity: 1 }], {
  id: "route-transition",
  preset: "smooth",
}).finished.then((status) => status satisfies "finished" | "cancelled" | "skipped");

void SheetSubpath;
void ScrollSubpath;
void VisuallyHiddenSubpath;
void SheetMorphSubpath;
void ThemeBackdropSubpath;
void CardExpansionSubpath;
void DepthSheetSubpath;
void BottomSheetSubpath;
void PersistentSheetSubpath;
void LightboxSubpath;
void ToasterSubpath;
void toastSubpath;
void sample;
void cssTiming;
void styles;
