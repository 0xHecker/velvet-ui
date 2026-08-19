import { createFileRoute } from "@tanstack/react-router";
import { RECIPES, getRecipePath } from "../recipes/catalog.js";
import { RecipesIndex } from "../recipes/Recipes.jsx";
import { absoluteUrl, breadcrumbSchema, createSeoHead, SEO_IMAGES, SITE_ORIGIN } from "../site/seo";

const title = "Runnable React Sheet Recipes — Velvet UI";
const description = "Interactive Velvet UI recipes for route-controlled sheets, async dismissal, nested modals, focus recovery, Radix, React Aria, Base UI, and reduced motion.";

export const Route = createFileRoute("/recipes/")({
  head: () => createSeoHead({
    title,
    description,
    path: "/recipes",
    image: SEO_IMAGES.recipes,
    imageAlt: "A Velvet UI recipe workbench with live code and layered interface surfaces.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${SITE_ORIGIN}/recipes#webpage`,
        url: `${SITE_ORIGIN}/recipes`,
        name: title,
        description,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: RECIPES.length,
          itemListElement: RECIPES.map((recipe, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: recipe.title,
            url: absoluteUrl(getRecipePath(recipe.slug)),
          })),
        },
      },
      breadcrumbSchema([
        { name: "Velvet UI", path: "/" },
        { name: "Recipes", path: "/recipes" },
      ]),
    ],
  }),
  component: RecipesIndex,
});
