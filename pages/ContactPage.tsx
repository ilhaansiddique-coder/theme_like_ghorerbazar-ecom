"use client";

import { useState } from "react";
import { FiMail, FiMapPin, FiPhone, FiMessageCircle, FiSend } from "react-icons/fi";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { trackLead } from "@/lib/analytics";
import { Editable } from "@/storefront-engine/editor/Editable";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import "../styles.css";

const SUBJECTS: DropdownOption[] = [
  { value: "general", label: "General" },
  { value: "order",   label: "Order" },
  { value: "product", label: "Product" },
];

export default function ContactPage() {
  const settings = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "general", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          subject: form.subject,
          message: form.message,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      trackLead({ em: form.email || undefined, ph: form.phone || undefined, fn: form.name });
      setSent(true);
    } catch { /* show generic error */ }
    finally { setSending(false); }
  };

  return (
    <div className="tpl-page">
      {/* Hero */}
      <section className="tpl-pagehero">
        <span className="tpl-pagehero__pill"><FiMessageCircle size={12} /> Talk to us</span>
        <Editable section="contact" field="title" defaultValue="Contact Us" label="Contact title">
          {(v, ep) => <h1 {...ep}>{v}</h1>}
        </Editable>
        <Editable section="contact" field="subtitle" defaultValue="Have a question? We're here to help." label="Contact subtitle">
          {(v, ep) => <p {...ep}>{v}</p>}
        </Editable>
      </section>

      <div className="tpl-cols">
        {sent ? (
          <div className="tpl-panel" style={{ textAlign: "center", padding: "40px 24px" }}>
            <h2 style={{ margin: "0 0 8px", fontWeight: 800 }}>Thank you 🎉</h2>
            <p style={{ color: "var(--tpl-muted)", margin: 0 }}>Your message has been sent — we&apos;ll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="tpl-panel">
            <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>Send us a message</h2>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="tpl-field">
                  <span>Name *</span>
                  <input type="text" required placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>
                <label className="tpl-field">
                  <span>Email *</span>
                  <input type="email" required placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="tpl-field">
                  <span>Phone</span>
                  <input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </label>
                <label className="tpl-field">
                  <span>Subject *</span>
                  <Dropdown block ariaLabel="Subject" value={form.subject} options={SUBJECTS} onChange={(v) => setForm({ ...form, subject: v })} />
                </label>
              </div>
              <label className="tpl-field">
                <span>Message *</span>
                <textarea required rows={5} placeholder="Write your message here…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </label>
              <button type="submit" className="tpl-btn" style={{ justifySelf: "start" }} disabled={sending}>
                <FiSend size={15} /> {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        )}

        <aside className="tpl-panel" style={{ height: "fit-content" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Contact Info</h2>
          {settings.address && (
            <p className="tpl-cinfo"><FiMapPin size={16} /><span><b>Address</b>{settings.address}</span></p>
          )}
          {settings.phone && (
            <p className="tpl-cinfo"><FiPhone size={16} /><span><b>Phone</b>{settings.phone}</span></p>
          )}
          {settings.email && (
            <p className="tpl-cinfo"><FiMail size={16} /><span><b>Email</b>{settings.email}</span></p>
          )}
          {!settings.address && !settings.phone && !settings.email && (
            <p style={{ color: "var(--tpl-muted)", fontSize: 14, margin: 0 }}>
              Add your address, phone and email in store settings to show them here.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
