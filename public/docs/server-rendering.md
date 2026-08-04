# Server rendering

> Keep routes server rendered while placing the smallest possible client boundary around interactive sheets, portals, and toast calls.

Web: https://velvetui.co/docs/server-rendering

Velvet is safe to render in an SSR tree. Triggers, labels, and authored page content produce ordinary server HTML; portal hosts, focus management, inertness, and gesture measurement activate after hydration.

## The boundary to remember

The component that owns interactive sheet state is client code. The rest of the route can stay server rendered. Do not gate the whole page behind a mounted check and do not render a second copy of the modal on the server.

A portal only changes physical DOM placement; it remains inside the same React tree for context and events. Velvet discovers the browser portal container after mount.

## Next.js App Router

```tsx
// app/layout.tsx
import "@velvetui/react/base.css";
import "@velvetui/react/bottom-sheet.css";

export default function Layout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
```

```tsx
// app/components/account-sheet.tsx
"use client";

import { BottomSheet } from "@velvetui/react/bottom-sheet";

export function AccountSheet({ children }) {
  return (
    <BottomSheet.Root>
      <BottomSheet.Trigger>Account</BottomSheet.Trigger>
      <BottomSheet.Content>{children}</BottomSheet.Content>
    </BottomSheet.Root>
  );
}
```

Only the interactive entry file needs `use client`; placing the directive on the route or layout would move more code into the client bundle than necessary.

## TanStack Start

```tsx
// src/routes/__root.tsx
import "@velvetui/react/base.css";
import "@velvetui/react/depth-sheet.css";

export const Route = createRootRoute({
  component: RootComponent,
});
```

```tsx
// A normal isomorphic route component
import { DepthSheet } from "@velvetui/react/depth-sheet";

export function ProfileRoute() {
  return (
    <DepthSheet.Root>
      <DepthSheet.Page><ServerRenderedPage /></DepthSheet.Page>
      <DepthSheet.Trigger>Open profile</DepthSheet.Trigger>
      <DepthSheet.Content><Profile /></DepthSheet.Content>
    </DepthSheet.Root>
  );
}
```

Keep browser events and `toast()` calls in component or client-event code. Do not import Velvet from a `.server.ts` module. TanStack route loaders are isomorphic, so they should return data rather than DOM nodes or portal containers.

## Vite SSR, Remix, and React Router

Import structural CSS through the framework root. Render the same component tree on server and client, then hydrate it with the framework. Never call `createRoot` over server markup; hydration must reuse the existing DOM.

```tsx
export function ProductRoute() {
  return (
    <Sheet.Root>
      <Sheet.Trigger>Filters</Sheet.Trigger>
      <Sheet.Panel side="right">
        <Sheet.Title>Filters</Sheet.Title>
        <FilterForm />
      </Sheet.Panel>
    </Sheet.Root>
  );
}
```

## Hydration checklist

- Keep `defaultOpen` deterministic between server and client.
- Use controlled `open` only from serializable initial state.
- Do not read `window`, viewport dimensions, or media queries while authoring the initial tree.
- Prefer CSS media queries for responsive sheet geometry.
- Import global Velvet CSS once, in stable order.
- Mount one `Toaster` in a client-capable application shell.
- Call `toast()` only after hydration, normally from an event or effect.

## Primary references

- [React portals](https://react.dev/reference/react-dom/createPortal)
- [Next.js client boundaries](https://nextjs.org/docs/app/api-reference/directives/use-client)
- [TanStack Start execution model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)
