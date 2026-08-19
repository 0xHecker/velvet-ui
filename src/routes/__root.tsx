import { useEffect } from "react";
import type { ReactNode } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import "../velvet/styles.css";
import "../playground/playground.css";
import "../playground/ToastPlayground.css";
import "../playground/Docs.css";
import { SiteShell } from "../site/SiteShell.jsx";
import { siteIdentitySchema } from "../site/seo";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" },
      { name: "theme-color", content: "#fbf8f3" },
      { name: "color-scheme", content: "light" },
      { name: "application-name", content: "Velvet UI" },
      { name: "apple-mobile-web-app-title", content: "Velvet UI" },
      { name: "author", content: "Sai Shanmukh" },
      { name: "format-detection", content: "telephone=no" },
      { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
      { name: "google-site-verification", content: "SEsJ0sj4IiEZJft6lGVaH4kP7owhBE6LSxiBtIFbAc0" },
      { property: "og:site_name", content: "Velvet UI" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "alternate", href: "/llms.txt", type: "text/plain", title: "Velvet UI documentation for language models" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(siteIdentitySchema),
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => <SiteShell><main><h1>Page not found</h1></main></SiteShell>,
});

function RootComponent() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import("react-grab");
    }
  }, []);

  return (
    <RootDocument>
      <SiteShell><Outlet /></SiteShell>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
