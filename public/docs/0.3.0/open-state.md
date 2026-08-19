# Open state

> Sheets support uncontrolled defaults and controlled state for coordination with your router, form flow, or application state.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/open-state

Use uncontrolled state for self-contained UI. Use controlled state when the sheet participates in routing, validation, or a multi-step workflow.

## Uncontrolled

```tsx
<Sheet.Root defaultOpen={false}>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Panel side="bottom">...</Sheet.Panel>
</Sheet.Root>
```

`defaultOpen` is read once. Triggers, outside interaction, Escape, and gestures update the internal state.

## Controlled

```tsx
const [open, setOpen] = useState(searchParams.has("settings"));
const initialFocusRef = useRef(null);
const restoreFocusRef = useRef(null);

<Sheet.Root
  open={open}
  initialFocusRef={initialFocusRef}
  restoreFocusRef={restoreFocusRef}
  onOpenChange={setOpen}
  onExitComplete={() => updateUrl(false)}
>
  ...
</Sheet.Root>
```

Do not ignore `onOpenChange` while passing `open`; the sheet will request a state change but your UI will remain frozen. Route-open surfaces should remove their URL state after `onExitComplete`, and cold-open paths should point `restoreFocusRef` at a stable page landmark. [Run the route-controlled recipe](/recipes/route-controlled-sheet).
