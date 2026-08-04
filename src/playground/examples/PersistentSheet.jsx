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
