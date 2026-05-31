import { Sheet } from "../../velvet/index.js";
import "./Lightbox.css";

export const Lightbox = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Lightbox</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Lightbox-view" contentPlacement="center">
        <Sheet.Backdrop className="Lightbox-backdrop" travelAnimation={{ opacity: ({ progress }) => progress * 0.92 }} />
        <Sheet.Content
          className="Lightbox-content"
          travelAnimation={{
            opacity: ({ progress }) => Math.min(progress * 2, 1),
            transform: ({ tween }) => `scale(${tween(0.6, 1)})`,
          }}
        >
          <div className="Lightbox-photo" />
          <Sheet.Trigger action="dismiss" className="Lightbox-close" aria-label="Close">
            ✕
          </Sheet.Trigger>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
