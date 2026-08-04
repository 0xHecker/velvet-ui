import { createFileRoute } from "@tanstack/react-router";
import { SheetGallery } from "../playground/App.jsx";
import { createSeoHead, SEO_IMAGES, softwareSchema } from "../site/seo";

const title = "React Bottom Sheet & Toast Components — Velvet UI";
const description = "Build native-feeling React interfaces with swipeable bottom sheets, nested surfaces, spring motion, accessible primitives, and stackable toasts.";

export const Route = createFileRoute("/")({
  head: () => createSeoHead({
    title,
    description,
    path: "/",
    image: SEO_IMAGES.home,
    imageAlt: "Soft cream, lavender, and rose interface sheets floating in a tactile stack.",
    jsonLd: [softwareSchema],
  }),
  component: SheetGallery,
});
