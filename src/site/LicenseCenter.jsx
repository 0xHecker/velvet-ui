import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import licenseMarkdown from "../../LICENSE.md?raw";
import privacyMarkdown from "../../PRIVACY.md?raw";
import termsMarkdown from "../../TERMS.md?raw";
import modalPreview from "./assets/license-modal.webp";
import pagePreview from "./assets/license-side-sheet.webp";
import stackPreview from "./assets/license-stacked-sheets.webp";
import { Scroll, Sheet } from "../velvet/index.js";
import {
  IconCheck,
  IconChevronL,
  IconChevronR,
  IconChevronUp,
  IconClose,
  IconLock,
} from "../playground/icons.jsx";
import "./LicenseCenter.css";

const individualCheckout =
  "https://checkout.dodopayments.com/buy/pdt_0NkA73Vxwpnbmi26ah0Sz?quantity=1";
const organizationCheckout =
  "https://checkout.dodopayments.com/buy/pdt_0NkA7701wT5R2raj4irqH?quantity=1";

const TERMS_VERSION = "1.0 (2026-08-03)";

const plans = [
  {
    id: "free",
    name: "Free",
    audience: "Non-commercial usage",
    price: "$0",
    priceNote: "Forever",
    description:
      "For personal projects, learning, evaluation, and anything that is not commercial.",
    features: [
      "Unlimited non-commercial projects",
      "Every future public version",
      "Documentation and public support",
    ],
    note: "Upgrade before the work becomes commercial.",
  },
  {
    id: "individual",
    name: "Individual",
    audience: "For an individual or team with fewer than three members",
    price: "$20",
    priceNote: "+ tax · one time",
    description:
      "Commercial usage for you and one teammate across unlimited products and client work.",
    features: [
      "Up to two people in total",
      "Unlimited commercial projects",
      "Every future public version",
    ],
    note: "A third team member requires an Organization license.",
    featured: true,
  },
  {
    id: "organization",
    name: "Organization",
    audience: "Commercial usage limited to one organization",
    price: "$129",
    priceNote: "+ tax · one time",
    description:
      "One license for everyone working inside the organization named at checkout.",
    features: [
      "Organization-wide commercial use",
      "Unlimited products and client work",
      "Every future public version",
    ],
    note: "The license does not extend to affiliates or clients.",
  },
];

const legalDocuments = {
  license: {
    shortTitle: "License",
    title: "Software License Agreement",
    description: "What you can build, who is covered, and what is not allowed.",
    source: licenseMarkdown,
  },
  terms: {
    shortTitle: "Terms & Conditions",
    title: "Terms & Conditions",
    description: "Checkout, license keys, refunds, support, and website use.",
    source: termsMarkdown,
  },
  privacy: {
    shortTitle: "Privacy Notice",
    title: "Privacy Notice",
    description: "What we collect and who handles your payment information.",
    source: privacyMarkdown,
  },
};

const questions = [
  {
    title: "What does forever access mean?",
    answer:
      "Every public Velvet UI version we release is included. There is no subscription or recurring license fee, but this is not a promise that development will continue forever.",
  },
  {
    title: "Can I use my license for client work?",
    answer:
      "Yes. A paid license covers unlimited client projects within its people or organization limit. A client needs their own license only if their team will use Velvet UI to develop or maintain the project.",
  },
  {
    title: "Can I start free and pay later?",
    answer:
      "Yes. Build and evaluate for free while the work stays non-commercial. Buy the appropriate license before it starts making money or is delivered as paid client work.",
  },
  {
    title: "What happens after payment?",
    answer:
      "Dodo Payments emails your receipt and Velvet UI license key after successful payment. Any applicable tax is calculated at checkout.",
  },
];

const stackAnimation = {
  translateX: ({ progress }) => `${Math.min(progress, 1) * -18}px`,
  scale: ({ progress }) => 1 - Math.min(progress, 1) * 0.015,
  filter: ({ progress }) => `brightness(${1 - Math.min(progress, 1) * 0.07})`,
  transformOrigin: "50% 50%",
};

const legalBody = (source) => source.replace(/^#\s+[^\n]+\n+/, "");

function MarkdownDocument({ source, onDocumentChange }) {
  return (
    <div className="LicenseCenter-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            const linkedDocument = {
              "LICENSE.md": "license",
              "TERMS.md": "terms",
              "PRIVACY.md": "privacy",
            }[href?.split("/").pop()?.toUpperCase()];

            if (linkedDocument && onDocumentChange) {
              return (
                <button
                  className="LicenseCenter-inlineLegalLink"
                  type="button"
                  onClick={() => onDocumentChange(linkedDocument)}
                >
                  {children}
                </button>
              );
            }

            return (
              <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="LicenseCenter-tableWrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {legalBody(source)}
      </ReactMarkdown>
    </div>
  );
}

function DocumentScroll({ children }) {
  return (
    <Scroll.Root className="LicenseCenter-scrollRoot">
      <Scroll.View className="LicenseCenter-scrollView">
        <Scroll.Content className="LicenseCenter-scrollContent">
          {children}
        </Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  );
}

function recordAcceptance(plan) {
  const record = {
    acceptedAt: new Date().toISOString(),
    license: "Velvet UI Software License Agreement",
    licenseVersion: TERMS_VERSION,
    plan: plan.id,
    purchaseTerms: "Velvet UI Terms & Conditions",
    purchaseTermsVersion: TERMS_VERSION,
    source: "velvetui.co",
  };

  try {
    window.localStorage.setItem(
      `velvetui:purchase-acceptance:${plan.id}`,
      JSON.stringify(record),
    );
  } catch {
    // Checkout must remain available when browser storage is blocked.
  }
}

function SheetPageHeader({ title, description }) {
  return (
    <header className="LicenseCenter-pageHeader">
      <Sheet.Close className="LicenseCenter-backButton">
        <IconChevronL size={18} /> Back
      </Sheet.Close>
      <div className="LicenseCenter-pageHeading">
        <Sheet.Title className="LicenseCenter-pageTitle">{title}</Sheet.Title>
        <Sheet.Description className="LicenseCenter-pageDescription">
          {description}
        </Sheet.Description>
      </div>
      <span className="LicenseCenter-pageHeaderSpace" aria-hidden />
    </header>
  );
}

function DocumentPage({ documentKey, onDocumentChange }) {
  const document = legalDocuments[documentKey];

  return (
    <div className="LicenseCenter-documentPage">
      <div className="LicenseCenter-documentIntro">
        <h2>{document.title}</h2>
        <p>{document.description}</p>
        <span>Version 1.0 · 3 August 2026</span>
      </div>
      <MarkdownDocument source={document.source} onDocumentChange={onDocumentChange} />
    </div>
  );
}

function DocumentSheet({ documentKey, onDocumentChange }) {
  const document = legalDocuments[documentKey];

  return (
    <Sheet.Portal>
      <Sheet.View
        className="LicenseCenter-pageView"
        side="right"
        nativeEdgeSwipePrevention
        onClickOutside={{ dismiss: false }}
      >
        <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.18] }} />
        <Sheet.Content
          className="LicenseCenter-pagePanel LicenseCenter-pagePanel--document"
          stackingAnimation={stackAnimation}
        >
          <Sheet.BleedingBackground className="LicenseCenter-pageSurface" />
          <SheetPageHeader title={document.shortTitle} description="Swipe right to go back" />
          <DocumentScroll>
            <DocumentPage
              documentKey={documentKey}
              onDocumentChange={onDocumentChange}
            />
          </DocumentScroll>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  );
}

function LegalIndex() {
  const [documentKey, setDocumentKey] = useState("license");
  const [documentOpen, setDocumentOpen] = useState(false);

  const openDocument = (key) => {
    setDocumentKey(key);
    setDocumentOpen(true);
  };

  return (
    <Sheet.Root open={documentOpen} onOpenChange={setDocumentOpen}>
      <DocumentScroll>
        <div className="LicenseCenter-legalIndex">
          <h2>Legal terms</h2>
          <p>Everything that governs access, payment, and use of Velvet UI.</p>
          <div className="LicenseCenter-legalRows" aria-label="Legal documents">
            {Object.entries(legalDocuments).map(([key, document]) => (
              <button key={key} type="button" onClick={() => openDocument(key)}>
                <span>
                  <strong>{document.shortTitle}</strong>
                  <small>{document.description}</small>
                </span>
                <IconChevronR size={18} />
              </button>
            ))}
          </div>
          <p className="LicenseCenter-legalContact">
            Legal contact: <a href="mailto:msshanmukh@gmail.com">msshanmukh@gmail.com</a>
          </p>
        </div>
      </DocumentScroll>
      <DocumentSheet
        documentKey={documentKey}
        onDocumentChange={setDocumentKey}
      />
    </Sheet.Root>
  );
}

function LegalLinks() {
  const [documentKey, setDocumentKey] = useState("license");
  const [documentOpen, setDocumentOpen] = useState(false);

  const openDocument = (key) => {
    setDocumentKey(key);
    setDocumentOpen(true);
  };

  return (
    <Sheet.Root open={documentOpen} onOpenChange={setDocumentOpen}>
      <div className="LicenseCenter-agreementLinks" aria-label="Purchase documents">
        <button type="button" onClick={() => openDocument("license")}>License</button>
        <button type="button" onClick={() => openDocument("terms")}>Purchase terms</button>
        <a
          href="https://dodopayments.com/archive/buyer-terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Dodo buyer terms
        </a>
      </div>
      <DocumentSheet
        documentKey={documentKey}
        onDocumentChange={setDocumentKey}
      />
    </Sheet.Root>
  );
}

function Checkout({ plan }) {
  const [agreed, setAgreed] = useState(false);
  const checkoutUrl = plan.id === "individual" ? individualCheckout : organizationCheckout;

  const purchase = () => {
    if (!agreed) return;
    recordAcceptance(plan);
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="LicenseCenter-checkout">
      <div className="LicenseCenter-checkoutIntro">
        <h2>One payment. Yours forever.</h2>
        <p>{plan.description}</p>
      </div>

      <div className="LicenseCenter-checkoutPrice">
        <span>{plan.name} license</span>
        <strong>{plan.price}</strong>
        <small>{plan.priceNote}</small>
      </div>

      <dl className="LicenseCenter-checkoutFacts">
        <div>
          <dt>Covered</dt>
          <dd>
            {plan.id === "individual"
              ? "You and one teammate — two people total"
              : "Everyone working for the organization named at checkout"}
          </dd>
        </div>
        <div>
          <dt>Projects</dt>
          <dd>Unlimited commercial products and client work</dd>
        </div>
        <div>
          <dt>Updates</dt>
          <dd>Every future public Velvet UI version</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>Dodo Payments emails your receipt and license key</dd>
        </div>
      </dl>

      <div className="LicenseCenter-finalSale">
        <IconLock size={18} />
        <p>
          This is a one-time digital purchase. Sales are final unless applicable law
          or Dodo Payments requires a refund.
        </p>
      </div>

      <div className="LicenseCenter-agreement">
        <input
          id={`${plan.id}-agreement`}
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <div>
          <label htmlFor={`${plan.id}-agreement`}>
            I agree to the Velvet UI License and Purchase Terms and acknowledge
            Dodo Payments&apos; Buyer Terms.
          </label>
          <LegalLinks />
        </div>
      </div>

      <button
        className="LicenseCenter-buyButton"
        type="button"
        disabled={!agreed}
        onClick={purchase}
      >
        Continue to Dodo Payments <IconChevronR size={18} />
      </button>

      <p className="LicenseCenter-merchantNote">
        Dodo Payments is the merchant of record and handles payment, tax, and billing details.
      </p>
    </div>
  );
}

function DetailSheet({ panel }) {
  const plan = panel.kind === "checkout"
    ? plans.find((candidate) => candidate.id === panel.id)
    : null;

  return (
    <Sheet.Portal>
      <Sheet.View
        className="LicenseCenter-pageView"
        side="right"
        nativeEdgeSwipePrevention
        onClickOutside={{ dismiss: false }}
      >
        <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.18] }} />
        <Sheet.Content className="LicenseCenter-pagePanel" stackingAnimation={stackAnimation}>
          <Sheet.BleedingBackground className="LicenseCenter-pageSurface" />
          <SheetPageHeader
            title={panel.kind === "legal" ? "Legal" : `${plan.name} license`}
            description="Swipe right to go back"
          />
          {panel.kind === "legal" ? <LegalIndex /> : (
            <DocumentScroll>
              <Checkout plan={plan} />
            </DocumentScroll>
          )}
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  );
}

function ProductPreview() {
  return (
    <div className="LicenseCenter-preview" aria-hidden="true">
      <figure className="LicenseCenter-device LicenseCenter-device--left">
        <img src={pagePreview} alt="" width="540" height="960" decoding="async" />
      </figure>
      <figure className="LicenseCenter-device LicenseCenter-device--center">
        <img src={modalPreview} alt="" width="540" height="960" decoding="async" />
      </figure>
      <figure className="LicenseCenter-device LicenseCenter-device--right">
        <img src={stackPreview} alt="" width="540" height="960" decoding="async" />
      </figure>
    </div>
  );
}

function PlanCard({ plan, onCheckout }) {
  return (
    <article className="LicenseCenter-plan" data-plan={plan.id}>
      <div className="LicenseCenter-planTop">
        <h3>{plan.name}</h3>
        <p>{plan.audience}</p>
      </div>
      <div className="LicenseCenter-planPrice">
        <strong>{plan.price}</strong>
        <span>{plan.priceNote}</span>
      </div>
      <p className="LicenseCenter-planDescription">{plan.description}</p>
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>
            <IconCheck size={15} /> {feature}
          </li>
        ))}
      </ul>
      <p className="LicenseCenter-planNote">{plan.note}</p>
      {plan.id === "free" ? (
        <a className="LicenseCenter-planAction" href="/docs">
          Start building <IconChevronR size={17} />
        </a>
      ) : (
        <button className="LicenseCenter-planAction" type="button" onClick={onCheckout}>
          Get this license <IconChevronR size={17} />
        </button>
      )}
    </article>
  );
}

export function LicenseCenter({ open, onOpenChange }) {
  const [panel, setPanel] = useState({ kind: "checkout", id: "individual" });
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (!open) setPanelOpen(false);
  }, [open]);

  const openPanel = (kind, id = "license") => {
    setPanel({ kind, id });
    setPanelOpen(true);
  };

  return (
    <Sheet.Root open={open} onOpenChange={onOpenChange}>
      <Sheet.Portal>
        <Sheet.View
          className="LicenseCenter-view"
          side="center"
          tracks="auto"
          swipeOvershoot={false}
          nativeEdgeSwipePrevention
          onClickOutside={{ dismiss: false }}
          enteringAnimationSettings={{
            easing: "spring",
            stiffness: 420,
            damping: 42,
            mass: 1.2,
          }}
        >
          <Sheet.Backdrop
            className="LicenseCenter-depthBackdrop"
            travelAnimation={{ opacity: ({ progress }) => Math.min(progress * 0.28, 0.28) }}
          />
          <Sheet.Content className="LicenseCenter-panel" stackingAnimation={stackAnimation}>
            <Sheet.BleedingBackground className="LicenseCenter-surface" />
            <Sheet.Handle className="LicenseCenter-handle" />
            <Sheet.Close className="LicenseCenter-close" aria-label="Close licensing">
              <IconChevronUp size={20} />
            </Sheet.Close>
            <Sheet.Close className="LicenseCenter-dismiss" aria-label="Close licensing">
              <IconClose size={19} />
            </Sheet.Close>

            <Sheet.Root open={panelOpen} onOpenChange={setPanelOpen}>
              <Scroll.Root className="LicenseCenter-depthScrollRoot">
                <Scroll.View className="LicenseCenter-depthScrollView">
                  <Scroll.Content className="LicenseCenter-depthScrollContent">
                <main className="LicenseCenter-main">
                  <ProductPreview />

                  <section className="LicenseCenter-accessIntro">
                    <Sheet.Title className="LicenseCenter-accessTitle">
                      Choose how you use Velvet UI.
                    </Sheet.Title>
                    <Sheet.Description className="LicenseCenter-accessDescription">
                      Start free for non-commercial work. When the work is commercial,
                      pay once and keep access to every future public version.
                    </Sheet.Description>
                  </section>

                  <section className="LicenseCenter-plans" aria-label="License options">
                    {plans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        onCheckout={() => openPanel("checkout", plan.id)}
                      />
                    ))}
                  </section>

                  <a
                    className="LicenseCenter-codebase"
                    href="mailto:msshanmukh@gmail.com?subject=Velvet%20UI%20codebase%20access"
                  >
                    <span>
                      <strong>Need readable codebase access?</strong>
                      <small>Tell us about your team and what you are building.</small>
                    </span>
                    <span>Talk to sales <IconChevronR size={17} /></span>
                  </a>

                  <section className="LicenseCenter-questions">
                    <h2>Good to know</h2>
                    <div className="LicenseCenter-questionList">
                      {questions.map((question) => (
                        <details key={question.title}>
                          <summary>
                            {question.title}
                            <span aria-hidden />
                          </summary>
                          <p>{question.answer}</p>
                        </details>
                      ))}
                    </div>
                  </section>

                  <section className="LicenseCenter-legalEntry">
                    <div>
                      <h2>Everything in writing.</h2>
                      <p>Read the license, purchase terms, and privacy notice before you pay.</p>
                    </div>
                    <button type="button" onClick={() => openPanel("legal")}>
                      Open legal terms <IconChevronR size={17} />
                    </button>
                  </section>

                  <footer className="LicenseCenter-footer">
                    <p>Dodo Payments handles checkout, taxes, receipts, and license-key delivery.</p>
                    <a href="mailto:msshanmukh@gmail.com">Questions? Email Sai</a>
                  </footer>
                </main>
                  </Scroll.Content>
                </Scroll.View>
              </Scroll.Root>
              <DetailSheet panel={panel} />
            </Sheet.Root>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
