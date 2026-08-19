# Side Sheet homepage demo source

> This source was captured with the Velvet UI 0.3.0 documentation. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/0.3.0/gallery-recipes

## JSX

```jsx
import { Scroll, Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import {
  IconBell,
  IconCard,
  IconChevronL,
  IconChevronR,
  IconGear,
  IconInfo,
  IconLock,
  IconSun,
  IconUsers,
} from "../icons.jsx";
import "./Page.css";

const GROUPS = [
  {
    label: "Account",
    rows: [
      { icon: IconUsers, label: "Profile", value: "Marcus Reid" },
      { icon: IconCard, label: "Subscription", value: "Pro" },
    ],
  },
  {
    label: "Preferences",
    rows: [
      { icon: IconBell, label: "Notifications", value: "", toggle: true },
      { icon: IconSun, label: "Appearance", value: "System" },
      { icon: IconLock, label: "Privacy", value: "" },
    ],
  },
  {
    label: "About",
    rows: [
      { icon: IconInfo, label: "Version", value: "0.1.0" },
      { icon: IconGear, label: "Advanced", value: "" },
    ],
  },
];

export const Page = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      <IconGear /> Open settings
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Page-view" side="right" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.18 }} />
        <Sheet.Content className="Page-content">
          <Sheet.BleedingBackground className="Page-bg" />
          <header className="Page-head">
            <Sheet.Trigger action="close" className="Page-back">
              <IconChevronL size={17} /> Back
            </Sheet.Trigger>
            <Sheet.Title className="Page-title">Settings</Sheet.Title>
            <span className="Page-headspace" />
          </header>
          <Scroll.Root className="Page-scrollRoot">
            <Scroll.View className="Page-scrollView">
              <Scroll.Content className="Page-body">
                <div className="Page-profile">
                  <img src={px(614810, 120, 120)} alt="Marcus Reid" />
                  <div>
                    <strong>Marcus Reid</strong>
                    <span>marcus@studio.co</span>
                  </div>
                </div>
                {GROUPS.map((g) => (
                  <section className="Page-group" key={g.label}>
                    <span className="Page-groupLabel">{g.label}</span>
                    <ul className="Page-list">
                      {g.rows.map((r) => (
                        <li key={r.label} className="Page-row">
                          <span className="Page-rowIcon">
                            <r.icon size={15} />
                          </span>
                          <span className="Page-rowLabel">{r.label}</span>
                          {r.toggle ? (
                            <span className="Page-toggle" data-on="true">
                              <i />
                            </span>
                          ) : (
                            <>
                              <span className="Page-value">{r.value}</span>
                              <IconChevronR size={14} />
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                <p className="Page-hint">Swipe from the right edge — or anywhere — to go back.</p>
              </Scroll.Content>
            </Scroll.View>
          </Scroll.Root>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
```

## CSS

```css
.Page-view {
  width: 100vw;
  height: var(--velvet-100lvh);
}
.Page-content {
  box-sizing: border-box;
  width: 100vw;
  height: var(--velvet-100lvh);
  display: flex;
  flex-direction: column;
}
.Page-bg {
  background: #f6f7f9;
}
.Page-head {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 14px 14px 12px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--cream-line);
}
.Page-back {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  appearance: none;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  font-size: 15.5px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 6px 4px 0;
  border-radius: 8px;
}
.Page-headspace {
  justify-self: end;
}
.Page-title {
  margin: 0;
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.Page-scrollRoot {
  flex: 1;
  min-height: 0;
}
.Page-scrollView {
  width: 100%;
  height: 100%;
}
.Page-body {
  padding: 20px 18px calc(30px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 560px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}
.Page-profile {
  display: flex;
  align-items: center;
  gap: 13px;
  background: var(--cream-surface);
  border: 1px solid var(--cream-line);
  border-radius: 16px;
  padding: 14px 16px;
}
.Page-profile img {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  object-fit: cover;
}
.Page-profile div {
  display: flex;
  flex-direction: column;
}
.Page-profile strong {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}
.Page-profile span {
  font-size: 13px;
  color: var(--ink-soft);
}
.Page-groupLabel {
  display: block;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin: 0 0 7px 14px;
}
.Page-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--cream-surface);
  border: 1px solid var(--cream-line);
  border-radius: 16px;
  overflow: hidden;
}
.Page-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  font-size: 15px;
  color: var(--ink);
  border-bottom: 1px solid var(--cream-line);
}
.Page-row:last-child {
  border-bottom: none;
}
.Page-rowIcon {
  flex: none;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--cream-bg-2);
  color: var(--ink-strong);
}
.Page-rowLabel {
  flex: 1;
  font-weight: 500;
}
.Page-value {
  font-size: 14px;
  color: var(--ink-soft);
}
.Page-row > svg {
  color: #c4c9d1;
}
.Page-toggle {
  flex: none;
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: #34c759;
  position: relative;
  transition: background 200ms ease;
}
.Page-toggle i {
  position: absolute;
  top: 2px;
  left: 20px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.Page-hint {
  margin: 0;
  text-align: center;
  font-size: 13px;
  color: var(--ink-soft);
}
```
