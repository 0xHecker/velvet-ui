# Toast options

> Toast options control duration, description, action, close affordance, visual treatment, and stacked expansion.

Web: https://velvetui.co/docs/toast-options

A toast title should say what happened. The description should explain impact or recovery. Actions should be short and safe to repeat.

## Options

```tsx
toast("Update available", {
  id: "app-update",
  description: "Reload when you are ready.",
  duration: 8_000,
  icon: <Sparkles />,
  action: {
    label: "Reload",
    onClick: () => window.location.reload(),
  },
  closeButton: true,
});
```

Common options include `id`, `description`, `duration`, `icon`, `action`, `closeButton`, `important`, `dismissible`, and per-toast class or style overrides.
