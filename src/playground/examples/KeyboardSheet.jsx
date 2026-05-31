import { Sheet } from "../../velvet/index.js";
import "./KeyboardSheet.css";

export const KeyboardSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Keyboard Sheet</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Keyboard-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Keyboard-content">
          <Sheet.BleedingBackground className="Keyboard-bg" />
          <Sheet.Handle className="Keyboard-handle" />
          <div className="Keyboard-body">
            <Sheet.Title className="Keyboard-title">New message</Sheet.Title>
            <Sheet.Description className="Keyboard-desc">
              The composer stays pinned above the on-screen keyboard — the sheet resizes to the
              visible viewport, so nothing is ever covered.
            </Sheet.Description>
            <div className="Keyboard-composer">
              <input className="Keyboard-input" placeholder="Write a reply…" aria-label="Reply" />
              <Sheet.Trigger action="dismiss" className="Btn Btn--primary Keyboard-send">
                Send
              </Sheet.Trigger>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
