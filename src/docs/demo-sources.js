export const DEMO_SOURCES = [
  { id: "bottom-sheet", title: "Bottom Sheet", file: "BottomSheet" },
  { id: "modal", title: "Modal Dialog", file: "Modal" },
  { id: "sidebar", title: "Navigation Drawer", file: "Sidebar" },
  { id: "detent", title: "Detent Sheet", file: "DetentSheet" },
  { id: "top-sheet", title: "Top Sheet", file: "TopSheet" },
  { id: "long-sheet", title: "Scrollable Sheet", file: "LongSheet" },
  { id: "stacked", title: "Stacked Sheets", file: "StackedSheets" },
  { id: "detached", title: "Detached Sheet", file: "DetachedSheet" },
  { id: "page-from-bottom", title: "Full-Screen Sheet", file: "PageFromBottom" },
  { id: "depth", title: "Depth Sheet", file: "DepthSheet" },
  { id: "lightbox", title: "Lightbox", file: "Lightbox" },
  { id: "parallax", title: "Parallax Sheet", file: "ParallaxPage" },
  { id: "page", title: "Side Sheet", file: "Page" },
  { id: "keyboard", title: "Keyboard-Aware Sheet", file: "KeyboardSheet" },
  { id: "card", title: "Card Expansion", file: "Card" },
  { id: "persistent", title: "Persistent Sheet", file: "PersistentSheet" },
];

export const DEMO_BY_ID = Object.fromEntries(
  DEMO_SOURCES.map((demo) => [demo.id, demo]),
);
