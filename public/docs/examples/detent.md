# Detent Sheet homepage demo source

> This source was captured with the Velvet UI 0.3.0 documentation. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/0.3.0/gallery-recipes

## JSX

```jsx
import { Scroll, Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconChevronUp, IconMusic, IconPlay } from "../icons.jsx";
import "./DetentSheet.css";

const QUEUE = [
  { title: "Midnight Drive", artist: "The Velvets", time: "3:42", art: px(1763075, 160, 160), playing: true },
  { title: "Northern Lights", artist: "Aurora Fields", time: "4:05", art: px(167636, 160, 160) },
  { title: "Encore", artist: "Stageleft", time: "2:58", art: px(1105666, 160, 160) },
  { title: "Red Smoke", artist: "The Velvets", time: "3:21", art: px(1540406, 160, 160) },
  { title: "Cathedral", artist: "Low Waves", time: "5:11", art: px(1190297, 160, 160) },
  { title: "Six-String Hymn", artist: "Dusty Rivers", time: "3:33", art: px(167472, 160, 160) },
  { title: "All We Have Is Now", artist: "Neon Signs", time: "4:44", art: px(1580625, 160, 160) },
  { title: "Stargazer", artist: "Aurora Fields", time: "3:57", art: px(572897, 160, 160) },
  { title: "Alpenglow", artist: "Low Waves", time: "4:29", art: px(1287145, 160, 160) },
  { title: "City Limits", artist: "Neon Signs", time: "3:08", art: px(1034662, 160, 160) },
  { title: "Velvet Sky", artist: "The Velvets", time: "4:51", art: px(2014422, 160, 160) },
];

export const DetentSheet = () => (
  <Sheet.Root defaultSnap={1}>
    <Sheet.Trigger className="Btn">
      <IconMusic /> Open queue
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Queue-view" snapPoints="58%">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => Math.min(progress * 0.5, 0.5) }} />
        <Sheet.Content className="Queue-content">
          <Sheet.BleedingBackground className="Queue-bg" />
          <Sheet.Handle className="Queue-handle" />
          <div className="Queue-head">
            <div>
              <Sheet.Title className="Queue-title">Up Next</Sheet.Title>
              <p className="Queue-sub">11 tracks · 44 min</p>
            </div>
            <Sheet.Trigger action={{ type: "step", direction: "up" }} className="Queue-expand DetentSheet-expand" aria-label="Expand queue">
              <IconChevronUp size={16} />
            </Sheet.Trigger>
          </div>
          <Scroll.Root className="Queue-scrollRoot">
            <Scroll.View className="Queue-scrollView">
              <Scroll.Content asChild>
                <ul className="Queue-list">
                  {QUEUE.map((t) => (
                    <li key={t.title} className="Queue-item" data-playing={t.playing || undefined}>
                      <img className="Queue-art" src={t.art} alt="" />
                      <div className="Queue-meta">
                        <strong>{t.title}</strong>
                        <span>{t.artist}</span>
                      </div>
                      {t.playing ? (
                        <span className="Queue-eq" aria-label="Now playing">
                          <i /><i /><i />
                        </span>
                      ) : (
                        <span className="Queue-time">{t.time}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </Scroll.Content>
            </Scroll.View>
          </Scroll.Root>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
```

## CSS

```css
.Queue-view {
  height: var(--velvet-100lvh);
}
.Queue-content {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-width: 480px;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px 0 calc(14px + env(safe-area-inset-bottom));
}
.Queue-bg {
  border-radius: 24px 24px 0 0;
  background: #101013;
  box-shadow: 0 -20px 50px -20px rgba(0, 0, 0, 0.55);
}
.Queue-handle {
  margin: 6px auto 12px;
  background: #3a3a40;
}
.Queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px 14px;
}
.Queue-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fafafa;
}
.Queue-sub {
  margin: 3px 0 0;
  font-size: 13px;
  color: #8b8b93;
}
.Queue-expand {
  appearance: none;
  border: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #1e1e22;
  color: #d4d4d8;
  cursor: pointer;
  transition: background 160ms ease, transform 160ms var(--ease);
}
.Queue-expand:hover {
  background: #2a2a30;
}
.Queue-expand:active {
  transform: scale(0.9);
}
.Queue-scrollRoot {
  flex: 1 1 auto;
  min-height: 0;
}
.Queue-scrollView {
  width: 100%;
  height: 100%;
}
.Queue-list {
  list-style: none;
  margin: 0;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
}
.Queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 12px;
  transition: background 160ms ease;
}
.Queue-item:hover {
  background: #1a1a1f;
}
.Queue-item[data-playing] {
  background: #1a1a1f;
}
.Queue-art {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 9px;
  object-fit: cover;
}
.Queue-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.Queue-meta strong {
  font-size: 14.5px;
  font-weight: 600;
  color: #fafafa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.Queue-meta span {
  font-size: 12.5px;
  color: #8b8b93;
}
.Queue-time {
  font-size: 12.5px;
  color: #8b8b93;
  font-variant-numeric: tabular-nums;
}
/* Fake equalizer bars for the playing row — pure CSS. */
.Queue-eq {
  display: flex;
  align-items: flex-end;
  gap: 2.5px;
  height: 16px;
}
.Queue-eq i {
  width: 3px;
  border-radius: 2px;
  background: #e879f9;
  animation: QueueEq 900ms ease-in-out infinite;
}
.Queue-eq i:nth-child(1) {
  height: 60%;
}
.Queue-eq i:nth-child(2) {
  height: 100%;
  animation-delay: 240ms;
}
.Queue-eq i:nth-child(3) {
  height: 40%;
  animation-delay: 480ms;
}
@keyframes QueueEq {
  0%,
  100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .Queue-eq i {
    animation: none;
  }
}
```
