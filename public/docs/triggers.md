# Triggers and actions

> Trigger, Close, and Step communicate intent directly and can render through your own button using asChild.

Web: https://velvetui.co/docs/triggers

Trigger parts are real buttons by default and expose stateful intent without forcing a product button style.

## Actions

| Component or action | Result |
| --- | --- |
| `Sheet.Trigger` / `action="open"` | open at the requested or default detent |
| `action="close"` / `Sheet.Close` | request closed |
| `action="toggle"` | invert open state |
| `Sheet.Step direction="up"` | next larger detent |
| `Sheet.Step direction="down"` | next smaller detent |
| `Sheet.Step snapTo={n}` | exact detent index |

```tsx
<Sheet.Trigger asChild>
  <Button>Open filters</Button>
</Sheet.Trigger>
<Sheet.Step direction="up">More</Sheet.Step>
<Sheet.Step snapTo={1}>Compact</Sheet.Step>
<Sheet.Close asChild><Button>Done</Button></Sheet.Close>
```

## Disabled state

Only the public `disabled` prop disables an action. A new open, close, toggle, or step intent may interrupt an active transition and continues from the rendered position.

## asChild requirements

The single non-Fragment child receives the ref, children, click handler, disabled state, ARIA/data attributes, className, and style. Forward all of them. If the design system composes click handlers, respect `event.defaultPrevented` and do not silently replace Velvet's handler. See [Bring your own components](/docs/custom-components).

## onPress and onClick

`onClick` runs first, then `onPress`, then Velvet changes state. Either callback may call `event.preventDefault()` to cancel the Velvet action. Keep application state changes in one callback so the same gesture does not run logic twice.
