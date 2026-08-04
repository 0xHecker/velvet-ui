# Scrollable Sheet homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
import { Scroll, Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconBook, IconClock, IconFlame, IconUsers } from "../icons.jsx";
import "./LongSheet.css";

const INGREDIENTS = [
  "2 cups all-purpose flour",
  "2 tbsp brown sugar",
  "1 tbsp baking powder",
  "½ tsp fine sea salt",
  "1¾ cups buttermilk",
  "2 large eggs",
  "4 tbsp brown butter, cooled",
  "1 tsp vanilla extract",
];

const STEPS = [
  {
    title: "Brown the butter",
    body: "Melt butter over medium heat until it foams, smells nutty, and turns amber. Set aside to cool — this is the whole flavor of the dish.",
  },
  {
    title: "Whisk the dry goods",
    body: "Flour, sugar, baking powder, and salt in a large bowl. Make a well in the center for the wet ingredients.",
  },
  {
    title: "Combine, don’t overmix",
    body: "Whisk buttermilk, eggs, vanilla, and the cooled brown butter. Pour into the well and fold until just combined — lumps are welcome.",
  },
  {
    title: "Rest the batter",
    body: "Ten minutes on the counter. The baking powder gets a head start and the griddle gets time to reach an even heat.",
  },
  {
    title: "Griddle low and slow",
    body: "A knob of butter, medium-low heat, ⅓ cup per pancake. Flip once, when the edges set and bubbles hold their shape.",
  },
  {
    title: "Serve immediately",
    body: "Maple syrup warmed with a pinch of salt, extra brown butter, and whatever fruit is in season.",
  },
];

const TIPS = [
  "No buttermilk? Milk with a spoon of lemon juice, rested five minutes, gets you 95% there.",
  "The first pancake is for the cook. Always. The griddle is still finding its temperature.",
  "Batter keeps two days in the fridge — thin it with a splash of milk before cooking.",
  "Frozen blueberries go in straight from the freezer, pressed into the wet side after pouring.",
  "For crispy edges, let the butter in the pan go one shade past melted before the batter lands.",
  "Leftovers reheat best in a toaster, never a microwave — the edges stay crisp.",
];

export const LongSheet = () => {
  return (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      <IconBook /> Open recipe
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View
        className="Recipe-view"
        side="center"
        tracks="auto"
        swipeOvershoot={false}
        nativeEdgeSwipePrevention
        enteringAnimationSettings={{
          easing: "spring",
          stiffness: 480,
          damping: 45,
          mass: 1.5,
        }}
      >
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Recipe-content" asChild>
          <Scroll.Root className="Recipe-scrollRoot" asChild>
            <Scroll.View className="Recipe-scrollView">
              <Scroll.Content className="Recipe-scrollContent">
                <div className="Recipe-innerContent">
                  <Sheet.BleedingBackground className="Recipe-bg" />
                  <Sheet.Handle className="Recipe-handle" />
                  <div className="Recipe-hero">
                    <img src={px(376464, 1080, 560)} alt="Brown butter pancakes" />
                  </div>
                  <div className="Recipe-body">
            <span className="Recipe-kicker">Weekend brunch</span>
            <Sheet.Title className="Recipe-title">Brown Butter Pancakes</Sheet.Title>
            <Sheet.Description className="Recipe-desc">
              Nutty, caramel-edged, and impossibly fluffy — the only pancake recipe worth
              memorizing. Pull down from the top anytime to get back to browsing.
            </Sheet.Description>

            <div className="Recipe-stats">
              <span>
                <IconClock size={14} /> 35 min
              </span>
              <span>
                <IconFlame size={14} /> Easy
              </span>
              <span>
                <IconUsers size={14} /> Serves 4
              </span>
            </div>

            <h3 className="Recipe-h">Ingredients</h3>
            <ul className="Recipe-ingredients">
              {INGREDIENTS.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>

            <h3 className="Recipe-h">Method</h3>
            <ol className="Recipe-steps">
              {STEPS.map((s, idx) => (
                <li key={s.title} className="Recipe-step">
                  <span className="Recipe-stepNum">{idx + 1}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <h3 className="Recipe-h">Notes from the kitchen</h3>
            <ul className="Recipe-tips">
              {TIPS.map((t, i) => (
                <li key={i} className="Recipe-tip">
                  {t}
                </li>
              ))}
            </ul>

                    <div className="Recipe-footer">
                      <img src={px(302899, 320, 200)} alt="" />
                      <p>Pairs well with a slow latte. Recipe by the Velvet test kitchen.</p>
                    </div>
                  </div>
                </div>
              </Scroll.Content>
            </Scroll.View>
          </Scroll.Root>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
  );
};
```

## CSS

```css
.Recipe-view {
  height: var(--velvet-100lvh);
}
.Recipe-content {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-width: 620px;
  background: transparent;
}
.Recipe-scrollRoot,
.Recipe-scrollView {
  width: 100%;
  height: 100%;
  scroll-behavior: smooth;
}
.Recipe-scrollContent {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  height: auto;
  padding-top: max(10px, env(safe-area-inset-top));
  display: grid;
  place-items: start center;
}
.Recipe-innerContent {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: 28px 28px 0 0;
}
.Recipe-bg {
  border-radius: 28px 28px 0 0;
  background: var(--cream-surface);
  box-shadow: 0 -20px 50px -20px rgba(60, 45, 30, 0.2);
}
.Recipe-handle {
  display: block;
  margin: 8px auto 14px;
  background: #d8dce2;
}
.Recipe-hero {
  margin: 0 16px;
  border-radius: 18px;
  overflow: hidden;
}
.Recipe-hero img {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: cover;
}
.Recipe-body {
  padding: 20px 26px calc(40px + env(safe-area-inset-bottom));
}
.Recipe-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b45309;
}
.Recipe-title {
  margin: 8px 0 0;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--ink);
}
.Recipe-desc {
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink-soft);
}
.Recipe-stats {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.Recipe-stats span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-strong);
  background: var(--cream-bg-2);
  border: 1px solid var(--cream-line);
  padding: 7px 12px;
  border-radius: 999px;
}
.Recipe-h {
  margin: 26px 0 12px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.Recipe-ingredients {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.Recipe-ingredients li {
  font-size: 14px;
  color: var(--ink-strong);
  background: var(--cream-bg-2);
  border: 1px solid var(--cream-line);
  border-radius: 12px;
  padding: 10px 12px;
}
.Recipe-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.Recipe-step {
  display: flex;
  gap: 14px;
}
.Recipe-stepNum {
  flex: none;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.Recipe-step strong {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 3px;
}
.Recipe-step p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink-soft);
}
.Recipe-tips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.Recipe-tip {
  position: relative;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ink-soft);
  padding-left: 22px;
}
.Recipe-tip::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 8px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #f59e0b;
}
.Recipe-footer {
  margin-top: 28px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--cream-bg-2);
  border: 1px solid var(--cream-line);
  border-radius: 16px;
}
.Recipe-footer img {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
}
.Recipe-footer p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--ink-soft);
}
```
