"use client";

/**
 * ShopKart HomePage — organic-grocery storefront, mobile-first and
 * built to mirror the Ghorer-Bazar reference layout on phones AND tablets:
 *   1. Banner — hero carousel + side promo.
 *   2. Featured Categories — circular category rail.
 *   3. Top Selling Products — best-sellers (sorted by `sold`).
 *   4. Our Brands — editable brand strip.
 *   5. Category sections — Mango / Honey / Dates / Cooking / Organic, each
 *      derived dynamically from the catalogue (rendered only when products
 *      exist for that category) with a "VIEW ALL" deep-link.
 *   6. Exclusive Combo Deals + a wide promo banner (editable).
 *   7. Just For You — full feed with client-side LOAD MORE pagination.
 *   8. Customer testimonial (editable).
 *
 * Everything visible is Editable; category sections + grids come straight from
 * the engine's `products`, so the page is fully dynamic per tenant.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiArrowRight, FiStar } from "react-icons/fi";
import type { HomePageProps } from "@/storefront-engine/types/pages";
import type { Product } from "@/data/products";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { Editable } from "@/storefront-engine/editor/Editable";
import { trackViewItemList } from "@/lib/analytics";
import ProductCard from "../components/ProductCard";
import Carousel from "../components/Carousel";
import { BrandLogo } from "../components/BrandLogo";
import { BRANDS } from "../components/brands";
import { discountPercent, formatMoney } from "../components/helpers";
import { useLang, t, type Lang } from "../components/lang";
import "../styles.css";

// Left carousel slides — finished promotional artwork (text baked into the
// image), so the hero shows the banner only, no text overlay. Image is Editable.
const SLIDES = [
  { key: "1", href: "/shop?category=honey",  img: "/hero-honey.jpg",  en: "Pure honey, dates & nuts" },
  { key: "2", href: "/shop?category=spices", img: "/hero-masala.jpg", en: "Premium spice & masala collection" },
  { key: "3", href: "/shop",                 img: "/hero-spices.jpg", en: "Best taste, cooked with ease" },
];

// Featured categories — clean product-cutout icons (local, open ingredient
// images on white). `icon` is preferred; `emoji` is the fallback (e.g. Pickle).
const CATEGORIES = [
  { emoji: "🛢️", icon: "/categories/oilandghee.png",     slug: "mustard-oil",    en: "Oil & Ghee",       bn: "তেল ও ঘি" },
  { emoji: "🌿", icon: "/categories/organic.png",        slug: "organic",         en: "Organic",          bn: "অর্গানিক" },
  { emoji: "🍯", icon: "/categories/honey.png",          slug: "honey",           en: "Honey",            bn: "মধু" },
  { emoji: "🌴", icon: "/categories/dates.png",          slug: "dates",           en: "Dates",            bn: "খেজুর" },
  { emoji: "🌶️", icon: "/categories/spices.png",         slug: "spices",          en: "Spices",           bn: "মসলা" },
  { emoji: "🥜", icon: "/categories/nutsandseeds.png",   slug: "nuts-seeds",      en: "Nuts & Seeds",     bn: "বাদাম ও বীজ" },
  { emoji: "☕", icon: "/categories/beverage.png",       slug: "tea-coffee",      en: "Beverage",         bn: "বেভারেজ" },
  { emoji: "🍚", icon: "/categories/rice.png",           slug: "rice",            en: "Rice",             bn: "চাল" },
  { emoji: "🌾", icon: "/categories/flowersandlentils.png", slug: "flours-lentils", en: "Flours & Lentils", bn: "আটা ও ডাল" },
  { emoji: "🥒", icon: "",                                slug: "pickle",          en: "Pickle",           bn: "আচার" },
  { emoji: "🥭", icon: "/categories/mango.png",          slug: "mango",           en: "Mango",            bn: "আম" },
];

// Dynamic category sections (rendered only if the catalogue has matching items).
const FEATURED = [
  { slug: "mango",  en: "Mango",            bn: "আম" },
  { slug: "honey",  en: "All Natural Honey", bn: "অল ন্যাচারাল মধু" },
  { slug: "dates",  en: "Premium Dates",    bn: "প্রিমিয়াম খেজুর" },
  { slug: "spices", en: "Cooking Essentials", bn: "রান্নার প্রয়োজনীয়" },
  { slug: "organic", en: "Organic Certified", bn: "অর্গানিক সার্টিফায়েড" },
];

// Customer testimonials (original copy — editable per tenant later).
const TESTIMONIALS = [
  { name: "Ayesha Khan",   roleEn: "Home cook",        roleBn: "গৃহিণী", en: "The honey and ghee are genuinely top quality — pure taste, fast delivery. I order every month now.", bn: "মধু আর ঘি সত্যিই দারুণ মানের — খাঁটি স্বাদ, দ্রুত ডেলিভারি। এখন প্রতি মাসেই অর্ডার করি।" },
  { name: "Tanvir Ahmed",  roleEn: "Verified buyer",   roleBn: "যাচাইকৃত ক্রেতা", en: "Cold-pressed mustard oil exactly like home. Packaging was neat and it arrived on time.", bn: "ঘানি ভাঙা সরিষার তেল একদম ঘরের মতো। প্যাকেজিং পরিপাটি, সময়মতো পৌঁছেছে।" },
  { name: "Farhana Rahman", roleEn: "Regular customer", roleBn: "নিয়মিত গ্রাহক", en: "Dates and nuts are always fresh. Trustworthy organic shop — highly recommended.", bn: "খেজুর আর বাদাম সবসময় তাজা। বিশ্বস্ত অর্গানিক শপ — অবশ্যই রিকমেন্ড করি।" },
];

// Match a product to a category slug (slug field first, then a name fallback).
function inCategory(p: Product, slug: string): boolean {
  if (p.category_slug) return p.category_slug === slug;
  const name = (p.category || "").toLowerCase();
  return name.includes(slug.replace(/-/g, " "));
}

/** Section header: title (Editable) + a "VIEW ALL" deep-link. */
function SectionHead({ field, title, href, lang }: { field: string; title: string; href: string; lang: Lang }) {
  return (
    <div className="tpl-sechead">
      <Editable section="home" field={field} defaultValue={title} label={`${field} title`}>
        {(v, ep) => <h2 {...ep} className="tpl-sectitle">{v}</h2>}
      </Editable>
      <Link href={href} className="tpl-viewall">{t(lang, "VIEW ALL", "সব দেখুন")} <FiArrowRight size={13} /></Link>
    </div>
  );
}

export default function HomePage({ products }: HomePageProps) {
  const { lang } = useLang();
  const settings = useSiteSettings();
  const currency = settings.currency_symbol || "৳";
  const feed = products;

  const [slide, setSlide] = useState(0);
  const [shown, setShown] = useState(8); // "Just For You" pagination
  const railRef = useRef<HTMLDivElement>(null);

  // Best-sellers first (by `sold`), then everything for the tail feed.
  const topSelling = useMemo(
    () => [...feed].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 4),
    [feed],
  );
  const sections = useMemo(
    () => FEATURED.map((f) => ({ ...f, items: feed.filter((p) => inCategory(p, f.slug)).slice(0, 5) }))
                  .filter((s) => s.items.length > 0),
    [feed],
  );
  const comboItems = useMemo(() => feed.slice(0, 5), [feed]);

  // Auto-advance the carousel.
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!feed.length) return;
    trackViewItemList({
      item_list_id: "tpl_home_feed",
      item_list_name: "Top selling products",
      items: feed.slice(0, 20).map((p) => ({ id: p.id, name: p.name, category: p.category, price: p.price })),
    });
  }, [feed]);

  const scrollRail = (dir: 1 | -1) => railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  const goSlide = (dir: 1 | -1) => setSlide((s) => (s + dir + SLIDES.length) % SLIDES.length);
  const sideImg = useMemo(() => "/side-promo.jpg", []);

  return (
    <div className="tpl-home">
      {/* ── Banner section ───────────────────────────────────────── */}
      <section className="tpl-banner">
        <div className="tpl-banner__main">
          {SLIDES.map((s, i) => (
            <div key={s.key} className={`tpl-banner__slide${i === slide ? " is-on" : ""}`} aria-hidden={i !== slide}>
              <Link href={s.href} className="tpl-banner__link" tabIndex={i === slide ? 0 : -1}>
                <div className="tpl-banner__imgwrap">
                  <Editable section="home" field={`banner${s.key}Img`} type="image" defaultValue={s.img} label={`Banner ${s.key} image`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {(src, ep) => <img {...ep} src={src} alt={s.en} />}
                  </Editable>
                </div>
              </Link>
            </div>
          ))}
          <div className="tpl-banner__dots">
            {SLIDES.map((s, i) => (
              <button key={s.key} type="button" className={i === slide ? "is-on" : ""} aria-label={`Slide ${i + 1}`} onClick={() => setSlide(i)} />
            ))}
          </div>
          <button type="button" className="tpl-banner__nav tpl-banner__nav--prev" aria-label="Previous slide" onClick={() => goSlide(-1)}><FiChevronLeft size={22} /></button>
          <button type="button" className="tpl-banner__nav tpl-banner__nav--next" aria-label="Next slide" onClick={() => goSlide(1)}><FiChevronRight size={22} /></button>
        </div>

        <Link href="/shop?category=organic" className="tpl-banner__side">
          <div className="tpl-banner__imgwrap">
            <Editable section="home" field="sideBannerImg" type="image" defaultValue={sideImg} label="Side banner image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {(src, ep) => <img {...ep} src={src} alt="" />}
            </Editable>
          </div>
          <div className="tpl-banner__overlay tpl-banner__overlay--side">
            <Editable section="home" field="sideBannerTitle" defaultValue={t(lang, "Premium Honey & Dates", "প্রিমিয়াম মধু ও খেজুর")} label="Side banner title">
              {(v, ep) => <h2 {...ep}>{v}</h2>}
            </Editable>
            <span className="tpl-banner__pill">{t(lang, "Shop now", "এখনই কিনুন")}</span>
          </div>
        </Link>
      </section>

      {/* ── Featured Categories ──────────────────────────────────── */}
      <section className="tpl-fcat">
        <Editable section="home" field="featuredTitle" defaultValue={t(lang, "Featured Categories", "ফিচার্ড ক্যাটাগরি")} label="Featured categories title">
          {(v, ep) => <h2 {...ep} className="tpl-sectitle tpl-sectitle--center">{v}</h2>}
        </Editable>
        <div className="tpl-fcat__row">
          <button type="button" className="tpl-fcat__arrow tpl-fcat__arrow--prev" aria-label={t(lang, "Previous", "আগের")} onClick={() => scrollRail(-1)}><FiChevronLeft size={20} /></button>
          <div className="tpl-fcat__rail" ref={railRef}>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} className="tpl-fcat__card">
                <span className="tpl-fcat__emoji" aria-hidden="true">
                  {c.icon
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={c.icon} alt="" loading="lazy" />
                    : c.emoji}
                </span>
                <span className="tpl-fcat__label">{t(lang, c.en, c.bn)}</span>
              </Link>
            ))}
          </div>
          <button type="button" className="tpl-fcat__arrow tpl-fcat__arrow--next" aria-label={t(lang, "Next", "পরের")} onClick={() => scrollRail(1)}><FiChevronRight size={20} /></button>
        </div>
      </section>

      {/* ── Top Selling Products ─────────────────────────────────── */}
      <section className="tpl-sec">
        <Editable section="home" field="topSellingTitle" defaultValue={t(lang, "Top Selling Products", "টপ সেলিং পণ্য")} label="Top selling title">
          {(v, ep) => <h2 {...ep} className="tpl-sectitle tpl-sectitle--center tpl-sectitle--topselling">{v}</h2>}
        </Editable>
        <div className="tpl-toprow">
          {topSelling.map((p, i) => <ProductCard product={p} key={p.id} priority={i < 4} bestseller={i < 2} layout="row" />)}
        </div>
      </section>

      {/* ── Our Brands ───────────────────────────────────────────── */}
      <section className="tpl-sec">
        <SectionHead field="brandsTitle" title={t(lang, "Our Brands", "আমাদের ব্র্যান্ড")} href="/brands" lang={lang} />
        <Carousel className="tpl-rail--brands">
          {BRANDS.map((m) => <BrandLogo key={m.slug} m={m} />)}
        </Carousel>
      </section>

      {/* ── Dynamic category sections (Mango / Honey / Dates / …) ──── */}
      {sections.map((s) => (
        <section className="tpl-sec" key={s.slug}>
          <SectionHead field={`sec_${s.slug}`} title={t(lang, s.en, s.bn)} href={`/shop?category=${s.slug}`} lang={lang} />
          <Carousel className="tpl-rail--cards">
            {s.items.map((p) => <ProductCard product={p} key={p.id} priority={false} />)}
          </Carousel>
        </section>
      ))}

      {/* ── Exclusive Combo Deals (tinted section + View-Details cards) ── */}
      {comboItems.length > 0 && (
        <section className="tpl-combo">
          <div className="tpl-combo__inner">
            <div className="tpl-sechead">
              <Editable section="home" field="comboTitle" defaultValue={t(lang, "Exclusive Combo Deals", "এক্সক্লুসিভ কম্বো ডিল")} label="Combo title">
                {(v, ep) => <h2 {...ep} className="tpl-sectitle"><span className="tpl-combo__ic">🎁</span> {v}</h2>}
              </Editable>
              <Link href="/shop?category=offers" className="tpl-pillbtn">{t(lang, "View All Combos", "সব কম্বো")}</Link>
            </div>
            <Carousel className="tpl-rail--cards">
              {comboItems.map((p) => {
                const slug = p.slug || String(p.id);
                const off = discountPercent(p.price, p.originalPrice);
                return (
                  <div className="tpl-combocard" key={p.id}>
                    <Link href={`/products/${slug}`} className="tpl-combocard__media">
                      <span className="tpl-combocard__ribbon">{t(lang, "Combo Offer", "কম্বো অফার")}</span>
                      {off != null && <span className="tpl-card__save">{t(lang, `Save ${off}%`, `${off}% ছাড়`)}</span>}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image || "/placeholder.svg"} alt={p.name} loading="lazy" />
                    </Link>
                    <div className="tpl-combocard__body">
                      <Link href={`/products/${slug}`} className="tpl-combocard__name">{p.name}</Link>
                      <div className="tpl-card__priceRow">
                        <span className="tpl-card__price">{formatMoney(p.price, currency)}</span>
                        {p.originalPrice && p.originalPrice > p.price && <s>{formatMoney(p.originalPrice, currency)}</s>}
                      </div>
                      <Link href={`/products/${slug}`} className="tpl-combocard__btn">{t(lang, "View Details", "বিস্তারিত দেখুন")}</Link>
                    </div>
                  </div>
                );
              })}
            </Carousel>
          </div>
        </section>
      )}

      {/* ── Wide promo banner (finished artwork — no text overlay) ──── */}
      <Link href="/shop" className="tpl-promo tpl-promo--wide">
        <Editable section="home" field="wideBannerImg" type="image" defaultValue="/combo-banner.jpg" label="Wide promo image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {(src, ep) => <img {...ep} src={src} alt="" />}
        </Editable>
      </Link>

      {/* ── Just For You — full feed + LOAD MORE ─────────────────── */}
      <section className="tpl-sec">
        <Editable section="home" field="justForYouTitle" defaultValue={t(lang, "Just For You", "শুধু আপনার জন্য")} label="Just for you title">
          {(v, ep) => <h2 {...ep} className="tpl-sectitle tpl-sectitle--center">{v}</h2>}
        </Editable>
        <div className="tpl-feed">
          {feed.slice(0, shown).map((p) => <ProductCard product={p} key={p.id} priority={false} />)}
        </div>
        {shown < feed.length && (
          <div className="tpl-loadmore">
            <button type="button" className="tpl-btn tpl-btn--ghost" onClick={() => setShown((n) => n + 8)}>
              {t(lang, "LOAD MORE", "আরও দেখুন")}
            </button>
          </div>
        )}
      </section>

      {/* ── Testimonials (3-up with dots) ────────────────────────── */}
      <section className="tpl-sec">
        <Editable section="home" field="testiHeading" defaultValue={t(lang, "What Our Customers Say", "গ্রাহকরা যা বলেন")} label="Testimonials heading">
          {(v, ep) => <h2 {...ep} className="tpl-sectitle tpl-sectitle--center">{v}</h2>}
        </Editable>
        <Carousel className="tpl-rail--testi">
          {TESTIMONIALS.map((r, i) => (
            <div className="tpl-testi" key={i}>
              <span className="tpl-testi__stars" aria-hidden>
                {[0, 1, 2, 3, 4].map((s) => <FiStar key={s} size={15} fill="currentColor" />)}
              </span>
              <p className="tpl-testi__text">{t(lang, r.en, r.bn)}</p>
              <div className="tpl-testi__who">
                <span className="tpl-testi__avatar">{r.name.charAt(0)}</span>
                <span>
                  <b className="tpl-testi__name">{r.name}</b>
                  <small className="tpl-testi__role">{t(lang, r.roleEn, r.roleBn)}</small>
                </span>
              </div>
            </div>
          ))}
        </Carousel>
      </section>
    </div>
  );
}
