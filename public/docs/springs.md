# Springs

> Presets make interaction tuning consistent across a product while retaining an escape hatch for custom physical values.

Web: https://velvetui.co/docs/springs

Named spring presets make motion consistent. Custom values are an escape hatch for a deliberate material change, not a requirement for each component.

## Presets

- `gentle` — slow and soft.
- `smooth` — balanced default with little overshoot.
- `snappy` — quick with a small amount of life.
- `brisk` — fast dismissal response.
- `bouncy` — visible overshoot.
- `elastic` — loose, expressive motion.

```tsx
import { SPRING_PRESETS } from "@velvetui/react/motion";

<Sheet.View
  enteringAnimationSettings="snappy"
  exitingAnimationSettings="brisk"
/>
```

## Custom physics

```tsx
<Sheet.View enteringAnimationSettings={{
  easing: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.9,
}} />
```

Always test a custom spring after an interrupted drag. A value that looks good from rest may feel wrong when it inherits real gesture momentum.
