import { createFileRoute } from "@tanstack/react-router";
import { ToastPlayground } from "../playground/ToastPlayground.jsx";
import { absoluteUrl, createSeoHead, SEO_IMAGES, SITE_ORIGIN } from "../site/seo";

const title = "Swipeable React Toast Component — Velvet UI";
const description = "A fast, stackable React toast component with actions, promises, rich variants, flexible positioning, and momentum-based swipe dismissal.";

export const Route = createFileRoute("/toasts")({
  head: () => createSeoHead({
    title,
    description,
    path: "/toasts",
    image: SEO_IMAGES.toasts,
    imageAlt: "Four soft notification cards stacked with a sideways swipe motion.",
    jsonLd: [{
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_ORIGIN}/toasts#webpage`,
      url: `${SITE_ORIGIN}/toasts`,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
      about: {
        "@type": "SoftwareApplication",
        "@id": `${SITE_ORIGIN}/#software`,
        name: "Velvet UI",
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: absoluteUrl(SEO_IMAGES.toasts),
        width: 1200,
        height: 630,
      },
    }],
  }),
  component: ToastPlayground,
});
