# Detail → confirmation → lightbox

Compose host-relative navigation, an alert dialog, and a family-correct Lightbox without losing dismissal order.

Web recipe: https://velvetui.co/recipes/nested-detail-confirmation-lightbox

Existing StackBlitz project: https://stackblitz.com/edit/qdtfcfqo?file=src/recipes/nested-detail-confirmation-lightbox.jsx

## Invariants

- NestedPanel owns positioning
- Root families match
- Frontmost layer owns dismissal

## Exercise deliberately

- Open the confirmation and press Escape once: the detail behind it stays mounted.
- Lightbox parts deliberately remain in the Lightbox family.

## App.jsx

```jsx
import { useState } from "react";
import { Lightbox, Sheet } from "@velvetui/react";

const photo = "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=82";

export default function App() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  return <main className="demo">
    <Sheet.Root defaultOpen>
      <Sheet.Panel side="center" draggable={false} className="sheet">
        <Sheet.Title>Botanical archive</Sheet.Title>
        <Sheet.Description>Three layer families, one dismissal stack.</Sheet.Description>
        <Sheet.NestedPortalHost className="nested-host">
          <div className="library stack"><p>Open a detail, ask for confirmation, then inspect the image.</p><button onClick={() => setDetailOpen(true)}>Open specimen</button></div>
          <Sheet.Root open={detailOpen} onOpenChange={setDetailOpen}>
            <Sheet.NestedPanel side="right" className="detail" onClickOutside={{ dismiss: false }}>
              <div className="sheet-head"><Sheet.Close>Back</Sheet.Close><Sheet.Title>Monstera study</Sheet.Title></div>
              <Sheet.Description>NestedPanel owns host-relative position and clipping.</Sheet.Description>
              <img src={photo} alt="Monstera leaves" />
              <div className="row" style={{marginTop: 16}}><button onClick={() => setConfirmOpen(true)}>Archive</button>
                <Lightbox.Root><Lightbox.Trigger>Inspect image</Lightbox.Trigger><Lightbox.Content><Lightbox.Title>Monstera leaves</Lightbox.Title><img className="lightbox-image" src={photo} alt="Close view of Monstera leaves" /><Lightbox.Close>Close image</Lightbox.Close></Lightbox.Content></Lightbox.Root>
              </div>
              <Sheet.Root open={confirmOpen} onOpenChange={setConfirmOpen} sheetRole="alertdialog"><Sheet.Panel side="center" draggable={false} className="sheet"><Sheet.Title>Archive specimen?</Sheet.Title><Sheet.Description>You can restore it later.</Sheet.Description><div className="row"><Sheet.Close>Cancel</Sheet.Close><button className="danger" onClick={() => { setConfirmOpen(false); setDetailOpen(false); }}>Archive</button></div></Sheet.Panel></Sheet.Root>
            </Sheet.NestedPanel>
          </Sheet.Root>
        </Sheet.NestedPortalHost>
      </Sheet.Panel>
    </Sheet.Root>
  </main>;
}
```
