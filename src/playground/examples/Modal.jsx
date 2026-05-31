import { Sheet } from "../../velvet/index.js";
import "./Modal.css";

export const Modal = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Modal</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Modal-view" contentPlacement="center">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.5 }} />
        <Sheet.Content
          className="Modal-content"
          travelAnimation={{
            opacity: ({ progress }) => Math.min(progress * 1.6, 1),
            transform: ({ tween }) => `scale(${tween(0.94, 1)})`,
          }}
        >
          <Sheet.BleedingBackground className="Modal-bg" />
          <div className="Modal-body">
            <Sheet.Title className="Modal-title">Delete project?</Sheet.Title>
            <Sheet.Description className="Modal-desc">
              This permanently removes the project and everything in it. This action can’t be
              undone.
            </Sheet.Description>
            <div className="Modal-actions">
              <Sheet.Trigger action="dismiss" className="Btn Btn--soft">Cancel</Sheet.Trigger>
              <Sheet.Trigger action="dismiss" className="Btn Btn--danger">Delete</Sheet.Trigger>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
