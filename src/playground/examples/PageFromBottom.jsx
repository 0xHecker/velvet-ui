import { Sheet } from "../../velvet/index.js";
import { IconBold, IconChevronR, IconImage, IconItalic, IconList, IconPlus } from "../icons.jsx";
import "./PageFromBottom.css";

export const PageFromBottom = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      <IconPlus /> New note
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="PageBottom-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.25 }} />
        <Sheet.Content className="PageBottom-content">
          <Sheet.Handle className="PageBottom-handle" />
          <header className="PageBottom-head">
            <Sheet.Trigger action="dismiss" className="PageBottom-cancel">
              Cancel
            </Sheet.Trigger>
            <Sheet.Title className="PageBottom-title">New Note</Sheet.Title>
            <Sheet.Trigger action="dismiss" className="PageBottom-done">
              Save
            </Sheet.Trigger>
          </header>
          <div className="PageBottom-toolbar" role="toolbar" aria-label="Formatting">
            <button aria-label="Bold"><IconBold size={16} /></button>
            <button aria-label="Italic"><IconItalic size={16} /></button>
            <button aria-label="List"><IconList size={16} /></button>
            <span className="PageBottom-sep" />
            <button aria-label="Add image"><IconImage size={16} /></button>
          </div>
          <div className="PageBottom-body">
            <input className="PageBottom-titleField" placeholder="Title" defaultValue="Ideas for the launch" aria-label="Note title" />
            <textarea
              className="PageBottom-field"
              aria-label="Note body"
              defaultValue={`Ship the gallery redesign — every pattern gets a real product demo.

- Booking flow for the bottom sheet
- Queue with detents for the music app
- Lightbox with real photos

The motion sells it: swipe down and the whole page springs away with native momentum.`}
            />
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
