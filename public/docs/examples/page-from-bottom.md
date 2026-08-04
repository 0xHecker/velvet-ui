# Full-Screen Sheet homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
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
          <Sheet.BleedingBackground className="PageBottom-bg" />
          <Sheet.Handle className="PageBottom-handle" />
          <header className="PageBottom-head">
            <Sheet.Trigger action="close" className="PageBottom-cancel">
              Cancel
            </Sheet.Trigger>
            <Sheet.Title className="PageBottom-title">New Note</Sheet.Title>
            <Sheet.Trigger action="close" className="PageBottom-done">
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
```

## CSS

```css
.PageBottom-view {
  height: var(--velvet-100lvh);
}
.PageBottom-content {
  box-sizing: border-box;
  width: 100%;
  height: calc(var(--velvet-100lvh) - 28px); /* parent peeks behind the rounded top */
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 12px 12px 0 0;
}
.PageBottom-bg {
  border-radius: 12px 12px 0 0;
  background: var(--cream-surface);
  box-shadow: 0 -12px 40px -18px rgba(0, 0, 0, 0.3);
}
.PageBottom-handle {
  margin: 8px auto 4px;
  background: var(--grabber);
}
.PageBottom-head {
  width: 100%;
  max-width: 640px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 8px 18px 12px;
  border-bottom: 1px solid var(--cream-line);
}
.PageBottom-title {
  margin: 0;
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-align: center;
  color: var(--ink);
}
.PageBottom-cancel,
.PageBottom-done {
  appearance: none;
  border: none;
  background: none;
  font: inherit;
  font-size: 15.5px;
  cursor: pointer;
  padding: 4px;
  color: var(--ink-soft);
}
.PageBottom-cancel {
  justify-self: start;
}
.PageBottom-done {
  justify-self: end;
  font-weight: 700;
  color: var(--ink);
}
.PageBottom-toolbar {
  width: 100%;
  max-width: 640px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--cream-line);
}
.PageBottom-toolbar button {
  appearance: none;
  border: none;
  background: none;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: var(--ink-strong);
  cursor: pointer;
  transition: background 140ms ease;
}
.PageBottom-toolbar button:hover {
  background: var(--cream-bg-2);
}
.PageBottom-sep {
  width: 1px;
  height: 20px;
  background: var(--cream-line);
  margin: 0 6px;
}
.PageBottom-body {
  width: 100%;
  max-width: 640px;
  box-sizing: border-box;
  flex: 1;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}
.PageBottom-titleField {
  appearance: none;
  border: none;
  outline: none;
  background: none;
  font: inherit;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
  padding: 6px 2px;
}
.PageBottom-titleField::placeholder {
  color: #c4c9d1;
}
.PageBottom-field {
  appearance: none;
  border: none;
  outline: none;
  resize: none;
  background: none;
  font: inherit;
  font-size: 15.5px;
  line-height: 1.65;
  color: var(--ink-soft);
  padding: 6px 2px;
  flex: 1;
}
```
