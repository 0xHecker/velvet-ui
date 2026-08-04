import { createFileRoute } from "@tanstack/react-router";
import { DOCS, getDocPath } from "../docs/catalog.js";
import { Docs } from "../playground/Docs.jsx";
import { absoluteUrl, breadcrumbSchema, createSeoHead, SEO_IMAGES, SITE_ORIGIN } from "../site/seo";

const title = "React Sheet & Toast Documentation — Velvet UI";
const description = "Install Velvet UI and learn its React sheet, bottom sheet, gesture, motion, stack, scroll, accessibility, and toast APIs with working examples.";

export const Route = createFileRoute("/docs/")({
  head: () => createSeoHead({
    title,
    description,
    path: "/docs",
    image: SEO_IMAGES.docs,
    imageAlt: "Layered documentation pages and interface panels in cream, sage, lilac, and blue.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${SITE_ORIGIN}/docs#webpage`,
        url: `${SITE_ORIGIN}/docs`,
        name: title,
        description,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: DOCS.length,
          itemListElement: DOCS.map((doc, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: doc.title,
            url: absoluteUrl(getDocPath(doc.slug)),
          })),
        },
      },
      breadcrumbSchema([
        { name: "Velvet UI", path: "/" },
        { name: "Documentation", path: "/docs" },
      ]),
    ],
  }),
  component: DocsIndexPage,
});

function DocsIndexPage() {
  return <Docs section="overview" />;
}
