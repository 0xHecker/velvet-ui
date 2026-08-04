# Detached Sheet homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
import { Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconBag, IconChevronR } from "../icons.jsx";
import "./DetachedSheet.css";

export const DetachedSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      Quick view <IconChevronR />
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Detached-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Detached-content">
          <Sheet.Handle className="Detached-handle" />
          <div className="Detached-hero">
            <img src={px(190819, 800, 480)} alt="Meridian chronograph watch" />
            <span className="Detached-flag">Only 3 left</span>
          </div>
          <div className="Detached-body">
            <div className="Detached-titleRow">
              <Sheet.Title className="Detached-title">Meridian Chrono 40</Sheet.Title>
              <strong className="Detached-price">$1,250</strong>
            </div>
            <Sheet.Description className="Detached-desc">
              Brushed steel, sapphire crystal, and a movement with a 60-hour reserve. A detached
              sheet — it floats inset from every edge, like a card lifted off the table.
            </Sheet.Description>
            <div className="Detached-actions">
              <Sheet.Trigger action="close" className="Btn Btn--primary">
                <IconBag size={15} /> Add to bag
              </Sheet.Trigger>
              <Sheet.Trigger action="close" className="Btn Btn--soft">
                Details
              </Sheet.Trigger>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
```

## CSS

```css
.Detached-view {
  height: var(--velvet-100lvh);
}
.Detached-content {
  box-sizing: border-box;
  width: calc(100% - 32px);
  max-width: 420px;
  margin: 0 16px calc(16px + env(safe-area-inset-bottom));
  padding: 10px 14px 18px;
  display: flex;
  flex-direction: column;
  background: var(--cream-surface);
  border-radius: 26px; /* all corners — detached */
  box-shadow: 0 22px 60px -20px rgba(0, 0, 0, 0.34);
}
.Detached-handle {
  margin: 4px auto 12px;
  background: var(--grabber);
}
.Detached-hero {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
}
.Detached-hero img {
  display: block;
  width: 100%;
  height: 168px;
  object-fit: cover;
}
.Detached-flag {
  position: absolute;
  left: 10px;
  top: 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: #92400e;
  background: #fef3c7;
  padding: 5px 10px;
  border-radius: 999px;
}
.Detached-body {
  padding: 14px 8px 0;
}
.Detached-titleRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.Detached-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.Detached-price {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.Detached-desc {
  margin: 8px 0 16px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--ink-soft);
}
.Detached-actions {
  display: flex;
  gap: 10px;
}
.Detached-actions .Btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.Detached-actions .Btn--primary {
  flex: 1.4;
}
.Detached-actions .Btn--soft {
  flex: 1;
}
```
