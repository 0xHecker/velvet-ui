import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  RECIPES,
  RECIPE_CATEGORIES,
  getRecipePath,
} from "./catalog.js";
import { RecipeWorkbench } from "./RecipeWorkbench.jsx";
import "./Recipes.css";

const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 18 18" width="18" height="18">
    <path d="M3 9h11M10 5l4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
  </svg>
);

export function RecipesIndex() {
  const [category, setCategory] = useState("All");
  const visible = useMemo(
    () =>
      category === "All"
        ? RECIPES
        : RECIPES.filter((recipe) => recipe.category === category),
    [category]
  );

  return (
    <main className="RecipesIndex">
      <header className="RecipesIndex-head">
        <h1>Production-Ready Patterns</h1>
        <p>
          Interactive, runnable blueprints for advanced UI cases — seamless routing,
          async dismissal, nested layers, focus recovery, and portal integration.
        </p>
      </header>

      <div className="RecipesIndex-workbench">
        <aside className="RecipesIndex-filters" aria-label="Filter recipes">
          <p>Choose a concern</p>
          <div role="group" aria-label="Recipe category">
            {RECIPE_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                <span>{item}</span>
                <span>{item === "All" ? RECIPES.length : RECIPES.filter((recipe) => recipe.category === item).length}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="RecipesIndex-list" aria-live="polite">
          <div className="RecipesIndex-listHead">
            <h2>{category === "All" ? "All recipes" : category}</h2>
            <span>{visible.length} runnable {visible.length === 1 ? "project" : "projects"}</span>
          </div>
          {visible.map((recipe) => (
            <Link
              key={recipe.slug}
              className="RecipeRow"
              to={getRecipePath(recipe.slug)}
            >
              <div className="RecipeRow-copy">
                <div className="RecipeRow-meta">
                  <span>{recipe.category}</span>
                  <span>{recipe.difficulty}</span>
                  <span>{recipe.time}</span>
                </div>
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
              </div>
              <span className="RecipeRow-arrow" aria-hidden="true"><Arrow /></span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

const ArrowLeft = () => (
  <svg aria-hidden="true" viewBox="0 0 18 18" width="14" height="14">
    <path d="M15 9H3M8 13l-5-4 5-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
  </svg>
);

const ArrowRight = () => (
  <svg aria-hidden="true" viewBox="0 0 18 18" width="14" height="14">
    <path d="M3 9h12M10 5l5 4-5 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
  </svg>
);

export function RecipeDetail({ recipe }) {
  const index = RECIPES.findIndex((item) => item.slug === recipe.slug);
  const previous = RECIPES[index - 1];
  const next = RECIPES[index + 1];

  return (
    <main className="RecipeDetail">
      <div className="RecipeDetail-topBar">
        <nav className="RecipeDetail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/recipes">Recipes</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{recipe.title}</span>
        </nav>

        <div className="RecipeDetail-topQuickNav" aria-label="Quick recipe navigation">
          {previous && (
            <Link
              to={getRecipePath(previous.slug)}
              className="RecipeDetail-quickNavBtn"
              title={`Previous: ${previous.title}`}
            >
              <ArrowLeft /> <span>Prev</span>
            </Link>
          )}
          {next && (
            <Link
              to={getRecipePath(next.slug)}
              className="RecipeDetail-quickNavBtn"
              title={`Next: ${next.title}`}
            >
              <span>Next</span> <ArrowRight />
            </Link>
          )}
        </div>
      </div>

      <header className="RecipeDetail-head">
        <div className="RecipeDetail-intro">
          <h1>{recipe.title}</h1>
          <p>{recipe.description}</p>
        </div>
      </header>

      <RecipeWorkbench recipe={recipe} />

      <div className="RecipeDetail-notes">
        <section>
          <h2>What stays true</h2>
          <ul>
            {recipe.invariants.map((invariant) => <li key={invariant}>{invariant}</li>)}
          </ul>
        </section>
        <section>
          <h2>Try it deliberately</h2>
          <ul>
            {recipe.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </section>
      </div>

      <nav className="RecipeDetail-pagination" aria-label="Recipe pages">
        {previous ? (
          <Link to={getRecipePath(previous.slug)}>
            <span>Previous recipe</span><strong>{previous.title}</strong>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={getRecipePath(next.slug)}>
            <span>Next recipe</span><strong>{next.title}</strong>
          </Link>
        ) : <span />}
      </nav>
    </main>
  );
}
