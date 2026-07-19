import { Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconClose, IconImage } from "../icons.jsx";
import "./Lightbox.css";

export const Lightbox = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      <IconImage /> Open photo
    </Sheet.Trigger>
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
          <figure className="Lightbox-figure">
            <img
              className="Lightbox-photo"
              src={px(1108099, 1200, 800)}
              alt="Two golden retriever puppies sitting in a field of flowers"
            />
            <figcaption className="Lightbox-caption">
              <Sheet.Title className="Lightbox-title">Golden hour pups</Sheet.Title>
              <Sheet.Description className="Lightbox-desc">
                Shot on a Sunday morning — swipe down or tap anywhere to close.
              </Sheet.Description>
            </figcaption>
          </figure>
          <Sheet.Trigger action="dismiss" className="Lightbox-close" aria-label="Close">
            <IconClose size={16} />
          </Sheet.Trigger>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
