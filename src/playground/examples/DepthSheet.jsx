import { Sheet, SheetStack } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconCalendar, IconChevronR, IconPin, IconPlus, IconUsers } from "../icons.jsx";
import "./DepthSheet.css";

const depth = {
  translateY: ({ progress }) =>
    progress <= 1 ? `${progress * -10}px` : `calc(-12.5px + 2.5px * ${progress})`,
  scale: [1, 0.933],
  transformOrigin: "50% 0",
};

const TRAVELERS = [
  { name: "Ava Laurent", email: "ava@studio.co", avatar: px(733872, 96, 96), added: true },
  { name: "Marcus Reid", email: "marcus@studio.co", avatar: px(614810, 96, 96), added: true },
  { name: "Sofia Nguyen", email: "sofia@studio.co", avatar: px(1239291, 96, 96), added: false },
];

export const DepthSheet = () => (
  <SheetStack.Root>
    <Sheet.Root>
      <Sheet.Trigger className="Btn">
        Plan a trip <IconChevronR />
      </Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.View className="Depth-view">
          <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.2] }} />
          <Sheet.Content className="Depth-content" stackingAnimation={depth}>
            <Sheet.BleedingBackground className="Depth-bg" />
            <Sheet.Handle className="Depth-handle" />
            <div className="Depth-hero">
              <img src={px(3601425, 900, 480)} alt="Island lagoon" />
            </div>
            <div className="Depth-body">
              <Sheet.Title className="Depth-title">Islands, finally</Sheet.Title>
              <Sheet.Description className="Depth-desc">
                <span className="Depth-fact">
                  <IconPin size={14} /> North Malé Atoll
                </span>
                <span className="Depth-fact">
                  <IconCalendar size={14} /> Mar 8 – 15
                </span>
              </Sheet.Description>
              <Sheet.Root>
                <Sheet.Trigger className="Btn Btn--primary Depth-cta">
                  <IconUsers size={15} /> Add travelers
                </Sheet.Trigger>
                <Sheet.Portal>
                  <Sheet.View className="Depth-view">
                    <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.2] }} />
                    <Sheet.Content className="Depth-content" stackingAnimation={depth}>
                      <Sheet.BleedingBackground className="Depth-bg" />
                      <Sheet.Handle className="Depth-handle" />
                      <div className="Depth-body">
                        <Sheet.Title className="Depth-title">Travelers</Sheet.Title>
                        <Sheet.Description className="Depth-desc2">
                          Everyone gets the itinerary. The trip sheet waits behind this one — in real
                          depth, not a fake fade.
                        </Sheet.Description>
                        <ul className="Depth-people">
                          {TRAVELERS.map((t) => (
                            <li key={t.email} className="Depth-person">
                              <img src={t.avatar} alt="" />
                              <div className="Depth-personMeta">
                                <strong>{t.name}</strong>
                                <span>{t.email}</span>
                              </div>
                              {t.added ? (
                                <span className="Depth-added">Added</span>
                              ) : (
                                <button className="Depth-addBtn" aria-label={`Add ${t.name}`}>
                                  <IconPlus size={15} />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                        <Sheet.Trigger action="dismiss" className="Btn Btn--primary Depth-cta">
                          Send invites
                        </Sheet.Trigger>
                      </div>
                    </Sheet.Content>
                  </Sheet.View>
                </Sheet.Portal>
              </Sheet.Root>
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  </SheetStack.Root>
);
