import { Sheet } from "../../velvet/index.js";
import "./PersistentSheet.css";

export const PersistentSheet = () => (
  <Sheet.Root defaultActiveDetent={1}>
    <Sheet.Trigger className="Btn">Show Player</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View
        className="Player-view"
        detents="94px"
        swipeDismissal={false}
        inertOutside={false}
        onEscapeKeyDown={{ dismiss: false }}
      >
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => Math.max(0, progress - 0.35) * 0.8 }} />
        <Sheet.Content className="Player-content">
          <Sheet.BleedingBackground className="Player-bg" />
          <Sheet.Handle className="Player-handle" />
          <div className="Player-bar">
            <div className="Player-art" />
            <div className="Player-meta">
              <Sheet.Title className="Player-title">Midnight Drive</Sheet.Title>
              <p className="Player-artist">The Velvets</p>
            </div>
            <Sheet.Trigger action={{ type: "step", direction: "up" }} className="Player-icon" aria-label="Expand">
              ⌃
            </Sheet.Trigger>
            <Sheet.Trigger action="dismiss" className="Player-icon" aria-label="Close">
              ✕
            </Sheet.Trigger>
          </div>
          <div className="Player-full">
            <Sheet.Description className="Player-desc">
              A persistent sheet — swiping down can’t dismiss it. It rests at a mini-player detent
              and expands to full; only the × closes it explicitly.
            </Sheet.Description>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
