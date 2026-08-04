# Persistent Sheet homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
import { Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import {
  IconChevronUp,
  IconClose,
  IconHeart,
  IconMusic,
  IconNext,
  IconPlay,
  IconPrev,
  IconRepeat,
  IconShuffle,
} from "../icons.jsx";
import "./PersistentSheet.css";

export const PersistentSheet = () => (
  <Sheet.Root defaultSnap={1}>
    <Sheet.Trigger className="Btn">
      <IconMusic /> Show player
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View
        className="Player-view"
        snapPoints="96px"
        dismissible={false}
        modal={false}
      >
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => Math.max(0, progress - 0.35) * 0.8 }} />
        <Sheet.Content className="Player-content">
          <Sheet.BleedingBackground className="Player-bg" />
          <Sheet.Handle className="Player-handle" />

          <div className="Player-bar">
            <img className="Player-art" src={px(1763075, 160, 160)} alt="Midnight Drive album art" />
            <div className="Player-meta">
              <Sheet.Title className="Player-title">Midnight Drive</Sheet.Title>
              <p className="Player-artist">The Velvets</p>
            </div>
            <button className="Player-iconBtn" aria-label="Play">
              <IconPlay size={17} />
            </button>
            <Sheet.Trigger action={{ type: "step", direction: "up" }} className="Player-iconBtn" aria-label="Expand player">
              <IconChevronUp size={16} />
            </Sheet.Trigger>
            <Sheet.Trigger action="close" className="Player-iconBtn" aria-label="Close player">
              <IconClose size={15} />
            </Sheet.Trigger>
          </div>

          <div className="Player-full">
            <img className="Player-bigArt" src={px(1763075, 720, 720)} alt="" />
            <Sheet.Description className="Player-desc">
              A persistent sheet — it rests as a mini player, expands to full, and swiping down
              can never dismiss it by accident.
            </Sheet.Description>
            <div className="Player-progress">
              <span>1:12</span>
              <div className="Player-track">
                <i style={{ width: "38%" }} />
              </div>
              <span>3:42</span>
            </div>
            <div className="Player-controls">
              <button className="Player-ctl" aria-label="Shuffle">
                <IconShuffle size={18} />
              </button>
              <button className="Player-ctl" aria-label="Previous">
                <IconPrev size={20} />
              </button>
              <button className="Player-playMain" aria-label="Play">
                <IconPlay size={22} />
              </button>
              <button className="Player-ctl" aria-label="Next">
                <IconNext size={20} />
              </button>
              <button className="Player-ctl" aria-label="Repeat">
                <IconRepeat size={18} />
              </button>
            </div>
            <button className="Player-like">
              <IconHeart size={15} /> Add to favorites
            </button>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
```

## CSS

```css
.Player-view {
  height: var(--velvet-100lvh);
}
.Player-content {
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.Player-bg {
  border-radius: 22px 22px 0 0;
  background: #101013;
  box-shadow: 0 -16px 44px -18px rgba(0, 0, 0, 0.55);
}
.Player-handle {
  margin: 7px auto 8px;
  background: #3a3a40;
}
.Player-bar {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 16px 10px;
}
.Player-art {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  object-fit: cover;
  flex: none;
  box-shadow: 0 4px 14px -4px rgba(0, 0, 0, 0.5);
}
.Player-meta {
  flex: 1;
  min-width: 0;
}
.Player-title {
  display: block;
  margin: 0;
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #fafafa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.Player-artist {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: #8b8b93;
}
.Player-iconBtn {
  flex: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  appearance: none;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #d4d4d8;
  cursor: pointer;
  transition: background 160ms ease, transform 160ms var(--ease);
}
.Player-iconBtn:hover {
  background: #1e1e22;
}
.Player-iconBtn:active {
  transform: scale(0.88);
}
.Player-full {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 26px calc(22px + env(safe-area-inset-bottom));
}
.Player-bigArt {
  width: min(64vw, 250px);
  aspect-ratio: 1;
  border-radius: 18px;
  object-fit: cover;
  box-shadow: 0 24px 60px -18px rgba(0, 0, 0, 0.6);
}
.Player-desc {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  color: #8b8b93;
  max-width: 340px;
}
.Player-progress {
  width: 100%;
  max-width: 340px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  font-size: 11.5px;
  color: #8b8b93;
  font-variant-numeric: tabular-nums;
}
.Player-track {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: #2a2a30;
  overflow: hidden;
}
.Player-track i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #e879f9;
}
.Player-controls {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 18px;
}
.Player-ctl {
  appearance: none;
  border: none;
  background: none;
  color: #a1a1aa;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, transform 160ms var(--ease);
}
.Player-ctl:hover {
  color: #fafafa;
  background: #1e1e22;
}
.Player-ctl:active {
  transform: scale(0.88);
}
.Player-playMain {
  appearance: none;
  border: none;
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #fafafa;
  color: #101013;
  cursor: pointer;
  box-shadow: 0 10px 26px -8px rgba(255, 255, 255, 0.25);
  transition: transform 160ms var(--ease);
}
.Player-playMain:active {
  transform: scale(0.92);
}
.Player-like {
  appearance: none;
  border: 1px solid #2a2a30;
  background: transparent;
  color: #d4d4d8;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  padding: 9px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
}
.Player-like:hover {
  background: #1a1a1f;
}
```
