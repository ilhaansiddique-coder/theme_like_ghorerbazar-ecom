"use client";

/**
 * Privacy / Terms / Refund pages — three named components from one file.
 * The manifest maps each to its loadPrivacyPage / loadTermsPage /
 * loadRefundPage slot. Shared layout: gradient hero, intro callout, and
 * numbered policy sections.
 */

import { FiLock, FiFileText, FiRefreshCw } from "react-icons/fi";
import type { IconType } from "react-icons";
import type { PolicyContent, PrivacyPageProps, RefundPageProps, TermsPageProps } from "@/storefront-engine/types/pages";
import { Editable } from "@/storefront-engine/editor/Editable";
import "../styles.css";

function pick(field: { en: string; bn: string }, lang: "en" | "bn"): string {
  return (lang === "bn" ? field.bn : field.en) || field.en || field.bn || "";
}

// Drop a leading "1." / "2)" etc. so it isn't doubled with the number badge.
function stripLeadingNumber(s: string): string {
  return s.replace(/^\s*\d+\s*[.)]?\s*/, "");
}

const META: Record<"privacy" | "terms" | "refund", { icon: IconType; pill: string }> = {
  privacy: { icon: FiLock,       pill: "Privacy" },
  terms:   { icon: FiFileText,   pill: "Terms" },
  refund:  { icon: FiRefreshCw,  pill: "Refund" },
};

function PolicyView({ content, lang, section }: { content: PolicyContent; lang: "en" | "bn"; section: "privacy" | "terms" | "refund" }) {
  const title = pick(content.title, lang);
  const intro = pick(content.intro, lang);
  const lastUpdated = pick(content.lastUpdated, lang);
  const { icon: Icon, pill } = META[section];

  return (
    <div className="tpl-page" style={{ maxWidth: 820 }}>
      {/* Hero */}
      <section className="tpl-pagehero">
        <span className="tpl-pagehero__pill"><Icon size={12} /> {pill}</span>
        <Editable section={section} field="title" defaultValue={title} label="Page title">
          {(v, ep) => <h1 {...ep}>{v}</h1>}
        </Editable>
        {lastUpdated && <p>Last updated: {lastUpdated}</p>}
      </section>

      {/* Intro callout */}
      {intro && (
        <Editable section={section} field="intro" defaultValue={intro} label="Intro">
          {(v, ep) => <div {...ep} className="tpl-callout">{v}</div>}
        </Editable>
      )}

      {/* Numbered sections */}
      {content.sections.map((s, i) => {
        const n = i + 1;
        return (
          <div key={i} className="tpl-policy__sec">
            <span className="tpl-policy__num">{n}</span>
            <div>
              <Editable section={section} field={`section${n}Title`} defaultValue={stripLeadingNumber(pick(s.title, lang))} label={`Section ${n} title`}>
                {(v, ep) => <h2 {...ep}>{v}</h2>}
              </Editable>
              <Editable section={section} field={`section${n}Content`} defaultValue={pick(s.content, lang)} label={`Section ${n} body`}>
                {(v, ep) => <p {...ep}>{v}</p>}
              </Editable>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PrivacyPage({ content, lang }: PrivacyPageProps) {
  return <PolicyView content={content} lang={lang} section="privacy" />;
}
export function TermsPage({ content, lang }: TermsPageProps) {
  return <PolicyView content={content} lang={lang} section="terms" />;
}
export function RefundPage({ content, lang }: RefundPageProps) {
  return <PolicyView content={content} lang={lang} section="refund" />;
}
