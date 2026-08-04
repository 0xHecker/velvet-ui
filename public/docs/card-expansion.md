# Card Expansion

> CardExpansion opens a card into a focused modal surface while retaining the scale and edge response expected from a lightbox.

Web: https://velvetui.co/docs/card-expansion

Card Expansion keeps the resting card simple. On open, it becomes a centered modal surface with shared-origin motion and the scale response of a lightbox.

## Modal card

```tsx
import { CardExpansion } from "@velvetui/react/card-expansion";
import "@velvetui/react/card-expansion.css";

<CardExpansion.Root>
  <CardExpansion.Trigger asChild>
    <article className="story-card"><StorySummary /></article>
  </CardExpansion.Trigger>
  <CardExpansion.Content scroll={false}>
    <CardExpansion.Title>Designing motion that feels real</CardExpansion.Title>
    <StoryPreview />
    <CardExpansion.Close>Close</CardExpansion.Close>
  </CardExpansion.Content>
</CardExpansion.Root>
```

The trigger stays a normal card. The content is a modal with focus containment, inert background behavior, Escape support, and upward or downward swipe dismissal.

## Scrollable content

Set `scroll` when the expanded card exceeds the viewport. Keep the header or close control outside the scroll region if it must remain reachable on small devices.

Use `from={null}` when the source should not morph. The modal still scales with travel and dismisses bidirectionally.
