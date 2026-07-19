import { Sheet } from "../../velvet/index.js";
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

export const LongSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      <IconBook /> Open recipe
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Recipe-view">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Recipe-content">
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
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
