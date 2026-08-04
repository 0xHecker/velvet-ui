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
