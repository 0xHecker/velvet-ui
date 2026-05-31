import { Sheet } from "../../velvet/index.js";
import "./DetentSheet.css";

const items = ["Intro", "Verse", "Chorus", "Bridge", "Outro", "Reprise", "Coda", "Encore", "Hidden Track"];

export const DetentSheet = () => (
  <Sheet.Root defaultActiveDetent={1}>
    <Sheet.Trigger className="Btn">Open Detent Sheet</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="DetentSheet-view" detents="58lvh">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => Math.min(progress * 0.4, 0.4) }} />
        <Sheet.Content className="DetentSheet-content">
          <Sheet.BleedingBackground className="DetentSheet-bg" />
          <Sheet.Handle className="DetentSheet-handle" />
          <div className="DetentSheet-body">
            <div className="DetentSheet-head">
              <Sheet.Title className="DetentSheet-title">Playlist</Sheet.Title>
              <Sheet.Trigger action={{ type: "step", direction: "up" }} className="Btn Btn--soft DetentSheet-expand">
                Expand
              </Sheet.Trigger>
            </div>
            <ul className="DetentSheet-list">
              {items.map((t) => (
                <li key={t} className="DetentSheet-item">{t}</li>
              ))}
            </ul>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
