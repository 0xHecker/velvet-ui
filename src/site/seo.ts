export const SITE_ORIGIN = "https://velvetui.co";
export const SITE_NAME = "Velvet UI";
export const NPM_PACKAGE_URL = "https://www.npmjs.com/package/@velvetui/react";
export const SUPPORT_URL = "https://github.com/0xHecker/velvetui-support";
export const LICENSE_URL = `${SITE_ORIGIN}/?license=open`;

export const SEO_IMAGES = {
  home: "/og/velvet-ui.jpg",
  docs: "/og/velvet-ui-docs.jpg",
  toasts: "/og/velvet-ui-toasts.jpg",
} as const;

const ROBOTS_DIRECTIVE = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export const absoluteUrl = (path: string) => new URL(path, SITE_ORIGIN).toString();

type JsonLd = Record<string, unknown>;

type SeoHeadOptions = {
  title: string;
  description: string;
  path: string;
  image: string;
  imageAlt: string;
  type?: "website" | "article";
  jsonLd?: JsonLd[];
};

export function createSeoHead({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  jsonLd = [],
}: SeoHeadOptions) {
  const canonical = absoluteUrl(path);
  const socialImage = absoluteUrl(image);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: ROBOTS_DIRECTIVE },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_US" },
      { property: "og:type", content: type },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:image", content: socialImage },
      { property: "og:image:secure_url", content: socialImage },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: imageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: socialImage },
      { name: "twitter:image:alt", content: imageAlt },
    ],
    links: [
      { rel: "canonical", href: canonical },
      { rel: "image_src", href: socialImage },
    ],
    scripts: jsonLd.map((data) => ({
      type: "application/ld+json",
      children: JSON.stringify(data),
    })),
  };
}

export const siteIdentitySchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_ORIGIN}/#organization`,
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon-512.png"),
        width: 512,
        height: 512,
      },
      sameAs: [NPM_PACKAGE_URL, SUPPORT_URL],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: SITE_NAME,
      description: "Native-feeling React sheets and toasts with resilient gestures and spring motion.",
      inLanguage: "en",
      publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    },
  ],
};

export const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_ORIGIN}/#software`,
  name: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  description: "A headless React toolkit for swipeable sheets, stacked surfaces, toasts, gestures, and spring motion.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  softwareVersion: "0.1.0",
  downloadUrl: NPM_PACKAGE_URL,
  publisher: { "@id": `${SITE_ORIGIN}/#organization` },
  image: absoluteUrl(SEO_IMAGES.home),
  offers: [
    {
      "@type": "Offer",
      name: "Free non-commercial license",
      price: "0",
      priceCurrency: "USD",
      url: LICENSE_URL,
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Individual commercial license",
      price: "20",
      priceCurrency: "USD",
      url: LICENSE_URL,
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Organization commercial license",
      price: "129",
      priceCurrency: "USD",
      url: LICENSE_URL,
      availability: "https://schema.org/InStock",
    },
  ],
};

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
