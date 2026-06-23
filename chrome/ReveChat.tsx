"use client";

/**
 * ShopKart — chat launcher + custom chat window.
 *
 * A green, on-theme floating launcher and a 3-step chat window:
 *   1. welcome — greeting + "Message us"
 *   2. form    — pre-chat form (name + phone) like the reference REVE window
 *   3. chat    — a conversation view (message list + composer)
 *
 * Backend is intentionally NOT wired yet: submitting the form opens the local
 * chat UI and the composer echoes a placeholder agent acknowledgement. When the
 * backend is ready, replace `submitForm`/`send` with real calls (or, if you use
 * REVE Chat, set NEXT_PUBLIC_REVE_CHAT_ID and `bootReveChat` takes over).
 *
 * Everything is dynamic: brand from site settings, copy via the bilingual store.
 * Mounted globally from the Footer so it shows on every page.
 */

import { useEffect, useRef, useState } from "react";
import { FaLeaf } from "react-icons/fa";
import { FiMessageSquare, FiChevronDown, FiArrowLeft, FiSend } from "react-icons/fi";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { Editable } from "@/storefront-engine/editor/Editable";
import { useLang, t } from "../components/lang";
import "../styles.css";

const ACCOUNT_ID = process.env.NEXT_PUBLIC_REVE_CHAT_ID || "";

/** Lazy-inject the official REVE Chat v2 widget script (once). Used only when an
 *  account id is configured; otherwise the local chat UI below handles things. */
function bootReveChat(accountId: string): boolean {
  if (typeof window === "undefined" || !accountId) return false;
  const w = window as unknown as { __revechat_account?: string; __revechat_version?: number };
  if (document.getElementById("revechat-jssdk")) return true;
  w.__revechat_account = accountId;
  w.__revechat_version = 2;
  const s = document.createElement("script");
  s.id = "revechat-jssdk";
  s.async = true;
  s.src = "https://static.revechat.com/widget/scripts/new-livechat.js";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(s, first);
  return true;
}

type Step = "welcome" | "form" | "chat";
interface ChatMsg { from: "agent" | "user"; text: string }

export default function ReveChat({
  accountId = ACCOUNT_ID,
  replyTime,
}: { accountId?: string; replyTime?: string }) {
  const settings = useSiteSettings();
  const brand = settings.site_name || "us";
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const msgsRef = useRef<HTMLDivElement>(null);

  // Close on outside-click / Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Keep the conversation scrolled to the latest message.
  useEffect(() => {
    if (step === "chat") msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  const replyLabel = t(lang, `Typically replies in ${replyTime || "1 minute"}`, `সাধারণত ${replyTime || "1 মিনিট"}-এ উত্তর দেয়`);

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    // If a REVE account is configured, hand off to the real widget.
    if (accountId && bootReveChat(accountId)) { setOpen(false); return; }
    // Otherwise open the local chat UI (backend wiring comes later).
    const first = name.trim().split(" ")[0];
    setMessages([{
      from: "agent",
      text: t(
        lang,
        `Assalamu Alaikum ${first}! Welcome to ${brand}. How can we help you today?`,
        `আসসালামু আলাইকুম ${first}! ${brand}-এ স্বাগতম। আপনাকে কীভাবে সাহায্য করতে পারি?`,
      ),
    }]);
    setStep("chat");
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setDraft("");
    // Placeholder acknowledgement until the backend is connected.
    setTimeout(() => setMessages((m) => [...m, {
      from: "agent",
      text: t(
        lang,
        "Thanks for your message! A representative will get back to you shortly, in-sha-Allah.",
        "আপনার বার্তার জন্য ধন্যবাদ! একজন প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন, ইন-শা-আল্লাহ।",
      ),
    }]), 700);
  };

  return (
    <div className="tpl-rc">
      {open && (
        <div className={`tpl-rc__panel tpl-rc__panel--${step}`} ref={panelRef} role="dialog" aria-label={t(lang, "Chat", "চ্যাট")}>
          {/* ── Welcome ───────────────────────────────────────────── */}
          {step === "welcome" && (
            <>
              <div className="tpl-rc__glow" aria-hidden />
              <span className="tpl-rc__logo"><FaLeaf size={22} /></span>
              <div className="tpl-rc__welcome">
                <Editable section="chat" field="greeting" defaultValue={t(lang, "Assalamu Alaikum,", "আসসালামু আলাইকুম,")} label="Chat greeting">
                  {(v, ep) => <h3 {...ep}>{v}<br />{t(lang, `Welcome to ${brand}.`, `${brand}-এ স্বাগতম।`)}</h3>}
                </Editable>
                <Editable section="chat" field="subtitle" defaultValue={t(lang, "How can we help you?", "আপনাকে কিভাবে সহযোগিতা করতে পারি?")} label="Chat subtitle">
                  {(v, ep) => <p {...ep}>{v}</p>}
                </Editable>
              </div>
              <button type="button" className="tpl-rc__msg" onClick={() => setStep("form")}>
                <span className="tpl-rc__msg-ic"><FiMessageSquare size={18} /></span>
                <span className="tpl-rc__msg-txt">
                  <Editable section="chat" field="cta" defaultValue={t(lang, "Message us", "মেসেজ করুন")} label="Chat CTA">
                    {(v, ep) => <b {...ep}>{v}</b>}
                  </Editable>
                  <small>{replyLabel}</small>
                </span>
              </button>
              <p className="tpl-rc__powered">Powered by {brand} Chat</p>
            </>
          )}

          {/* ── Header band (form + chat) ─────────────────────────── */}
          {step !== "welcome" && (
            <div className="tpl-rc__head">
              <button type="button" className="tpl-rc__back" aria-label={t(lang, "Back", "পেছনে")} onClick={() => setStep(step === "chat" ? "form" : "welcome")}>
                <FiArrowLeft size={20} />
              </button>
              <span className="tpl-rc__headlogo"><FaLeaf size={20} /></span>
              <b className="tpl-rc__headbrand">{brand}</b>
              <small className="tpl-rc__headreply">{replyLabel}</small>
            </div>
          )}

          {/* ── Pre-chat form ─────────────────────────────────────── */}
          {step === "form" && (
            <form className="tpl-rc__sheet" onSubmit={submitForm}>
              <p className="tpl-rc__lead">
                {t(lang, "Share the details below to talk to a customer care representative.", "কাস্টমার কেয়ার প্রতিনিধির সাথে কথা বলতে নিচের তথ্যগুলো শেয়ার করুন।")}
              </p>
              <label className="tpl-rc__label" htmlFor="rc-name">{t(lang, "Full Name", "পূর্ণ নাম")} <i>*</i></label>
              <input id="rc-name" className="tpl-rc__input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t(lang, "Enter your name", "আপনার নাম লিখুন")} required />
              <label className="tpl-rc__label" htmlFor="rc-phone">{t(lang, "Phone Number", "ফোন নম্বর")} <i>*</i></label>
              <div className="tpl-rc__phone">
                <span className="tpl-rc__cc">🇧🇩 +880</span>
                <input id="rc-phone" className="tpl-rc__input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t(lang, "Your phone number here", "আপনার ফোন নম্বর")} required />
              </div>
              <button type="submit" className="tpl-rc__start">{t(lang, "Start Chat", "চ্যাট শুরু করুন")}</button>
              <p className="tpl-rc__powered tpl-rc__powered--dark">Powered by {brand} Chat</p>
            </form>
          )}

          {/* ── Conversation ──────────────────────────────────────── */}
          {step === "chat" && (
            <div className="tpl-rc__chat">
              <div className="tpl-rc__msgs" ref={msgsRef}>
                {messages.map((m, i) => (
                  <div key={i} className={`tpl-rc__bubble tpl-rc__bubble--${m.from}`}>{m.text}</div>
                ))}
              </div>
              <form className="tpl-rc__compose" onSubmit={send}>
                <input className="tpl-rc__input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t(lang, "Type a message…", "একটি বার্তা লিখুন…")} aria-label={t(lang, "Message", "বার্তা")} />
                <button type="submit" className="tpl-rc__sendbtn" aria-label={t(lang, "Send", "পাঠান")}><FiSend size={18} /></button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating chat launcher */}
      <div className="tpl-rc__dock">
        <button
          type="button"
          className="tpl-rc__fab tpl-rc__fab--main"
          aria-label={open ? t(lang, "Close chat", "চ্যাট বন্ধ করুন") : t(lang, "Open chat", "চ্যাট খুলুন")}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <FiChevronDown size={24} /> : <FiMessageSquare size={24} />}
        </button>
      </div>
    </div>
  );
}
