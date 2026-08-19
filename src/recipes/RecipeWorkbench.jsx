import { useRef, useState } from "react";
import { SheetStack } from "../velvet/index.js";
import { RecipeDemo } from "./RecipeDemos.jsx";

const Arrow = () => <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>;

export function RecipeWorkbench({ recipe }) {
  const [mode, setMode] = useState("preview");
  const [revision, setRevision] = useState(0);
  const [copied, setCopied] = useState(false);
  const portalContainer = useRef(null);
  const stackblitzUrl = `https://stackblitz.com/edit/${recipe.stackblitzId}?file=${encodeURIComponent(recipe.sourceFile || "src/App.jsx")}`;

  const copySource = async () => {
    await navigator.clipboard.writeText(recipe.source || "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="RecipeEmbed" aria-label={`${recipe.title} interactive example`}>
      <div className="RecipeEmbed-toolbar">
        <div className="RecipeEmbed-identity"><span className="RecipeEmbed-live" aria-hidden="true" /><span>Local preview</span></div>
        <div className="RecipeEmbed-actions">
          <div className="RecipeEmbed-switch" aria-label="Example view">
            <button type="button" aria-pressed={mode === "preview"} onClick={() => setMode("preview")}>Preview</button>
            <button type="button" aria-pressed={mode === "code"} onClick={() => setMode("code")}>Code</button>
          </div>
          {mode === "preview" ? <button className="RecipeEmbed-utility" type="button" onClick={() => setRevision((value) => value + 1)}>Reset</button> : <button className="RecipeEmbed-utility" type="button" onClick={copySource}>{copied ? "Copied" : "Copy"}</button>}
          <a className="RecipeEmbed-open" href={stackblitzUrl} target="_blank" rel="noreferrer"><span className="RecipeEmbed-openLong">Play in </span>StackBlitz <Arrow /></a>
        </div>
      </div>
      <SheetStack.Root asChild>
        <div className="RecipeEmbed-stage">
          {mode === "preview" ? <div className="RecipePreview" key={revision}><RecipeDemo slug={recipe.slug} portalContainer={portalContainer} /></div> : <pre className="RecipeEmbed-code"><code>{recipe.source || "Source is available in the linked StackBlitz project."}</code></pre>}
          <div ref={portalContainer} className="RecipePreview-portals" />
        </div>
      </SheetStack.Root>
    </section>
  );
}
