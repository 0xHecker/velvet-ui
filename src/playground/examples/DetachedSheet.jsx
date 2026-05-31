import { Sheet } from "../../velvet/index.js";
import "./DetachedSheet.css";

export const DetachedSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Detached Sheet</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Detached-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Detached-content">
          <Sheet.Handle className="Detached-handle" />
          <div className="Detached-body">
            <Sheet.Title className="Detached-title">Detached</Sheet.Title>
            <Sheet.Description className="Detached-desc">
              This sheet floats inset from every edge with all corners rounded — a card that lifts
              clean off the screen.
            </Sheet.Description>
            <Sheet.Trigger action="dismiss" className="Btn Btn--primary">
              Got it
            </Sheet.Trigger>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
