import { Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconBag, IconChevronR } from "../icons.jsx";
import "./DetachedSheet.css";

export const DetachedSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      Quick view <IconChevronR />
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Detached-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Detached-content">
          <Sheet.Handle className="Detached-handle" />
          <div className="Detached-hero">
            <img src={px(190819, 800, 480)} alt="Meridian chronograph watch" />
            <span className="Detached-flag">Only 3 left</span>
          </div>
          <div className="Detached-body">
            <div className="Detached-titleRow">
              <Sheet.Title className="Detached-title">Meridian Chrono 40</Sheet.Title>
              <strong className="Detached-price">$1,250</strong>
            </div>
            <Sheet.Description className="Detached-desc">
              Brushed steel, sapphire crystal, and a movement with a 60-hour reserve. A detached
              sheet — it floats inset from every edge, like a card lifted off the table.
            </Sheet.Description>
            <div className="Detached-actions">
              <Sheet.Trigger action="dismiss" className="Btn Btn--primary">
                <IconBag size={15} /> Add to bag
              </Sheet.Trigger>
              <Sheet.Trigger action="dismiss" className="Btn Btn--soft">
                Details
              </Sheet.Trigger>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
