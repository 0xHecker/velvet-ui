import { Sheet } from "../../velvet/index.js";
import "./Page.css";

const rows = ["Profile", "Notifications", "Privacy", "Appearance", "About"];

export const Page = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Page</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Page-view" contentPlacement="right" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.18 }} />
        <Sheet.Content className="Page-content">
          <header className="Page-head">
            <Sheet.Trigger action="dismiss" className="Page-back">
              ‹ Back
            </Sheet.Trigger>
            <Sheet.Title className="Page-title">Settings</Sheet.Title>
            <span className="Page-headspace" />
          </header>
          <div className="Page-body">
            <Sheet.Description className="Page-desc">
              A full-screen page that pushes in from the side like a navigation push. Swipe back or
              tap Back to return.
            </Sheet.Description>
            <ul className="Page-list">
              {rows.map((r) => (
                <li key={r} className="Page-row">
                  {r}
                  <span className="Page-chevron">›</span>
                </li>
              ))}
            </ul>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
