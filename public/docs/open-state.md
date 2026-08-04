# Open state

> Sheets support uncontrolled defaults and controlled state for coordination with your router, form flow, or application state.

Web: https://velvetui.co/docs/open-state

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

<Sheet.Root
  open={open}
  onOpenChange={(nextOpen) => {
    setOpen(nextOpen);
    updateUrl(nextOpen);
  }}
>
  ...
</Sheet.Root>
```

Do not ignore `onOpenChange` while passing `open`; the sheet will request a state change but your UI will remain frozen.
