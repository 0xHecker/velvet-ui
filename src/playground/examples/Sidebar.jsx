import { Sheet } from "../../velvet/index.js";
import "./Sidebar.css";

export const Sidebar = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Sidebar</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Sidebar-view" contentPlacement="right">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Sidebar-content">
          <Sheet.BleedingBackground className="Sidebar-bg" />
          <div className="Sidebar-body">
            <Sheet.Title className="Sidebar-title">Workspace</Sheet.Title>
            <nav className="Sidebar-nav">
              <a className="Sidebar-link" href="#0">Overview</a>
              <a className="Sidebar-link" href="#0">Projects</a>
              <a className="Sidebar-link" href="#0">Members</a>
              <a className="Sidebar-link" href="#0">Settings</a>
            </nav>
            <Sheet.Trigger action="dismiss" className="Btn Btn--soft">Close</Sheet.Trigger>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
