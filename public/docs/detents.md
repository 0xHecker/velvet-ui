# Detents

> Snap points create intermediate resting positions without a separate gesture implementation.

Web: https://velvetui.co/docs/detents

Detents are ordered CSS lengths measured along the sheet axis. Velvet adds the fully open content length after the supplied stops, so you declare intermediate resting positions rather than duplicating the final height.

## Index model

| Index | Meaning |
| ---: | --- |
| 0 | closed, when dismissible |
| 1 | first supplied snap point |
| 2…n | later supplied snap points |
| final | measured full content length |

Numbers are pixels. Strings accept any resolvable CSS length such as `96px`, `42dvh`, `70lvh`, or `min(680px, 82dvh)`. Keep stops in ascending physical size.

## Controlled detent

```tsx
const [snap, setSnap] = useState(1);

<Sheet.Root
  defaultOpen
  snap={snap}
  onSnapChange={setSnap}
>
  <Sheet.Panel
    snapPoints={["96px", "52dvh"]}
    dismissible={false}
  >
    <Sheet.Step direction="up">Expand</Sheet.Step>
    <Sheet.Step direction="down">Collapse</Sheet.Step>
  </Sheet.Panel>
</Sheet.Root>
```

Do not pass a fixed `snap` while ignoring `onSnapChange`; that intentionally rejects every gesture and action.

## Persistent lower stop

With `dismissible={false}`, travel cannot settle at index 0. A downward swipe returns to the first detent, which is the correct model for mini players, tool palettes, and persistent composers.

## Common mistakes

- Do not include the full content height as the last supplied point.
- Do not use descending or duplicate lengths.
- Do not measure viewport height in React when CSS can express it.
- Do not put the primary action below an unreachable detent.
- Test browser chrome, safe areas, and the virtual keyboard.
