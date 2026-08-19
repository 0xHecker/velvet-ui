# Card Expansion homepage demo source

> This source was captured with the Velvet UI 0.3.0 documentation. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/0.3.0/gallery-recipes

## JSX

```jsx
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
```

## CSS

```css
.Card2-content {
  box-sizing: border-box;
  width: min(86vw, 380px);
  height: auto;
  background: var(--cream-surface);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 30px 70px -24px rgba(0, 0, 0, 0.4);
}
.Card2-cover {
  position: relative;
  height: 190px;
}
.Card2-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.Card2-kicker {
  position: absolute;
  left: 14px;
  top: 14px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 6px 11px;
  border-radius: 999px;
}
.Card2-body {
  padding: 16px 20px 20px;
}
.Card2-title {
  display: block;
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--ink);
}
.Card2-desc {
  margin: 9px 0 16px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--ink-soft);
}
.Card2-byline {
  display: flex;
  align-items: center;
  gap: 10px;
}
.Card2-byline > img {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  object-fit: cover;
}
.Card2-author {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.Card2-author strong {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}
.Card2-author span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-soft);
}
.Card2-cta {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 9px 16px;
}
```
