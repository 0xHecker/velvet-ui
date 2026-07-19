import * as React from "react";
import {
  AutoFocusTarget,
  Scroll,
  Sheet,
  SheetStack,
  Toaster,
  toast,
} from "velvet-ui";
import { Sheet as SheetSubpath } from "velvet-ui/sheet";
import { Toaster as ToasterSubpath, toast as toastSubpath } from "velvet-ui/toast";

const scrollRef = React.createRef<import("velvet-ui").ScrollApi>();

export function ConsumerFixture() {
  const [open, setOpen] = React.useState(false);
  const [snap, setSnap] = React.useState(1);

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

      <Toaster
        position="bottom-end"
        visibleToasts={3}
        classNames={{ toast: "toast", title: "font-medium" }}
      />
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

void SheetSubpath;
void ToasterSubpath;
void toastSubpath;
