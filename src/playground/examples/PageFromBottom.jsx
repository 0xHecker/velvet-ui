import { Sheet } from "../../velvet/index.js";
import "./PageFromBottom.css";

export const PageFromBottom = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Page</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="PageBottom-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.25 }} />
        <Sheet.Content className="PageBottom-content">
          <Sheet.Handle className="PageBottom-handle" />
          <header className="PageBottom-head">
            <Sheet.Title className="PageBottom-title">New Note</Sheet.Title>
            <Sheet.Trigger action="dismiss" className="PageBottom-done">
              Done
            </Sheet.Trigger>
          </header>
          <div className="PageBottom-body">
            <Sheet.Description className="PageBottom-desc">
              A full-height page that slides up edge to edge, covering the screen — the parent peeks
              behind its rounded top, iOS-style.
            </Sheet.Description>
            <div className="PageBottom-field">Title</div>
            <div className="PageBottom-field PageBottom-field--tall">Start writing…</div>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
