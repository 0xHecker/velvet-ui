import { Sheet } from "../../velvet/index.js";
import "./BottomSheet.css";

export const BottomSheet = () => (
  <Sheet.Root license="commercial">
    <Sheet.Trigger className="Btn">Open Bottom Sheet</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="BottomSheet-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop themeColorDimming="auto" travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="BottomSheet-content">
          <Sheet.BleedingBackground className="BottomSheet-bg" />
          <Sheet.Handle className="BottomSheet-handle" />
          <div className="BottomSheet-body">
            <Sheet.Title className="BottomSheet-title">A native-like sheet</Sheet.Title>
            <Sheet.Description className="BottomSheet-desc">
              Swipe it down, flick it, or tap outside. It rides on real momentum and snaps
              back with spring physics — just like a sheet should feel.
            </Sheet.Description>
            <div className="BottomSheet-actions">
              <Sheet.Trigger action="dismiss" className="Btn Btn--soft">
                Maybe later
              </Sheet.Trigger>
              <Sheet.Trigger action="dismiss" className="Btn Btn--primary">
                Got it
              </Sheet.Trigger>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
