import { Sheet } from "../../velvet/index.js";
import "./TopSheet.css";

export const TopSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Top Sheet</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="TopSheet-view" contentPlacement="top">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.35 }} />
        <Sheet.Content className="TopSheet-content">
          <Sheet.BleedingBackground className="TopSheet-bg" />
          <div className="TopSheet-body">
            <Sheet.Title className="TopSheet-title">Software update</Sheet.Title>
            <Sheet.Description className="TopSheet-desc">
              A new version is ready to install. It descends from the top and snaps back when
              you swipe up.
            </Sheet.Description>
            <Sheet.Trigger action="dismiss" className="Btn Btn--primary">Dismiss</Sheet.Trigger>
          </div>
          <Sheet.Handle className="TopSheet-handle" />
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
