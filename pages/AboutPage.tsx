"use client";

/**
 * About page — marketplace storefront.
 * Structure mirrors the reference layout: gradient hero, "Our Mission" with
 * stat cards, "How it started" journey + timeline, "Why choose us" feature
 * grid, and a team section. Every label is Editable so tenants personalise it.
 */

import { FiHeart, FiTarget, FiAward, FiTruck, FiTag, FiRefreshCw, FiUsers } from "react-icons/fi";
import { Editable } from "@/storefront-engine/editor/Editable";
import "../styles.css";

const STATS = [
  { value: "200+",    label: "Products" },
  { value: "10,000+", label: "Happy customers" },
  { value: "5+",      label: "Years of service" },
];

const FEATURES = [
  { icon: FiAward,     title: "100% pure",       body: "No adulteration, no preservatives — lab-checked purity in every bottle and jar." },
  { icon: FiTruck,     title: "Fresh delivery",  body: "Free home delivery inside Dhaka and fast nationwide courier across Bangladesh." },
  { icon: FiTag,       title: "Honest prices",   body: "Sourced straight from trusted farmers, so premium quality stays affordable." },
  { icon: FiRefreshCw, title: "Easy returns",    body: "Not happy with your order? Return it hassle-free — your trust comes first." },
];

const TIMELINE = [
  "Started sourcing pure mustard oil & ghee from local farmers",
  "Launched online ordering with cash on delivery",
  "Crossed 10,000 happy families served",
  "Expanded to honey, dates, nuts, spices & more organic foods",
];

const TEAM = [
  { name: "Alex Morgan",   role: "Founder & CEO" },
  { name: "Sam Rivera",    role: "Head of Product" },
  { name: "Jordan Lee",    role: "Sales & Marketing" },
  { name: "Taylor Brooks", role: "Customer Care" },
];

export default function AboutPage() {
  return (
    <div className="tpl-page">
      {/* Hero */}
      <section className="tpl-pagehero">
        <span className="tpl-pagehero__pill"><FiHeart size={12} /> About us</span>
        <Editable section="about" field="title" defaultValue="About Us" label="About title">
          {(v, ep) => <h1 {...ep}>{v}</h1>}
        </Editable>
        <Editable section="about" field="subtitle" defaultValue="A trusted organic food store bringing 100% pure & safe food from farm to your family." label="About subtitle">
          {(v, ep) => <p {...ep}>{v}</p>}
        </Editable>
      </section>

      {/* Mission + stats */}
      <section>
        <div className="tpl-secthead">
          <h2><FiTarget size={20} /> Our Mission</h2>
          <div className="tpl-uline" />
          <Editable
            section="about"
            field="mission"
            defaultValue="Our mission is to bring 100% pure, organic and safe food to every family — sourced directly from honest farmers and delivered fresh, with nothing artificial added."
            label="Mission statement"
          >
            {(v, ep) => <p {...ep}>{v}</p>}
          </Editable>
        </div>
        <div className="tpl-stats">
          {STATS.map((s, i) => (
            <div key={i} className="tpl-stat">
              <Editable section="about" field={`stat${i + 1}Value`} defaultValue={s.value} label={`Stat ${i + 1} value`}>
                {(v, ep) => <b {...ep}>{v}</b>}
              </Editable>
              <Editable section="about" field={`stat${i + 1}Label`} defaultValue={s.label} label={`Stat ${i + 1} label`}>
                {(v, ep) => <span {...ep}>{v}</span>}
              </Editable>
            </div>
          ))}
        </div>
      </section>

      {/* Journey + timeline */}
      <section className="tpl-panel" style={{ marginTop: 24 }}>
        <Editable section="about" field="journeyTitle" defaultValue="How It Started" label="Journey title">
          {(v, ep) => <h2 {...ep} style={{ fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>{v}</h2>}
        </Editable>
        <Editable
          section="about"
          field="journeyBody"
          defaultValue="Our journey began with a simple idea — that every family deserves food they can trust. Frustrated by adulterated products in the market, we started sourcing pure mustard oil, ghee and honey straight from trusted farmers. Today, thousands of families rely on us for safe, organic food every day."
          label="Journey body"
        >
          {(v, ep) => <p {...ep} style={{ color: "var(--tpl-muted)", lineHeight: 1.8, fontSize: 14, margin: "0 0 4px", whiteSpace: "pre-line" }}>{v}</p>}
        </Editable>
        <ul className="tpl-timeline">
          {TIMELINE.map((t, i) => (
            <li key={i}>
              <Editable section="about" field={`milestone${i + 1}`} defaultValue={t} label={`Milestone ${i + 1}`}>
                {(v, ep) => <span {...ep}>{v}</span>}
              </Editable>
            </li>
          ))}
        </ul>
      </section>

      {/* Why choose us */}
      <section>
        <div className="tpl-secthead">
          <h2>Why Choose Us?</h2>
          <div className="tpl-uline" />
          <Editable section="about" field="whyIntro" defaultValue="We don't just sell products — we care about your experience from order to delivery." label="Why-choose-us intro">
            {(v, ep) => <p {...ep}>{v}</p>}
          </Editable>
        </div>
        <div className="tpl-features">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="tpl-feature">
                <span className="tpl-feature__icon"><Icon size={20} /></span>
                <Editable section="about" field={`feature${i + 1}Title`} defaultValue={f.title} label={`Feature ${i + 1} title`}>
                  {(v, ep) => <h3 {...ep}>{v}</h3>}
                </Editable>
                <Editable section="about" field={`feature${i + 1}Body`} defaultValue={f.body} label={`Feature ${i + 1} body`}>
                  {(v, ep) => <p {...ep}>{v}</p>}
                </Editable>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team */}
      <section>
        <div className="tpl-secthead">
          <h2><FiUsers size={20} /> Our Team</h2>
          <div className="tpl-uline" />
          <Editable section="about" field="teamIntro" defaultValue="Our experienced and dedicated team is always here to help you." label="Team intro">
            {(v, ep) => <p {...ep}>{v}</p>}
          </Editable>
        </div>
        <div className="tpl-team">
          {TEAM.map((m, i) => (
            <div key={i} className="tpl-member">
              <span className="tpl-member__avatar">{m.name.charAt(0)}</span>
              <Editable section="about" field={`member${i + 1}Name`} defaultValue={m.name} label={`Member ${i + 1} name`}>
                {(v, ep) => <b {...ep}>{v}</b>}
              </Editable>
              <Editable section="about" field={`member${i + 1}Role`} defaultValue={m.role} label={`Member ${i + 1} role`}>
                {(v, ep) => <span {...ep}>{v}</span>}
              </Editable>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
