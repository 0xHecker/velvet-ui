# Lightbox homepage demo source

> This source was captured with the Velvet UI 0.3.0 documentation. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/0.3.0/gallery-recipes

## JSX

```jsx
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
      <Sheet.View className="Lightbox-view" side="center" tracks={["top", "bottom"]}>
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
                Shot on a Sunday morning — swipe up, swipe down, or tap anywhere to close.
              </Sheet.Description>
            </figcaption>
          </figure>
          <Sheet.Trigger action="close" className="Lightbox-close" aria-label="Close">
            <IconClose size={16} />
          </Sheet.Trigger>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
```

## CSS

```css
.Lightbox-backdrop {
  background: #000;
}
.Lightbox-content {
  position: relative;
  width: min(86vw, 640px);
}
.Lightbox-figure {
  margin: 0;
  position: relative;
}
.Lightbox-photo {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 30px 80px -24px rgba(0, 0, 0, 0.65);
}
.Lightbox-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 44px 18px 14px;
  border-radius: 0 0 18px 18px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.62));
  color: #fff;
}
.Lightbox-title {
  display: block;
  margin: 0;
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.Lightbox-desc {
  display: block;
  margin: 3px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}
.Lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  appearance: none;
  border: none;
  border-radius: 999px;
  background: rgba(20, 20, 24, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 160ms ease, transform 160ms var(--ease);
}
.Lightbox-close:hover {
  background: rgba(20, 20, 24, 0.75);
}
.Lightbox-close:active {
  transform: scale(0.9);
}
```
