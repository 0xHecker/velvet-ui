import { CardExpansion } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconBook, IconChevronR, IconClock } from "../icons.jsx";
import "./Card.css";

export const Card = () => (
  <CardExpansion.Root>
    <CardExpansion.Trigger className="Btn">
      <IconBook /> Read article
    </CardExpansion.Trigger>
    <CardExpansion.Content
      className="Card2-content"
      scroll={false}
      from={null}
      travelAnimation={{
        transform: ({ tween }) => `scale(${tween(0.88, 1)})`,
        opacity: ({ progress }) => Math.min(progress * 1.8, 1),
      }}
    >
      <div className="Card2-cover">
        <img src={px(196644, 900, 520)} alt="Interface sketches on a notebook" />
        <span className="Card2-kicker">Featured · Motion</span>
      </div>
      <div className="Card2-body">
        <CardExpansion.Title className="Card2-title">
          Designing Motion That Feels Real
        </CardExpansion.Title>
        <CardExpansion.Description className="Card2-desc">
          Great interfaces don&apos;t animate — they move. The difference is
          physics: velocity, springs, and gestures that keep their momentum
          instead of restarting it.
        </CardExpansion.Description>
        <div className="Card2-byline">
          <img src={px(415829, 96, 96)} alt="Hana Yuki" />
          <div className="Card2-author">
            <strong>Hana Yuki</strong>
            <span>
              <IconClock size={12} /> 6 min read
            </span>
          </div>
          <CardExpansion.Close className="Btn Btn--primary Card2-cta">
            Read <IconChevronR size={14} />
          </CardExpansion.Close>
        </div>
      </div>
    </CardExpansion.Content>
  </CardExpansion.Root>
);
