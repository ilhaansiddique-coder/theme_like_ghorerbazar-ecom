"use client";

/**
 * Customer account dashboard — Dashboard · Orders · Wishlist · Addresses · Profile.
 * Gated by the theme-local session (components/auth.ts). All data is theme-local
 * + persisted (orders, wishlist, addresses) so the preview is fully interactive;
 * in production swap the stores for the engine's account API — the UI is unchanged.
 *
 * Deep-linkable: /account?tab=wishlist (the navbar heart links here).
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FiGrid, FiShoppingBag, FiHeart, FiMapPin, FiUser, FiLogOut,
  FiPlus, FiTrash2, FiChevronRight, FiPackage,
} from "react-icons/fi";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { useAuth } from "../components/auth";
import { useOrders, type OrderStatus } from "../components/orders";
import { useWishlist } from "../components/wishlist";
import { useAddresses } from "../components/addresses";
import AuthModal from "../chrome/AuthModal";
import ProductCard from "../components/ProductCard";
import { formatMoney } from "../components/helpers";
import { useLang, t, type Lang } from "../components/lang";
import "../styles.css";

type Tab = "dashboard" | "orders" | "wishlist" | "addresses" | "profile";

const TABS: { id: Tab; en: string; bn: string; icon: typeof FiGrid }[] = [
  { id: "dashboard", en: "Dashboard", bn: "ড্যাশবোর্ড", icon: FiGrid },
  { id: "orders",    en: "My Orders", bn: "আমার অর্ডার", icon: FiShoppingBag },
  { id: "wishlist",  en: "Wishlist",  bn: "উইশলিস্ট",    icon: FiHeart },
  { id: "addresses", en: "Addresses", bn: "ঠিকানা",      icon: FiMapPin },
  { id: "profile",   en: "Profile",   bn: "প্রোফাইল",     icon: FiUser },
];

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const statusClass = (s: OrderStatus) =>
  ({ Processing: "is-processing", Shipped: "is-shipped", Delivered: "is-delivered", Cancelled: "is-cancelled" }[s]);

function AccountContent() {
  const params = useSearchParams();
  const { lang } = useLang();
  const settings = useSiteSettings();
  const currency = settings.currency_symbol || "৳";
  const { user, logout, updateProfile } = useAuth();
  const { orders } = useOrders();
  const wish = useWishlist();
  const { addresses, save: saveAddress, remove: removeAddress } = useAddresses();

  const initial = (params.get("tab") as Tab) || "dashboard";
  const [tab, setTab] = useState<Tab>(TABS.some((x) => x.id === initial) ? initial : "dashboard");
  const [authOpen, setAuthOpen] = useState(false);

  // ── Not signed in ─────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="tpl-page tpl-account tpl-account--guest">
        <div className="tpl-panel tpl-account__signin">
          <span className="tpl-account__avatar tpl-account__avatar--lg"><FiUser size={30} /></span>
          <h2>{t(lang, "Sign in to your account", "আপনার অ্যাকাউন্টে সাইন ইন করুন")}</h2>
          <p>{t(lang, "Track orders, save your wishlist and check out faster.", "অর্ডার ট্র্যাক করুন, উইশলিস্ট সংরক্ষণ করুন ও দ্রুত চেকআউট করুন।")}</p>
          <button type="button" className="tpl-btn" onClick={() => setAuthOpen(true)}>
            {t(lang, "Sign in / Register", "সাইন ইন / রেজিস্টার")}
          </button>
          <Link href="/shop" className="tpl-account__shoplink">{t(lang, "Continue shopping", "শপিং চালিয়ে যান")} <FiChevronRight size={14} /></Link>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="tpl-page tpl-account">
      {/* Header */}
      <div className="tpl-panel tpl-account__head">
        <span className="tpl-account__avatar">{user.name.charAt(0).toUpperCase()}</span>
        <div className="tpl-account__who">
          <b>{user.name}</b>
          <span>{user.email}</span>
        </div>
        <button type="button" className="tpl-account__logout" onClick={logout}>
          <FiLogOut size={16} /> {t(lang, "Logout", "লগআউট")}
        </button>
      </div>

      <div className="tpl-account__grid">
        {/* Tab rail */}
        <nav className="tpl-panel tpl-account__nav" aria-label="Account sections">
          {TABS.map((x) => {
            const Icon = x.icon;
            return (
              <button key={x.id} type="button" className={`tpl-account__navlink${tab === x.id ? " is-active" : ""}`} onClick={() => setTab(x.id)}>
                <Icon size={17} /> <span>{t(lang, x.en, x.bn)}</span>
                {x.id === "wishlist" && wish.count > 0 && <i className="tpl-account__navbadge">{wish.count}</i>}
                {x.id === "orders" && orders.length > 0 && <i className="tpl-account__navbadge">{orders.length}</i>}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <section className="tpl-account__panel">
          {tab === "dashboard" && <Dashboard lang={lang} name={user.name} orders={orders} wishCount={wish.count} addrCount={addresses.length} currency={currency} onGo={setTab} />}
          {tab === "orders" && <Orders lang={lang} orders={orders} currency={currency} onShop={() => setTab("dashboard")} />}
          {tab === "wishlist" && (
            <div>
              <h3 className="tpl-account__title">{t(lang, "My Wishlist", "আমার উইশলিস্ট")}</h3>
              {wish.items.length === 0 ? (
                <EmptyState lang={lang} icon={<FiHeart size={26} />} text={t(lang, "Your wishlist is empty.", "আপনার উইশলিস্ট খালি।")} />
              ) : (
                <div className="tpl-grid">{wish.items.map((p, i) => <ProductCard product={p} key={p.id} priority={i < 4} />)}</div>
              )}
            </div>
          )}
          {tab === "addresses" && <Addresses lang={lang} addresses={addresses} onSave={saveAddress} onRemove={removeAddress} />}
          {tab === "profile" && <Profile lang={lang} user={user} onSave={updateProfile} onLogout={logout} />}
        </section>
      </div>
    </div>
  );
}

// ── Dashboard tab ─────────────────────────────────────────────────────────
function Dashboard({ lang, name, orders, wishCount, addrCount, currency, onGo }: {
  lang: Lang; name: string; orders: ReturnType<typeof useOrders>["orders"]; wishCount: number; addrCount: number; currency: string; onGo: (t: Tab) => void;
}) {
  const recent = orders[0];
  const stats = [
    { k: "orders" as Tab, label: t(lang, "Orders", "অর্ডার"), value: orders.length, icon: FiShoppingBag },
    { k: "wishlist" as Tab, label: t(lang, "Wishlist", "উইশলিস্ট"), value: wishCount, icon: FiHeart },
    { k: "addresses" as Tab, label: t(lang, "Addresses", "ঠিকানা"), value: addrCount, icon: FiMapPin },
  ];
  return (
    <div>
      <h3 className="tpl-account__title">{t(lang, `Welcome back, ${name.split(" ")[0]}!`, `স্বাগতম, ${name.split(" ")[0]}!`)}</h3>
      <div className="tpl-account__stats">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.k} type="button" className="tpl-account__stat" onClick={() => onGo(s.k)}>
              <Icon size={20} />
              <b>{s.value}</b>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
      {recent ? (
        <div className="tpl-account__recent">
          <div className="tpl-account__recenthead">
            <b>{t(lang, "Latest order", "সর্বশেষ অর্ডার")}</b>
            <button type="button" className="tpl-viewall" onClick={() => onGo("orders")}>{t(lang, "View all", "সব দেখুন")} <FiChevronRight size={13} /></button>
          </div>
          <OrderCard lang={lang} order={recent} currency={currency} />
        </div>
      ) : (
        <EmptyState lang={lang} icon={<FiPackage size={26} />} text={t(lang, "No orders yet.", "এখনও কোনো অর্ডার নেই।")} cta={{ href: "/shop", label: t(lang, "Start shopping", "শপিং শুরু করুন") }} />
      )}
    </div>
  );
}

// ── Orders tab ────────────────────────────────────────────────────────────
function Orders({ lang, orders, currency }: { lang: Lang; orders: ReturnType<typeof useOrders>["orders"]; currency: string; onShop: () => void }) {
  return (
    <div>
      <h3 className="tpl-account__title">{t(lang, "My Orders", "আমার অর্ডার")}</h3>
      {orders.length === 0 ? (
        <EmptyState lang={lang} icon={<FiShoppingBag size={26} />} text={t(lang, "You have no orders yet.", "আপনার কোনো অর্ডার নেই।")} cta={{ href: "/shop", label: t(lang, "Start shopping", "শপিং শুরু করুন") }} />
      ) : (
        <div className="tpl-account__orders">
          {orders.map((o) => <OrderCard key={o.token} lang={lang} order={o} currency={currency} />)}
        </div>
      )}
    </div>
  );
}

function OrderCard({ lang, order, currency }: { lang: Lang; order: ReturnType<typeof useOrders>["orders"][number]; currency: string }) {
  return (
    <div className="tpl-ordercard">
      <div className="tpl-ordercard__top">
        <div>
          <b className="tpl-ordercard__id">#{order.token}</b>
          <span className="tpl-ordercard__date">{fmtDate(order.date)}</span>
        </div>
        <span className={`tpl-ostatus ${statusClass(order.status)}`}>{order.status}</span>
      </div>
      <div className="tpl-ordercard__items">
        {order.items.map((it) => (
          <div key={`${it.id}-${it.variantLabel || ""}`} className="tpl-ordercard__line">
            <span>{it.name}{it.variantLabel ? ` · ${it.variantLabel}` : ""} × {it.quantity}</span>
            <b>{formatMoney(it.price * it.quantity, currency)}</b>
          </div>
        ))}
      </div>
      <div className="tpl-ordercard__foot">
        <Link href={`/track-order?order=${order.token}`} className="tpl-ordercard__track">{t(lang, "Track order", "অর্ডার ট্র্যাক")} <FiChevronRight size={13} /></Link>
        <span className="tpl-ordercard__total">{t(lang, "Total", "মোট")}: <b>{formatMoney(order.total, currency)}</b></span>
      </div>
    </div>
  );
}

// ── Addresses tab ─────────────────────────────────────────────────────────
function Addresses({ lang, addresses, onSave, onRemove }: {
  lang: Lang; addresses: ReturnType<typeof useAddresses>["addresses"]; onSave: ReturnType<typeof useAddresses>["save"]; onRemove: (id: string) => void;
}) {
  const blank = { label: "Home", name: "", phone: "", line: "", city: "", isDefault: false };
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setForm(blank);
    setShowForm(false);
  };

  return (
    <div>
      <div className="tpl-account__titlerow">
        <h3 className="tpl-account__title">{t(lang, "Saved Addresses", "সংরক্ষিত ঠিকানা")}</h3>
        {!showForm && (
          <button type="button" className="tpl-account__add" onClick={() => setShowForm(true)}><FiPlus size={15} /> {t(lang, "Add new", "নতুন যোগ")}</button>
        )}
      </div>

      {showForm && (
        <form className="tpl-account__addrform" onSubmit={submit}>
          <div className="tpl-account__addrgrid">
            <label className="tpl-field"><span>{t(lang, "Label", "লেবেল")}</span><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home / Office" /></label>
            <label className="tpl-field"><span>{t(lang, "Full name", "পূর্ণ নাম")}</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label className="tpl-field"><span>{t(lang, "Phone", "ফোন")}</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
            <label className="tpl-field"><span>{t(lang, "City", "শহর")}</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></label>
          </div>
          <label className="tpl-field"><span>{t(lang, "Address", "ঠিকানা")}</span><textarea rows={2} value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} required /></label>
          <label className="tpl-account__check"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> {t(lang, "Set as default", "ডিফল্ট হিসেবে সেট করুন")}</label>
          <div className="tpl-account__addrbtns">
            <button type="submit" className="tpl-btn">{t(lang, "Save address", "ঠিকানা সংরক্ষণ")}</button>
            <button type="button" className="tpl-account__cancel" onClick={() => { setShowForm(false); setForm(blank); }}>{t(lang, "Cancel", "বাতিল")}</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <EmptyState lang={lang} icon={<FiMapPin size={26} />} text={t(lang, "No saved addresses.", "কোনো সংরক্ষিত ঠিকানা নেই।")} />
      ) : (
        <div className="tpl-account__addrlist">
          {addresses.map((a) => (
            <div key={a.id} className="tpl-addrcard">
              <div className="tpl-addrcard__top">
                <b>{a.label}{a.isDefault && <i className="tpl-addrcard__default">{t(lang, "Default", "ডিফল্ট")}</i>}</b>
                <button type="button" className="tpl-addrcard__del" onClick={() => onRemove(a.id)} aria-label="Delete address"><FiTrash2 size={15} /></button>
              </div>
              <p>{a.name} · {a.phone}</p>
              <p>{a.line}, {a.city}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────
function Profile({ lang, user, onSave, onLogout }: {
  lang: Lang; user: NonNullable<ReturnType<typeof useAuth>["user"]>; onSave: (p: { name?: string; phone?: string }) => void; onLogout: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name: name.trim() || user.name, phone: phone.trim() || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h3 className="tpl-account__title">{t(lang, "Profile", "প্রোফাইল")}</h3>
      <form className="tpl-account__profile" onSubmit={submit}>
        <label className="tpl-field"><span>{t(lang, "Full name", "পূর্ণ নাম")}</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="tpl-field"><span>{t(lang, "Email", "ইমেইল")}</span><input value={user.email} disabled /></label>
        <label className="tpl-field"><span>{t(lang, "Phone", "ফোন")}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXX-XXXXXX" /></label>
        <div className="tpl-account__profilebtns">
          <button type="submit" className="tpl-btn">{t(lang, "Save changes", "পরিবর্তন সংরক্ষণ")}</button>
          {saved && <span className="tpl-account__saved">{t(lang, "Saved ✓", "সংরক্ষিত ✓")}</span>}
        </div>
        <button type="button" className="tpl-account__logout tpl-account__logout--inline" onClick={onLogout}><FiLogOut size={15} /> {t(lang, "Logout", "লগআউট")}</button>
      </form>
    </div>
  );
}

// ── Shared empty state ────────────────────────────────────────────────────
function EmptyState({ lang, icon, text, cta }: { lang: Lang; icon: React.ReactNode; text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="tpl-empty">
      <span className="tpl-empty__icon">{icon}</span>
      <p>{text}</p>
      {cta && <Link href={cta.href} className="tpl-btn">{cta.label}</Link>}
      {!cta && <span className="tpl-empty__hint">{t(lang, "", "")}</span>}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="tpl-page" style={{ textAlign: "center" }}>Loading…</div>}>
      <AccountContent />
    </Suspense>
  );
}
