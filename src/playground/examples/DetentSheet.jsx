import { Sheet } from "../../velvet/index.js";
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
  <Sheet.Root defaultActiveDetent={1}>
    <Sheet.Trigger className="Btn">
      <IconMusic /> Open queue
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Queue-view" detents="58lvh">
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
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
