# Shared-origin motion

> SheetMorph starts content at the trigger or a supplied element’s measured geometry, then settles it into its authored layout.

Web: https://velvetui.co/docs/shared-origin-motion

Shared-origin motion visually connects a trigger to its expanded surface. It is opt-in so ordinary sheets do not pay for geometry measurement.

## Expand from the trigger

```tsx
import { SheetMorph } from "@velvetui/react/sheet-morph";

<Sheet.Root>
  <Sheet.Trigger className="story-card">Read story</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.View side="center" tracks={["top", "bottom"]}>
      <SheetMorph.Content from="trigger" className="story-modal">
        <Story />
      </SheetMorph.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet.Root>
```

The destination still needs authored width, height, and radius. Velvet measures both rectangles and folds the difference into the same interruptible sheet spring.

## When not to use it

Skip morphing when the source and destination have unrelated content, when the source may unmount during navigation, or when the visual connection makes a simple task feel slower.
