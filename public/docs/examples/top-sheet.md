# Top Sheet homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
import { Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconBell, IconMessage } from "../icons.jsx";
import "./TopSheet.css";

export const TopSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      <IconBell /> Show notification
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="TopSheet-view" side="top">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.35 }} />
        <Sheet.Content className="TopSheet-content">
          <Sheet.BleedingBackground className="TopSheet-bg" />
          <div className="TopSheet-body">
            <div className="TopSheet-row">
              <img className="TopSheet-avatar" src={px(774909, 120, 120)} alt="Maya Chen" />
              <div className="TopSheet-meta">
                <div className="TopSheet-appRow">
                  <span className="TopSheet-app">MESSAGES · now</span>
                </div>
                <Sheet.Title className="TopSheet-title">Maya Chen</Sheet.Title>
                <Sheet.Description className="TopSheet-desc">
                  The prototype feels incredible — shipping this to the team today?
                </Sheet.Description>
              </div>
            </div>
            <div className="TopSheet-actions">
              <Sheet.Trigger action="close" className="TopSheet-action">
                <IconMessage size={14} /> Reply
              </Sheet.Trigger>
              <Sheet.Trigger action="close" className="TopSheet-action">Mark as read</Sheet.Trigger>
            </div>
          </div>
          <Sheet.Handle className="TopSheet-handle" />
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
```

## CSS

```css
.TopSheet-view {
  height: var(--velvet-100lvh);
}
.TopSheet-content {
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  padding: calc(16px + env(safe-area-inset-top)) 16px 8px;
  display: flex;
  flex-direction: column;
}
.TopSheet-bg {
  border-radius: 0 0 24px 24px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 24px 50px -20px rgba(2, 6, 23, 0.35);
}
.TopSheet-row {
  display: flex;
  gap: 12px;
}
.TopSheet-avatar {
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  object-fit: cover;
}
.TopSheet-meta {
  flex: 1;
  min-width: 0;
}
.TopSheet-appRow {
  margin-bottom: 3px;
}
.TopSheet-app {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
}
.TopSheet-title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 700;
  color: var(--ink);
}
.TopSheet-desc {
  margin: 2px 0 0;
  font-size: 14px;
  line-height: 1.45;
  color: var(--ink-soft);
}
.TopSheet-actions {
  display: flex;
  gap: 8px;
  margin-top: 13px;
}
.TopSheet-action {
  flex: 1;
  appearance: none;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  background: var(--cream-bg-2);
  border-radius: 10px;
  padding: 9px 0;
  cursor: pointer;
  transition: background 160ms ease, transform 160ms var(--ease);
}
.TopSheet-action:hover {
  background: #e9ebef;
}
.TopSheet-action:active {
  transform: scale(0.97);
}
.TopSheet-handle {
  margin: 10px auto 2px;
  background: #d8dce2;
}
```
