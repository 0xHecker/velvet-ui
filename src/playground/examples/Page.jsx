import { Sheet } from "../../velvet/index.js";
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
      <Sheet.View className="Page-view" contentPlacement="right" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.18 }} />
        <Sheet.Content className="Page-content">
          <header className="Page-head">
            <Sheet.Trigger action="dismiss" className="Page-back">
              <IconChevronL size={17} /> Back
            </Sheet.Trigger>
            <Sheet.Title className="Page-title">Settings</Sheet.Title>
            <span className="Page-headspace" />
          </header>
          <div className="Page-body">
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
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
