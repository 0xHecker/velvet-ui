// Inline SVG icon set — no external dependencies. Stroke icons inherit currentColor.
const I = ({ children, size = 18, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...rest}
  >
    {children}
  </svg>
);

export const IconStar = (p) => (
  <I {...p} fill="currentColor" stroke="none">
    <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3 1.1-6.4L2.6 9.4l6.5-.9L12 2.6z" />
  </I>
);
export const IconPin = (p) => (
  <I {...p}>
    <path d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.6" />
  </I>
);
export const IconCalendar = (p) => (
  <I {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </I>
);
export const IconUsers = (p) => (
  <I {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.8 20c.7-3.4 3.3-5.3 6.2-5.3s5.5 1.9 6.2 5.3M16 5.4a3.5 3.5 0 0 1 0 6.2M17.8 15.1c2 .8 3.2 2.4 3.6 4.9" />
  </I>
);
export const IconHeart = (p) => (
  <I {...p}>
    <path d="M12 20.3S3.5 15.2 3.5 9.3A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.7c0 5.9-8.5 11-8.5 11z" />
  </I>
);
export const IconShare = (p) => (
  <I {...p}>
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="18" cy="5.5" r="2.6" />
    <circle cx="18" cy="18.5" r="2.6" />
    <path d="M8.3 10.8l7.4-4M8.3 13.2l7.4 4" />
  </I>
);
export const IconPlay = (p) => (
  <I {...p} fill="currentColor" stroke="none">
    <path d="M8 5.4v13.2c0 .9 1 1.5 1.8 1l10.4-6.6c.7-.5.7-1.5 0-2L9.8 4.4C9 3.9 8 4.5 8 5.4z" />
  </I>
);
export const IconPause = (p) => (
  <I {...p} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" />
    <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" />
  </I>
);
export const IconNext = (p) => (
  <I {...p} fill="currentColor" stroke="none">
    <path d="M6 5.4v13.2c0 .9 1 1.5 1.8 1l8.8-5.6V19c0 .6.4 1 1 1h1.4c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1h-1.4c-.6 0-1 .4-1 1v4.9L7.8 4.4C7 3.9 6 4.5 6 5.4z" />
  </I>
);
export const IconPrev = (p) => (
  <I {...p} fill="currentColor" stroke="none">
    <path d="M18 5.4v13.2c0 .9-1 1.5-1.8 1l-8.8-5.6V19c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1h1.4c.6 0 1 .4 1 1v4.9l8.8-5.6c.8-.4 1.8.1 1.8 1.1z" />
  </I>
);
export const IconShuffle = (p) => (
  <I {...p}>
    <path d="M3 7h4.5c5.5 0 7.5 10 13 10H21M3 17h4.5c1.6 0 2.9-.8 3.9-2M21 7h-.5c-1.8 0-3.2.9-4.2 2.2M18.5 4.5L21 7l-2.5 2.5M18.5 14.5L21 17l-2.5 2.5" />
  </I>
);
export const IconRepeat = (p) => (
  <I {...p}>
    <path d="M4 12V9.5A2.5 2.5 0 0 1 6.5 7H20M20 12v2.5a2.5 2.5 0 0 1-2.5 2.5H4M17 4l3 3-3 3M7 14l-3 3 3 3" />
  </I>
);
export const IconChevronR = (p) => (
  <I {...p}>
    <path d="M9 6l6 6-6 6" />
  </I>
);
export const IconChevronL = (p) => (
  <I {...p}>
    <path d="M15 6l-6 6 6 6" />
  </I>
);
export const IconChevronUp = (p) => (
  <I {...p}>
    <path d="M6 15l6-6 6 6" />
  </I>
);
export const IconClose = (p) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </I>
);
export const IconPlus = (p) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const IconSearch = (p) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.8-3.8" />
  </I>
);
export const IconHome = (p) => (
  <I {...p}>
    <path d="M4 11.5L12 4l8 7.5M6 10v9.5h12V10" />
  </I>
);
export const IconFolder = (p) => (
  <I {...p}>
    <path d="M3.5 7A2.5 2.5 0 0 1 6 4.5h3l2 2.5h7A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5V7z" />
  </I>
);
export const IconBell = (p) => (
  <I {...p}>
    <path d="M18 15.5H6l1.4-2.4V9.7a4.6 4.6 0 0 1 9.2 0v3.4l1.4 2.4zM10.3 19a1.9 1.9 0 0 0 3.4 0" />
  </I>
);
export const IconGear = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8l1.1 2.7 2.9-.6 1 2.7 2.9.7-.6 2.9 1.9 2.3-1.9 2.3.6 2.9-2.9.7-1 2.7-2.9-.6L12 21.2l-1.1-2.7-2.9.6-1-2.7-2.9-.7.6-2.9L2.8 12l1.9-2.3-.6-2.9 2.9-.7 1-2.7 2.9.6L12 2.8z" />
  </I>
);
export const IconTrash = (p) => (
  <I {...p}>
    <path d="M4.5 6.5h15M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6M6.5 6.5l.8 12A2 2 0 0 0 9.3 20.5h5.4a2 2 0 0 0 2-1.9l.8-12.1M10 10.5v6M14 10.5v6" />
  </I>
);
export const IconSend = (p) => (
  <I {...p}>
    <path d="M21 3.5L10.4 14M21 3.5l-6.8 17-3.8-6.5L3.9 10.2 21 3.5z" />
  </I>
);
export const IconImage = (p) => (
  <I {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M3.5 16.5l4.5-4.5 3.5 3.5 4-4 5 5" />
  </I>
);
export const IconClock = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.2l3.4 2" />
  </I>
);
export const IconFlame = (p) => (
  <I {...p}>
    <path d="M12 3s6 4.6 6 10a6 6 0 0 1-12 0c0-2 1-3.8 2.2-5.2.4 1.2 1.2 2 2.3 2.2C10.3 7.5 11 5.2 12 3z" />
  </I>
);
export const IconBook = (p) => (
  <I {...p}>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15.5H6.7A1.7 1.7 0 0 0 5 20.2V4.5zM5 18.5A1.5 1.5 0 0 1 6.5 17H19" />
  </I>
);
export const IconLock = (p) => (
  <I {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7M12 14.5v2.5" />
  </I>
);
export const IconSun = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.2 5.2l1.8 1.8M17 17l1.8 1.8M18.8 5.2L17 7M7 17l-1.8 1.8" />
  </I>
);
export const IconInfo = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 7.6v.4" />
  </I>
);
export const IconCard = (p) => (
  <I {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
    <path d="M2.5 9.5h19M6 14.5h4" />
  </I>
);
export const IconCheck = (p) => (
  <I {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </I>
);
export const IconWifi = (p) => (
  <I {...p}>
    <path d="M2.5 9.5a14 14 0 0 1 19 0M5.6 13a9.5 9.5 0 0 1 12.8 0M8.8 16.4a5 5 0 0 1 6.4 0M12 19.8v.2" />
  </I>
);
export const IconBold = (p) => (
  <I {...p} strokeWidth="2.4">
    <path d="M7 4.5h5.5a3.2 3.2 0 0 1 0 6.4H7v-6.4zM7 10.9h6.5a3.2 3.2 0 0 1 0 6.4H7v-6.4z" />
  </I>
);
export const IconItalic = (p) => (
  <I {...p}>
    <path d="M10 4.5h8M6 19.5h8M14 4.5l-4 15" />
  </I>
);
export const IconList = (p) => (
  <I {...p}>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </I>
);
export const IconSparkle = (p) => (
  <I {...p} fill="currentColor" stroke="none">
    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3zM19 16l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
  </I>
);
export const IconMusic = (p) => (
  <I {...p}>
    <path d="M9 18.5V6l11-2v12.5" />
    <circle cx="6.8" cy="18.5" r="2.6" />
    <circle cx="17.8" cy="16.5" r="2.6" />
  </I>
);
export const IconCompass = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
  </I>
);
export const IconBag = (p) => (
  <I {...p}>
    <path d="M5.5 8h13l-1 11.5a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8L5.5 8zM9 10V6.5a3 3 0 0 1 6 0V10" />
  </I>
);
export const IconMessage = (p) => (
  <I {...p}>
    <path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z" />
  </I>
);
