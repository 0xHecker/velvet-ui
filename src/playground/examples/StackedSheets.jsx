import { Sheet, SheetStack } from "../../velvet/index.js";
import "./StackedSheets.css";

export const StackedSheets = () => (
  <SheetStack.Root>
    <Sheet.Root>
      <Sheet.Trigger className="Btn">Open Stacked</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.View className="Stack-view">
          <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
          <Sheet.Content
            className="Stack-content"
            stackingAnimation={{
              transform: ({ tween }) => `scale(${tween(1, 0.92)}) translateY(${tween(0, -22)}px)`,
              filter: ({ tween }) => `brightness(${tween(1, 0.84)})`,
            }}
          >
            <Sheet.BleedingBackground className="Stack-bg" />
            <Sheet.Handle className="Stack-handle" />
            <Sheet.Title className="Stack-title">First sheet</Sheet.Title>
            <Sheet.Description className="Stack-desc">
              Open another on top — this one scales back and dims as it joins the stack.
            </Sheet.Description>
            <Sheet.Root>
              <Sheet.Trigger className="Btn Btn--primary">Open another</Sheet.Trigger>
              <Sheet.Portal>
                <Sheet.View className="Stack-view">
                  <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.3 }} />
                  <Sheet.Content className="Stack-content">
                    <Sheet.BleedingBackground className="Stack-bg" />
                    <Sheet.Handle className="Stack-handle" />
                    <Sheet.Title className="Stack-title">Second sheet</Sheet.Title>
                    <Sheet.Description className="Stack-desc">
                      The sheet below settled back as this one arrived — driven by shared progress.
                    </Sheet.Description>
                    <Sheet.Trigger action="dismiss" className="Btn Btn--soft">Close</Sheet.Trigger>
                  </Sheet.Content>
                </Sheet.View>
              </Sheet.Portal>
            </Sheet.Root>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  </SheetStack.Root>
);
