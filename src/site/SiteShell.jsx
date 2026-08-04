import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { SheetStack } from "../velvet/index.js";
import { IconChevronR } from "../playground/icons.jsx";
import { LicenseCenter } from "./LicenseCenter.jsx";

const appDepth = {
  translateY: ({ progress }) => `${Math.min(progress, 1) * 14}px`,
  scale: ({ progress }) => 1 - Math.min(progress, 1) * 0.06,
  borderRadius: ({ progress }) => `${Math.min(progress, 1) * 28}px`,
  filter: ({ progress }) => `brightness(${1 - Math.min(progress, 1) * 0.1})`,
  transformOrigin: "50% 0",
};

const tabs = [
  { label: "Sheets", to: "/" },
  { label: "Toasts", to: "/toasts" },
  { label: "Docs", to: "/docs" },
];

export function SiteShell({ children }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [licenseOpen, setLicenseOpen] = useState(false);
  const isDocs = pathname === "/docs" || pathname.startsWith("/docs/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("license") === "open") {
      setLicenseOpen(true);
    }
  }, [pathname]);

  const setLicenseVisibility = (nextOpen) => {
    setLicenseOpen(nextOpen);

    const url = new URL(window.location.href);
    if (nextOpen) url.searchParams.set("license", "open");
    else url.searchParams.delete("license");
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <SheetStack.Root className="App-depthRoot">
      <SheetStack.Outlet asChild stackingAnimation={appDepth}>
        <div className="App-surface">
          <nav className="Nav" aria-label="Primary navigation">
            <div className="Nav-left">
              {tabs.map((tab) => (
                <Link
                  key={tab.to}
                  className="Nav-tab"
                  to={tab.to}
                  activeProps={{ "aria-current": "page" }}
                  activeOptions={{ exact: tab.to === "/" }}
                >
                  {tab.label}
                </Link>
              ))}
              <button
                className="Nav-tab"
                type="button"
                aria-haspopup="dialog"
                aria-expanded={licenseOpen}
                onClick={() => setLicenseVisibility(true)}
              >
                License
              </button>
            </div>
            <Link className="Nav-brand" to="/" aria-label="Velvet UI home">
              Velvet
            </Link>
            <div className="Nav-right">
              <button className="Nav-cta" type="button" onClick={() => setLicenseVisibility(true)}>
                Get a license <IconChevronR size={15} />
              </button>
            </div>
          </nav>
          <div className={`Page${isDocs ? " Page--docs" : ""}`}>{children}</div>
        </div>
      </SheetStack.Outlet>
      <LicenseCenter open={licenseOpen} onOpenChange={setLicenseVisibility} />
    </SheetStack.Root>
  );
}
