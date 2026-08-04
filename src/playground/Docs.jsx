import { Link } from "@tanstack/react-router";
import { Children, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DOCS, DOC_BY_SLUG, docToMarkdown, getDocPath } from "../docs/catalog.js";
import "./Docs.css";

const SECTIONS = DOCS.map((doc) => ({
  id: doc.slug,
  label: doc.title,
  group: doc.group,
}));

const GROUPS = SECTIONS.reduce((groups, section) => {
  (groups[section.group] ||= []).push(section);
  return groups;
}, {});

const DOCS_NAV_SCROLL_KEY = "velvet-ui:docs-nav-scroll";

const readDocsNavScroll = () => {
  if (typeof window === "undefined") return 0;

  try {
    return Number(window.sessionStorage.getItem(DOCS_NAV_SCROLL_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeDocsNavScroll = (scrollTop) => {
  try {
    window.sessionStorage.setItem(DOCS_NAV_SCROLL_KEY, String(scrollTop));
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
};

const headingId = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const headingsOf = (markdown) =>
  markdown
    .split("\n")
    .flatMap((line) => {
      const match = /^## (.+)$/.exec(line);
      return match
        ? [{ id: headingId(match[1]), label: match[1].replace(/[`*_]/g, "") }]
        : [];
    });

const RULES = [
  ["c", /\/\/[^\n]*|#[^\n]*/],
  ["s", /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/],
  ["t", /<\/?[A-Za-z][\w.]*/],
  ["a", /[A-Za-z_]\w*(?==)/],
  ["k", /\b(?:import|from|export|default|return|const|let|var|function|if|else|new|await|async|true|false|null|undefined)\b/],
  ["y", /\b[A-Z]\w*\b/],
  ["n", /\b\d+(?:\.\d+)?\b/],
];

const MASTER = new RegExp(RULES.map((rule) => `(${rule[1].source})`).join("|"), "g");

const highlight = (source) => {
  const output = [];
  let last = 0;
  let match;
  let key = 0;
  MASTER.lastIndex = 0;

  while ((match = MASTER.exec(source))) {
    if (match.index > last) output.push(source.slice(last, match.index));
    let className = "tok";
    for (let group = 1; group <= RULES.length; group += 1) {
      if (match[group] != null) {
        className = `tok-${RULES[group - 1][0]}`;
        break;
      }
    }
    output.push(
      <span key={key++} className={className}>
        {match[0]}
      </span>
    );
    last = match.index + match[0].length;
  }

  if (last < source.length) output.push(source.slice(last));
  return output;
};

const CodeBlock = ({ lang = "tsx", children }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(children).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className="Code">
      <div className="Code-head">
        <span className="Code-lang">{lang}</span>
        <button className="Code-copy" type="button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="Code-body">
        <code>{highlight(children)}</code>
      </pre>
    </div>
  );
};

const MarkdownGuide = ({ markdown }) => (
  <div className="Docs-markdown">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 id={headingId(children)} className="Docs-h2">
            {children}
          </h2>
        ),
        h3: ({ children }) => <h3 className="Docs-h3">{children}</h3>,
        p: ({ children }) => <p className="Docs-p">{children}</p>,
        ul: ({ children }) => <ul className="Docs-list">{children}</ul>,
        ol: ({ children }) => <ol className="Docs-list Docs-list--ordered">{children}</ol>,
        blockquote: ({ children }) => <aside className="Docs-note">{children}</aside>,
        a: ({ href, children }) => <a href={href}>{children}</a>,
        table: ({ children }) => (
          <div className="Docs-tableWrap">
            <table className="Docs-table">{children}</table>
          </div>
        ),
        pre: ({ children }) => {
          const child = Children.only(children);
          const language = child.props.className?.replace("language-", "") || "text";
          const source = String(child.props.children).replace(/\n$/, "");
          return <CodeBlock lang={language}>{source}</CodeBlock>;
        },
        code: ({ children, node: _node, ...props }) => (
          <code {...props}>{children}</code>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  </div>
);

const DocsPage = ({ doc }) => {
  const [copied, setCopied] = useState(false);
  const markdown = docToMarkdown(doc);

  const copyMarkdown = () => {
    navigator.clipboard?.writeText(markdown).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <article className={`Docs-article${doc.slug === "changelog" ? " Docs-article--changelog" : ""}`}>
      <header className="Docs-pageHead">
        <div className="Docs-pageEyebrow">{doc.group}</div>
        <h1 className="Docs-title">{doc.title}</h1>
        <p className="Docs-lead">{doc.description}</p>
        <div className="Docs-pageActions" aria-label="Markdown actions">
          <a
            className="Docs-pageAction"
            href={`/docs/${doc.slug}.md`}
            target="_blank"
            rel="noreferrer"
          >
            View as Markdown
          </a>
          <button className="Docs-pageAction" type="button" onClick={copyMarkdown}>
            {copied ? "Markdown copied" : "Copy Markdown"}
          </button>
        </div>
      </header>
      <MarkdownGuide markdown={doc.guide} />
    </article>
  );
};

const NavigationGroups = ({ active, mobile = false }) => (
  <div className={mobile ? "Docs-mobileMenu" : "Docs-desktopNav"}>
    {Object.entries(GROUPS).map(([group, items]) => (
      <div className="Docs-group" key={group}>
        <div className="Docs-groupLabel">{group}</div>
        {items.map((item) => (
          <Link
            key={item.id}
            to={getDocPath(item.id)}
            className="Docs-navLink"
            aria-current={active === item.id ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
    ))}
  </div>
);

export const Docs = ({ section = "overview" }) => {
  const active = DOC_BY_SLUG[section] ? section : "overview";
  const doc = DOC_BY_SLUG[active];
  const pageHeadings = headingsOf(doc.guide);
  const docIndex = DOCS.findIndex((item) => item.slug === active);
  const previousDoc = DOCS[docIndex - 1];
  const nextDoc = DOCS[docIndex + 1];
  const restoreNavScroll = useCallback((node) => {
    if (node) node.scrollTop = readDocsNavScroll();
  }, []);

  return (
    <div className="Docs">
      <aside
        ref={restoreNavScroll}
        className="Docs-side"
        aria-label="Documentation"
        onScroll={(event) => writeDocsNavScroll(event.currentTarget.scrollTop)}
      >
        <details className="Docs-mobileNav">
          <summary>
            <span>Browse documentation</span>
            <strong>{doc.title}</strong>
          </summary>
          <NavigationGroups active={active} mobile />
        </details>
        <NavigationGroups active={active} />
      </aside>

      <main className="Docs-main">
        <DocsPage doc={doc} />
        <nav className="Docs-pagination" aria-label="Documentation pages">
          {previousDoc ? (
            <Link to={getDocPath(previousDoc.slug)}>
              <span>Previous</span>
              <strong>{previousDoc.title}</strong>
            </Link>
          ) : <span />}
          {nextDoc ? (
            <Link to={getDocPath(nextDoc.slug)}>
              <span>Next</span>
              <strong>{nextDoc.title}</strong>
            </Link>
          ) : <span />}
        </nav>
      </main>

      <nav className="Docs-toc" aria-label="On this page">
        <div className="Docs-tocLabel">On this page</div>
        {pageHeadings.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="Docs-tocLink"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
};
