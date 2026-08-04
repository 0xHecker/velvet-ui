# Sheet quick start

> A Sheet groups a trigger, portal, motion surface, accessible title, description, and close action under one controlled or uncontrolled state.

Web: https://velvetui.co/docs/sheet-quick-start

Start with `Sheet.Panel`. It supplies the portal, backdrop, gesture view, content surface, and handle while leaving your content and classes untouched.

## A complete sheet

```tsx
import { Sheet } from "@velvetui/react/sheet";
import "@velvetui/react/sheet.css";

export function SettingsSheet() {
  return (
    <Sheet.Root>
      <Sheet.Trigger className="button">Open settings</Sheet.Trigger>
      <Sheet.Panel side="bottom" className="settings-sheet">
        <Sheet.Title>Settings</Sheet.Title>
        <Sheet.Description>Choose how the workspace behaves.</Sheet.Description>
        <SettingsForm />
        <Sheet.Close className="button">Done</Sheet.Close>
      </Sheet.Panel>
    </Sheet.Root>
  );
}
```

## Controlled state

```tsx
const [open, setOpen] = useState(false);

<Sheet.Root open={open} onOpenChange={setOpen}>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Panel side="bottom">...</Sheet.Panel>
</Sheet.Root>
```

Use controlled state when routing, validation, or another component decides whether the sheet may close. Otherwise prefer uncontrolled state and let the trigger own the interaction.

## When to use the lower-level tree

Reach for `Sheet.View`, `Sheet.Backdrop`, and `Sheet.Content` when the backdrop sits elsewhere, the content uses a custom portal host, or multiple visual layers share one travel value.
