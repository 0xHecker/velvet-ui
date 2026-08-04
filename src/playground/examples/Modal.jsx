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
