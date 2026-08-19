# Modal Dialog homepage demo source

> This source was captured with the Velvet UI 0.3.0 documentation. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/0.3.0/gallery-recipes

## JSX

```jsx
import { useState } from "react";
import { Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconCheck, IconChevronR } from "../icons.jsx";
import "./Modal.css";

const TEAM = [px(733872, 96, 96), px(614810, 96, 96), px(1239291, 96, 96)];

export const Modal = () => {
  const [role, setRole] = useState("Editor");
  return (
    <Sheet.Root>
      <Sheet.Trigger className="Btn">
        Open invite <IconChevronR />
      </Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.View className="Modal-view" side="center" tracks={["top", "bottom"]}>
          <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.5 }} />
          <Sheet.Content
            className="Modal-content"
            travelAnimation={{
              opacity: ({ progress }) => Math.min(progress * 1.6, 1),
              transform: ({ tween }) => `scale(${tween(0.94, 1)})`,
            }}
          >
            <Sheet.BleedingBackground className="Modal-bg" />
            <div className="Modal-cover">
              <img src={px(4350210, 800, 400)} alt="The Atlas team around a laptop" />
              <div className="Modal-avatars">
                {TEAM.map((src) => (
                  <img key={src} src={src} alt="" />
                ))}
              </div>
            </div>
            <div className="Modal-body">
              <Sheet.Title className="Modal-title">Join “Atlas Redesign”?</Sheet.Title>
              <Sheet.Description className="Modal-desc">
                Ava Laurent invited you to collaborate with 11 others. Pick a role — you can
                change it later.
              </Sheet.Description>
              <div className="Modal-roles" role="group" aria-label="Role">
                {["Viewer", "Editor"].map((r) => (
                  <button
                    key={r}
                    className="Modal-role"
                    data-active={role === r}
                    aria-pressed={role === r}
                    onClick={() => setRole(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="Modal-actions">
                <Sheet.Trigger action="close" className="Btn Btn--soft">Not now</Sheet.Trigger>
                <Sheet.Trigger action="close" className="Btn Btn--primary">
                  <IconCheck size={15} /> Accept invite
                </Sheet.Trigger>
              </div>
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
};
```

## CSS

```css
.Modal-view {
  height: var(--velvet-100lvh);
}

.Modal-content {
  box-sizing: border-box;
  width: calc(100vw - 40px);
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.Modal-bg {
  border-radius: 26px;
  background: var(--cream-surface);
  box-shadow: 0 30px 60px -24px rgba(60, 45, 30, 0.32), 0 0 0 0.5px rgba(60, 50, 38, 0.06);
}

.Modal-cover {
  position: relative;
  margin: 10px 10px 0;
  border-radius: 18px;
  overflow: hidden;
}
.Modal-cover > img {
  display: block;
  width: 100%;
  height: 132px;
  object-fit: cover;
}
.Modal-avatars {
  position: absolute;
  left: 14px;
  bottom: -18px;
  display: flex;
}
.Modal-avatars img {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
  border: 3px solid var(--cream-surface);
  margin-left: -10px;
  box-shadow: 0 4px 12px -4px rgba(2, 6, 23, 0.3);
}
.Modal-avatars img:first-child {
  margin-left: 0;
}

.Modal-body {
  padding: 30px 22px 22px;
}

.Modal-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.Modal-desc {
  margin: 0 0 16px;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--ink-soft);
}

.Modal-roles {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--cream-bg-2);
  border-radius: 12px;
  margin-bottom: 16px;
}
.Modal-role {
  flex: 1;
  appearance: none;
  border: none;
  background: none;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-soft);
  padding: 8px 0;
  border-radius: 9px;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
}
.Modal-role[data-active="true"] {
  background: var(--cream-surface);
  color: var(--ink);
  box-shadow: 0 1px 4px rgba(2, 6, 23, 0.1);
}

.Modal-actions {
  display: flex;
  gap: 10px;
}
.Modal-actions .Btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 16px;
}
.Modal-actions .Btn--soft {
  flex: 1;
}
.Modal-actions .Btn--primary {
  flex: 1.6;
}
```
