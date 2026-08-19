import {
  absoluteUrl,
  breadcrumbSchema,
  createSeoHead,
  SEO_IMAGES,
  SITE_ORIGIN,
} from "../site/seo";
import { getDocPath } from "./versioning.js";

export const createDocsOverviewHead = (version, docs) => {
  const path = getDocPath("overview", version);
  const title = `Velvet UI ${version} React Documentation`;
  const description = `Install Velvet UI ${version} and learn its React sheet, gesture, motion, stack, scroll, accessibility, and toast APIs with working examples.`;

  return createSeoHead({
    title,
    description,
    path,
    image: SEO_IMAGES.docs,
    imageAlt: "Layered documentation pages and interface panels in cream, sage, lilac, and blue.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(path)}#webpage`,
        url: absoluteUrl(path),
        name: title,
        description,
        inLanguage: "en",
        version,
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: docs.length,
          itemListElement: docs.map((doc, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: doc.title,
            url: absoluteUrl(getDocPath(doc.slug, version)),
          })),
        },
      },
      breadcrumbSchema([
        { name: "Velvet UI", path: "/" },
        { name: `Documentation ${version}`, path },
      ]),
    ],
  });
};

export const createDocHead = (version, doc) => {
  const path = getDocPath(doc.slug, version);
  const docsPath = getDocPath("overview", version);
  const title = `${doc.title} — Velvet UI ${version} React Docs`;

  return createSeoHead({
    title,
    description: doc.description,
    path,
    image: SEO_IMAGES.docs,
    imageAlt: "Layered Velvet UI documentation pages and interface panels.",
    type: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": `${absoluteUrl(path)}#article`,
        headline: doc.title,
        description: doc.description,
        url: absoluteUrl(path),
        inLanguage: "en",
        version,
        articleSection: doc.group,
        mainEntityOfPage: absoluteUrl(path),
        isPartOf: { "@id": `${absoluteUrl(docsPath)}#webpage` },
        image: absoluteUrl(SEO_IMAGES.docs),
        author: { "@type": "Person", name: "Sai Shanmukh" },
        publisher: { "@id": `${SITE_ORIGIN}/#organization` },
      },
      breadcrumbSchema([
        { name: "Velvet UI", path: "/" },
        { name: `Documentation ${version}`, path: docsPath },
        { name: doc.title, path },
      ]),
    ],
  });
};
