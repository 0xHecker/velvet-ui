# Navigation Drawer homepage demo source

> This source was captured with the Velvet UI 0.3.0 documentation. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/0.3.0/gallery-recipes

## JSX

```jsx
import { Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import {
  IconBell,
  IconChevronR,
  IconCompass,
  IconFolder,
  IconGear,
  IconHome,
  IconSearch,
  IconUsers,
} from "../icons.jsx";
import "./Sidebar.css";

const NAV = [
  { icon: IconHome, label: "Overview", active: true },
  { icon: IconFolder, label: "Projects", badge: "12" },
  { icon: IconUsers, label: "Members" },
  { icon: IconBell, label: "Activity", badge: "3" },
  { icon: IconCompass, label: "Explore" },
  { icon: IconGear, label: "Settings" },
];

const MEMBERS = [px(733872, 80, 80), px(614810, 80, 80), px(1239291, 80, 80), px(415829, 80, 80)];

export const Sidebar = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      Open workspace <IconChevronR />
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Sidebar-view" side="right">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Sidebar-content">
          <Sheet.BleedingBackground className="Sidebar-bg" />
          <div className="Sidebar-body">
            <div className="Sidebar-brand">
              <span className="Sidebar-logo">V</span>
              <div className="Sidebar-brandMeta">
                <Sheet.Title className="Sidebar-title">Velvet Studio</Sheet.Title>
                <span className="Sidebar-plan">Pro workspace</span>
              </div>
              <IconSearch size={17} />
            </div>

            <nav className="Sidebar-nav">
              {NAV.map(({ icon: Icon, label, active, badge }) => (
                <a key={label} className="Sidebar-link" data-active={active} href="#0" onClick={(e) => e.preventDefault()}>
                  <Icon size={17} />
                  <span>{label}</span>
                  {badge && <em className="Sidebar-badge">{badge}</em>}
                </a>
              ))}
            </nav>

            <div className="Sidebar-section">
              <span className="Sidebar-sectionLabel">Design team</span>
              <div className="Sidebar-members">
                {MEMBERS.map((src) => (
                  <img key={src} src={src} alt="" className="Sidebar-avatar" />
                ))}
                <span className="Sidebar-more">+9</span>
              </div>
            </div>

            <div className="Sidebar-user">
              <img src={px(1181686, 96, 96)} alt="Rachel Torres" className="Sidebar-userAvatar" />
              <div className="Sidebar-userMeta">
                <strong>Rachel Torres</strong>
                <span>rachel@velvet.studio</span>
              </div>
              <Sheet.Trigger action="close" className="Sidebar-close" aria-label="Close sidebar">
                <IconChevronR size={16} />
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
.Sidebar-view {
  height: var(--velvet-100lvh);
}
.Sidebar-content {
  box-sizing: border-box;
  width: min(340px, 88vw);
  height: 100%;
  display: flex;
  flex-direction: column;
}
.Sidebar-bg {
  background: var(--cream-surface);
  box-shadow: -30px 0 60px -30px rgba(60, 45, 30, 0.35);
}
.Sidebar-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 22px 18px calc(18px + env(safe-area-inset-bottom));
}
.Sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 6px 18px;
  color: var(--ink-soft);
}
.Sidebar-logo {
  flex: none;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--ink);
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.Sidebar-brandMeta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.Sidebar-title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.Sidebar-plan {
  font-size: 12.5px;
  color: var(--ink-soft);
}
.Sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.Sidebar-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ink-soft);
  text-decoration: none;
  transition: background 160ms ease, color 160ms ease;
}
.Sidebar-link:hover {
  background: var(--cream-bg-2);
  color: var(--ink);
}
.Sidebar-link[data-active="true"] {
  background: var(--cream-bg-2);
  color: var(--ink);
  font-weight: 600;
}
.Sidebar-link span {
  flex: 1;
}
.Sidebar-badge {
  font-style: normal;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--ink-soft);
  background: var(--cream-bg-2);
  border: 1px solid var(--cream-line);
  padding: 2px 8px;
  border-radius: 999px;
}
.Sidebar-link[data-active="true"] .Sidebar-badge {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.Sidebar-section {
  margin-top: 22px;
  padding: 16px 6px 0;
  border-top: 1px solid var(--cream-line);
}
.Sidebar-sectionLabel {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.Sidebar-members {
  display: flex;
  align-items: center;
  margin-top: 12px;
}
.Sidebar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid var(--cream-surface);
  margin-left: -8px;
}
.Sidebar-avatar:first-child {
  margin-left: 0;
}
.Sidebar-more {
  margin-left: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-soft);
}
.Sidebar-user {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 6px 0;
  border-top: 1px solid var(--cream-line);
}
.Sidebar-userAvatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  object-fit: cover;
}
.Sidebar-userMeta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.Sidebar-userMeta strong {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.Sidebar-userMeta span {
  font-size: 12.5px;
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.Sidebar-close {
  appearance: none;
  border: none;
  background: var(--cream-bg-2);
  color: var(--ink-soft);
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, transform 160ms var(--ease);
}
.Sidebar-close:hover {
  color: var(--ink);
}
.Sidebar-close:active {
  transform: scale(0.9);
}
```
