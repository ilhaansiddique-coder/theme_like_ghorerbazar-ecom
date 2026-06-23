"use client";

/**
 * ShopKart Navbar — two-row organic-grocery header.
 *  • Row 1 (white): leaf logo + brand · wide rounded search · labelled action
 *    icons (Track Order / Sign In / Wishlist / Cart / More).
 *  • Row 2 (deep green): horizontally-scrollable category bar with carets.
 *  • Mobile: logo + search + cart + menu; full primary nav lives in the fixed
 *    bottom tab bar (Home / Shop / Cart / Profile). Bilingual (EN / বাংলা).
 * Search / cart / account are driven by onSearchOpen / onCartOpen / onAuthOpen.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiShoppingCart, FiShoppingBag, FiUser, FiHome, FiGrid, FiSearch,
  FiMapPin, FiHeart, FiMenu, FiChevronDown, FiChevronRight, FiGlobe,
  FiInfo, FiBookOpen, FiPhone, FiShield, FiFileText, FiRefreshCw,
  FiX, FiHelpCircle,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { FaLeaf } from "react-icons/fa";
import { LuAlignLeft } from "react-icons/lu";
import SearchBar from "./SearchBar";
import AuthModal from "./AuthModal";
import { useAuth } from "../components/auth";
import { useWishlist } from "../components/wishlist";
import { useCart } from "@/lib/CartContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import type { NavbarProps } from "@/storefront-engine/types/pages";
import { useLang, t } from "../components/lang";
import "../styles.css";

// Category bar — slugs link to /shop?category=. Items with a `sub` list show a
// caret and a hover dropdown of sub-categories (each links to a filtered shop).
type Sub = { en: string; bn: string; q: string };
type Cat = { slug: string; en: string; bn: string; sub?: Sub[] };
const sub = (q: string, en: string, bn: string): Sub => ({ q, en, bn });
const CATS: Cat[] = [
  { slug: "organic",        en: "Combos",            bn: "কম্বো" },
  { slug: "offers",         en: "Offer Zone",        bn: "অফার জোন" },
  { slug: "mango",          en: "Mango",             bn: "আম", sub: [
    sub("amrapali", "Amrapali", "আম্রপালি"), sub("himsagar", "Himsagar", "হিমসাগর"),
    sub("langra", "Langra", "লেংড়া"), sub("fazli", "Fazli", "ফজলি") ] },
  { slug: "honey",          en: "Honey",             bn: "মধু", sub: [
    sub("sundarban honey", "Sundarban Honey", "সুন্দরবন মধু"), sub("mustard honey", "Mustard Flower", "সরিষা ফুল"),
    sub("black seed honey", "Black Seed", "কালোজিরা"), sub("lychee honey", "Lychee Flower", "লিচু ফুল") ] },
  { slug: "mustard-oil",    en: "Oil & Ghee",        bn: "তেল ও ঘি", sub: [
    sub("mustard oil", "Mustard Oil", "সরিষার তেল"), sub("ghee", "Ghee", "ঘি"),
    sub("coconut oil", "Coconut Oil", "নারিকেল তেল") ] },
  { slug: "dates",          en: "Dates",             bn: "খেজুর", sub: [
    sub("ajwa", "Ajwa", "আজওয়া"), sub("medjool", "Medjool", "মেডজুল"),
    sub("safawi", "Safawi", "সাফাওয়ি"), sub("deglet", "Deglet", "ডেগলেট") ] },
  { slug: "spices",         en: "Spices",            bn: "মসলা", sub: [
    sub("turmeric", "Turmeric", "হলুদ"), sub("chilli", "Chilli", "মরিচ"),
    sub("coriander", "Coriander", "ধনিয়া"), sub("cumin", "Cumin", "জিরা") ] },
  { slug: "nuts-seeds",     en: "Nuts & Seeds",      bn: "বাদাম ও বীজ", sub: [
    sub("almond", "Almonds", "কাঠবাদাম"), sub("cashew", "Cashews", "কাজু"),
    sub("chia", "Chia Seeds", "চিয়া সিড"), sub("mixed nuts", "Mixed Nuts", "মিক্সড নাট") ] },
  { slug: "tea-coffee",     en: "Beverage",          bn: "বেভারেজ", sub: [
    sub("green tea", "Green Tea", "গ্রিন টি"), sub("black tea", "Black Tea", "ব্ল্যাক টি"),
    sub("coffee", "Coffee", "কফি") ] },
  { slug: "rice",           en: "Rice",              bn: "চাল" },
  { slug: "flours-lentils", en: "Flours & Lentils",  bn: "আটা ও ডাল", sub: [
    sub("rice flour", "Rice Flour", "চালের গুঁড়া"), sub("atta", "Atta", "আটা"),
    sub("lentils", "Lentils", "ডাল") ] },
  { slug: "certified",      en: "Certified",         bn: "সার্টিফায়েড" },
  { slug: "pickle",         en: "Pickle",            bn: "আচার" },
];

// "More" dropdown — secondary links that don't fit the category bar.
const MORE_LINKS: { href: string; en: string; bn: string; icon: IconType }[] = [
  { href: "/about",   en: "About Us", bn: "আমাদের কথা", icon: FiInfo },
  { href: "/blog",    en: "Blog",     bn: "ব্লগ",        icon: FiBookOpen },
  { href: "/contact", en: "Contact",  bn: "যোগাযোগ",     icon: FiPhone },
  { href: "/privacy", en: "Privacy",  bn: "প্রাইভেসি",    icon: FiShield },
  { href: "/terms",   en: "Terms",    bn: "শর্তাবলী",     icon: FiFileText },
  { href: "/refund",  en: "Refunds",  bn: "রিফান্ড",      icon: FiRefreshCw },
];

// Bottom tab bar — five primary tabs (mobile / tablet only):
// Home · Menu · Cart · Search · Account. `action` items open an overlay
// (cart drawer / search) instead of navigating; the rest are real links.
type Tab = {
  icon: IconType; label: string; bn: string;
  href?: string; action?: "cart" | "search"; cart?: boolean;
  match?: (p: string) => boolean;
};
const TABS: Tab[] = [
  { href: "/",         icon: FiHome,         label: "Home",    bn: "হোম",        match: (p) => p === "/" },
  { href: "/shop",     icon: FiGrid,         label: "Menu",    bn: "মেনু",        match: (p) => p.startsWith("/shop") },
  { action: "cart",    icon: FiShoppingCart, label: "Cart",    bn: "কার্ট",       cart: true },
  { action: "search",  icon: FiSearch,       label: "Search",  bn: "সার্চ",       match: (p) => p.startsWith("/search") },
  { href: "/account",  icon: FiUser,         label: "Account", bn: "অ্যাকাউন্ট",  match: (p) => p.startsWith("/account") },
];

export default function Navbar({ onSearchOpen, onCartOpen, onAuthOpen }: NavbarProps) {
  const { totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const wish = useWishlist();
  const settings = useSiteSettings();
  const brand = settings.site_name || "Brand";
  const currency = settings.currency_symbol || "৳";
  const pathname = usePathname() || "/";
  const { lang, setLang } = useLang();
  const [authOpen, setAuthOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Mobile category drawer (left off-canvas).
  const [menuOpen, setMenuOpen] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const closeMenu = () => { setMenuOpen(false); setOpenCat(null); };
  // Mobile top search overlay.
  const [searchOpen, setSearchOpen] = useState(false);
  // The theme owns the login + search UI, so these engine props are unused here.
  void onAuthOpen; void onSearchOpen;

  // Lock body scroll + Esc-to-close while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    if (menuOpen) window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  // Focus the search input when the top overlay opens; Esc closes it.
  useEffect(() => {
    if (!searchOpen) return;
    const el = document.querySelector(".tpl-searchov .tpl-search__input") as HTMLInputElement | null;
    el?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  return (
    <>
      <header className="tpl-nav">
        {/* Row 1 — logo · search · actions */}
        <div className="tpl-hdr__bar">
          {/* Mobile hamburger — opens the left category drawer */}
          <button type="button" className="tpl-hdr__burger" aria-label={t(lang, "Open menu", "মেনু খুলুন")} aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <LuAlignLeft size={24} />
          </button>

          <Link href="/" className="tpl-hdr__brand" aria-label={brand}>
            <span className="tpl-hdr__logo"><FaLeaf size={20} /></span>
            <span className="tpl-hdr__name">
              {(brand.match(/[A-Z][a-z0-9]*/g) || [brand]).map((part, i) => (
                <span key={i} className="tpl-hdr__nameline">{part}</span>
              ))}
            </span>
          </Link>

          <div className="tpl-hdr__searchwrap">
            <SearchBar />
          </div>

          <div className="tpl-hdr__actions">
            <Link href="/track-order" className="tpl-hdr__act tpl-hdr__act--lg">
              <FiMapPin size={20} />
              <small>{t(lang, "Track Order", "অর্ডার ট্র্যাক")}</small>
            </Link>
            {user ? (
              <Link href="/account" className="tpl-hdr__act tpl-hdr__act--lg" title={user.email}>
                <FiUser size={20} />
                <small>{user.name.split(" ")[0]}</small>
              </Link>
            ) : (
              <button type="button" className="tpl-hdr__act tpl-hdr__act--lg" onClick={() => setAuthOpen(true)}>
                <FiUser size={20} />
                <small>{t(lang, "Sign In", "সাইন ইন")}</small>
              </button>
            )}
            <Link href="/account?tab=wishlist" className="tpl-hdr__act tpl-hdr__act--lg">
              <span className="tpl-hdr__icon">
                <FiHeart size={20} />
                {wish.count > 0 && <span className="tpl-hdr__badge">{wish.count}</span>}
              </span>
              <small>{t(lang, "Wishlist", "উইশলিস্ট")}</small>
            </Link>
            <button type="button" className="tpl-hdr__act tpl-hdr__act--cart" onClick={onCartOpen}>
              <span className="tpl-hdr__icon">
                <FiShoppingCart size={20} />
                <span className="tpl-hdr__badge">{totalItems}</span>
              </span>
              <small>{t(lang, "Cart", "কার্ট")}</small>
            </button>

            <div className="tpl-hdr__morewrap">
              <button type="button" className="tpl-hdr__act" aria-expanded={moreOpen} onClick={() => setMoreOpen((o) => !o)}>
                <FiMenu size={20} />
                <small>{t(lang, "More", "আরও")}</small>
              </button>
              {moreOpen && (
                <>
                  <button type="button" className="tpl-hdr__scrim" aria-label="Close menu" onClick={() => setMoreOpen(false)} />
                  <div className="tpl-hdr__menu" role="menu">
                    <div className="tpl-hdr__menulabel"><FiGlobe size={13} /> {t(lang, "Language", "ভাষা")}</div>
                    <div className="tpl-hdr__lang" role="group" aria-label="Language">
                      <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
                      <button type="button" aria-pressed={lang === "bn"} onClick={() => setLang("bn")}>বাংলা</button>
                    </div>
                    <div className="tpl-hdr__menusep" />
                    {MORE_LINKS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <Link key={m.href} href={m.href} className="tpl-hdr__menuitem" role="menuitem" onClick={() => setMoreOpen(false)}>
                          <span className="tpl-hdr__menuicon"><Icon size={16} /></span>
                          {t(lang, m.en, m.bn)}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2 — category bar */}
        <nav className="tpl-catnav" aria-label="Categories">
          <div className="tpl-catnav__inner">
            {CATS.map((c) => {
              const active = pathname.startsWith("/shop") && pathname.includes(c.slug);
              return (
                <div key={c.slug} className="tpl-catnav__item">
                  <Link
                    href={`/shop?category=${c.slug}`}
                    className={`tpl-catnav__link${active ? " tpl-catnav__link--active" : ""}`}
                  >
                    {t(lang, c.en, c.bn)}
                    {c.sub && <FiChevronDown size={14} className="tpl-catnav__chev" />}
                  </Link>
                  {c.sub && (
                    <div className="tpl-catnav__drop" role="menu">
                      {c.sub.map((s) => (
                        <Link key={s.q} href={`/shop?search=${encodeURIComponent(s.q)}`} role="menuitem">
                          {t(lang, s.en, s.bn)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Fixed bottom tab bar — mobile / tablet only (Home · Menu · Cart · Search · Account) */}
      <nav className="tpl-bottomnav" aria-label="Primary">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const label = t(lang, tab.label, tab.bn);
          if (tab.action === "cart") {
            return (
              <button key="cart" type="button" onClick={onCartOpen} aria-label={`${label} (${totalItems})`}>
                <span className="tpl-bottomnav__ic">
                  <Icon size={20} />
                  <span className="tpl-bottomnav__badge">{totalItems}</span>
                </span>
                <span>{label}</span>
              </button>
            );
          }
          if (tab.action === "search") {
            return (
              <button key="search" type="button" onClick={() => setSearchOpen(true)} aria-label={label}>
                <Icon size={20} /><span>{label}</span>
              </button>
            );
          }
          return (
            <Link key={tab.href} href={tab.href!} className={tab.match?.(pathname) ? "tpl-bn--active" : ""}>
              <Icon size={20} /><span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right-edge sticky cart summary (desktop) */}
      <button type="button" className="tpl-stickycart" onClick={onCartOpen} aria-label={t(lang, "Open cart", "কার্ট খুলুন")}>
        <FiShoppingBag size={30} className="tpl-stickycart__icon" />
        <b className="tpl-stickycart__count">{totalItems} {t(lang, "Items", "আইটেম")}</b>
        <span className="tpl-stickycart__price">{currency}{totalPrice.toLocaleString()}</span>
      </button>

      {/* Chat launcher lives in the Footer (ReveChat) — single global instance. */}

      {/* ── Mobile category drawer (left off-canvas) ─────────────────────── */}
      <button
        type="button"
        className={`tpl-drawer__scrim${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
        tabIndex={-1}
        aria-label={t(lang, "Close menu", "মেনু বন্ধ করুন")}
        onClick={closeMenu}
      />
      <aside className={`tpl-drawer${menuOpen ? " is-open" : ""}`} aria-label={t(lang, "Menu", "মেনু")} aria-hidden={!menuOpen}>
        {/* Orange account header */}
        <div className="tpl-drawer__head">
          <span className="tpl-drawer__avatar"><FiUser size={24} /></span>
          {user ? (
            <Link href="/account" className="tpl-drawer__who" onClick={closeMenu}>
              <b>{t(lang, `Hello, ${user.name.split(" ")[0]}`, `স্বাগতম, ${user.name.split(" ")[0]}`)}</b>
              <span>{t(lang, "My Account", "আমার অ্যাকাউন্ট")}</span>
            </Link>
          ) : (
            <button type="button" className="tpl-drawer__who" onClick={() => { closeMenu(); setAuthOpen(true); }}>
              <b>{t(lang, "Hello there!", "স্বাগতম!")}</b>
              <span>{t(lang, "Sign In", "সাইন ইন")}</span>
            </button>
          )}
          <button type="button" className="tpl-drawer__close" aria-label={t(lang, "Close", "বন্ধ")} onClick={closeMenu}><FiX size={22} /></button>
        </div>

        {/* Category list (the desktop green bar, now in the drawer) */}
        <nav className="tpl-drawer__cats" aria-label={t(lang, "Categories", "ক্যাটাগরি")}>
          {CATS.map((c) =>
            c.sub ? (
              <div key={c.slug}>
                <button
                  type="button"
                  className={`tpl-drawer__cat${openCat === c.slug ? " is-open" : ""}`}
                  aria-expanded={openCat === c.slug}
                  onClick={() => setOpenCat((s) => (s === c.slug ? null : c.slug))}
                >
                  {t(lang, c.en, c.bn)}
                  <FiChevronRight size={18} />
                </button>
                {openCat === c.slug && (
                  <div className="tpl-drawer__sub">
                    <Link href={`/shop?category=${c.slug}`} onClick={closeMenu}>{t(lang, `All ${c.en}`, `সব ${c.bn}`)}</Link>
                    {c.sub.map((s) => (
                      <Link key={s.q} href={`/shop?search=${encodeURIComponent(s.q)}`} onClick={closeMenu}>{t(lang, s.en, s.bn)}</Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} className="tpl-drawer__cat" onClick={closeMenu}>
                {t(lang, c.en, c.bn)}
              </Link>
            ),
          )}
        </nav>

        {/* Quick links */}
        <div className="tpl-drawer__qlhead">{t(lang, "Quick Links", "কুইক লিংকস")}</div>
        <nav className="tpl-drawer__ql">
          <Link href="/about" onClick={closeMenu}><FiInfo size={18} /> {t(lang, "About Us", "আমাদের কথা")}</Link>
          <Link href="/account?tab=wishlist" onClick={closeMenu}><FiHeart size={18} /> {t(lang, "Wishlist", "উইশলিস্ট")}</Link>
          <Link href="/contact" onClick={closeMenu}><FiHelpCircle size={18} /> {t(lang, "FAQs", "প্রশ্নোত্তর")}</Link>
        </nav>

        {/* Language toggle */}
        <div className="tpl-drawer__lang" role="group" aria-label={t(lang, "Language", "ভাষা")}>
          <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
          <button type="button" aria-pressed={lang === "bn"} onClick={() => setLang("bn")}>বাংলা</button>
        </div>
      </aside>

      {/* ── Mobile top search overlay — slides down from the top ─────────── */}
      <button
        type="button"
        className={`tpl-searchov__scrim${searchOpen ? " is-open" : ""}`}
        aria-hidden={!searchOpen}
        tabIndex={-1}
        aria-label={t(lang, "Close search", "সার্চ বন্ধ করুন")}
        onClick={() => setSearchOpen(false)}
      />
      <div className={`tpl-searchov${searchOpen ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label={t(lang, "Search", "খুঁজুন")}>
        <div className="tpl-searchov__bar">
          <div className="tpl-searchov__field">
            <SearchBar onNavigate={() => setSearchOpen(false)} />
          </div>
          <button type="button" className="tpl-searchov__close" aria-label={t(lang, "Close", "বন্ধ")} onClick={() => setSearchOpen(false)}>
            <FiX size={22} />
          </button>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
