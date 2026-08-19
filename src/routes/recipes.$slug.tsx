import { createFileRoute, notFound } from "@tanstack/react-router";
import { RECIPE_BY_SLUG } from "../recipes/catalog.js";
import { RecipeDetail } from "../recipes/Recipes.jsx";
import { absoluteUrl, breadcrumbSchema, createSeoHead, SEO_IMAGES, SITE_ORIGIN } from "../site/seo";

export const Route = createFileRoute("/recipes/$slug")({
  loader: ({ params }) => {
    const recipe = RECIPE_BY_SLUG[params.slug];
    if (!recipe) throw notFound();
    // Keep loader data serializable. Dynamic recipes carry a project factory
    // that is intentionally evaluated only in the browser when the embed starts.
    return recipe.slug;
  },
  head: ({ loaderData, params }) => {
    const recipe = RECIPE_BY_SLUG[loaderData ?? params.slug];
    if (!recipe) return {};
    const title = `${recipe.title} — Velvet UI Recipe`;
    const path = `/recipes/${recipe.slug}`;
    return createSeoHead({
      title,
      description: recipe.description,
      path,
      image: SEO_IMAGES.recipes,
      imageAlt: `${recipe.title} shown in the Velvet UI live recipe workbench.`,
      type: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": `${absoluteUrl(path)}#article`,
          headline: recipe.title,
          description: recipe.description,
          url: absoluteUrl(path),
          inLanguage: "en",
          articleSection: recipe.category,
          mainEntityOfPage: absoluteUrl(path),
          isPartOf: { "@id": `${SITE_ORIGIN}/recipes#webpage` },
          author: { "@type": "Person", name: "Sai Shanmukh" },
          publisher: { "@id": `${SITE_ORIGIN}/#organization` },
        },
        breadcrumbSchema([
          { name: "Velvet UI", path: "/" },
          { name: "Recipes", path: "/recipes" },
          { name: recipe.title, path },
        ]),
      ],
    });
  },
  component: RecipeRoute,
});

function RecipeRoute() {
  return <RecipeDetail recipe={RECIPE_BY_SLUG[Route.useLoaderData()]} />;
}
