import { Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconBook, IconChevronR, IconClock } from "../icons.jsx";
import "./Card.css";

export const Card = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      <IconBook /> Read article
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Card2-view" contentPlacement="center">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.5 }} />
        <Sheet.Content
          className="Card2-content"
          travelAnimation={{
            opacity: ({ progress }) => Math.min(progress * 2, 1),
            transform: ({ tween }) => `scale(${tween(0.82, 1)})`,
          }}
        >
          <div className="Card2-cover">
            <img src={px(196644, 900, 520)} alt="Interface sketches on a notebook" />
            <span className="Card2-kicker">Featured · Motion</span>
          </div>
          <div className="Card2-body">
            <Sheet.Title className="Card2-title">Designing Motion That Feels Real</Sheet.Title>
            <Sheet.Description className="Card2-desc">
              Great interfaces don't animate — they move. The difference is physics: velocity,
              springs, and gestures that keep their momentum instead of restarting it.
            </Sheet.Description>
            <div className="Card2-byline">
              <img src={px(415829, 96, 96)} alt="Hana Yuki" />
              <div className="Card2-author">
                <strong>Hana Yuki</strong>
                <span>
                  <IconClock size={12} /> 6 min read
                </span>
              </div>
              <Sheet.Trigger action="dismiss" className="Btn Btn--primary Card2-cta">
                Read <IconChevronR size={14} />
              </Sheet.Trigger>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
