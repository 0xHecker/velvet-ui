import { Sheet, SheetStack } from "../../velvet/index.js";
import "./DepthSheet.css";

const depth = {
  transform: ({ tween }) => `scale(${tween(1, 0.86)})`,
  filter: ({ tween }) => `brightness(${tween(1, 0.72)})`,
};

export const DepthSheet = () => (
  <SheetStack.Root>
    <Sheet.Root>
      <Sheet.Trigger className="Btn">Open with Depth</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.View className="Depth-view">
          <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
          <Sheet.Content className="Depth-content" stackingAnimation={depth}>
            <Sheet.BleedingBackground className="Depth-bg" />
            <Sheet.Handle className="Depth-handle" />
            <Sheet.Title className="Depth-title">Front sheet</Sheet.Title>
            <Sheet.Description className="Depth-desc">
              Open another — this one recedes straight back into depth, scaling down in place with no
              upward shift.
            </Sheet.Description>
            <Sheet.Root>
              <Sheet.Trigger className="Btn Btn--primary">Go deeper</Sheet.Trigger>
              <Sheet.Portal>
                <Sheet.View className="Depth-view">
                  <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.3 }} />
                  <Sheet.Content className="Depth-content" stackingAnimation={depth}>
                    <Sheet.BleedingBackground className="Depth-bg" />
                    <Sheet.Handle className="Depth-handle" />
                    <Sheet.Title className="Depth-title">Deeper sheet</Sheet.Title>
                    <Sheet.Description className="Depth-desc">
                      The sheet behind sits further back in space, dimmed by distance.
                    </Sheet.Description>
                    <Sheet.Trigger action="dismiss" className="Btn Btn--soft">
                      Close
                    </Sheet.Trigger>
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
