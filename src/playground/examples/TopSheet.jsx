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
      <Sheet.View className="TopSheet-view" contentPlacement="top">
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
              <Sheet.Trigger action="dismiss" className="TopSheet-action">
                <IconMessage size={14} /> Reply
              </Sheet.Trigger>
              <Sheet.Trigger action="dismiss" className="TopSheet-action">Mark as read</Sheet.Trigger>
            </div>
          </div>
          <Sheet.Handle className="TopSheet-handle" />
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
