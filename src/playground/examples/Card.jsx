import { Sheet } from "../../velvet/index.js";
import "./Card.css";

export const Card = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Card</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Card2-view" contentPlacement="center">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.5 }} />
        <Sheet.Content
          className="Card2-content"
          travelAnimation={{
            opacity: ({ progress }) => Math.min(progress * 2, 1),
            transform: ({ tween }) => `scale(${tween(0.82, 1)})`,
          }}
        >
          <div className="Card2-cover">
            <span className="Card2-kicker">FEATURED</span>
            <Sheet.Title className="Card2-coverTitle">Designing Motion</Sheet.Title>
          </div>
          <div className="Card2-body">
            <Sheet.Description className="Card2-desc">
              Tap-to-expand cards scale up from a thumbnail into a full sheet — the App Store–style
              detail view, on the web.
            </Sheet.Description>
            <Sheet.Trigger action="dismiss" className="Btn Btn--primary">
              Done
            </Sheet.Trigger>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
