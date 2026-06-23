"use client";

/**
 * Brand pages — modelled on ghorerbazar.com/all-brands and /brand/<slug>:
 *   • BrandsPage (default)  — "Popular Brands" heading + a grid of brand logo
 *     cards, each linking to its detail page.
 *   • BrandPage             — a brand header (logo + name + blurb) followed by
 *     "Brand Products": that brand's products in the standard grid.
 *
 * Not standard engine slots (like LivePage / TrackOrderPage), so these are
 * wired to /brands and /brand/<slug> routes. Products are associated to a brand
 * via an optional `brand_slug` / `brand` field, so the detail page is dynamic.
 */

import Link from "next/link";
import { FiArrowRight, FiChevronRight } from "react-icons/fi";
import type { Product } from "@/data/products";
import { Editable } from "@/storefront-engine/editor/Editable";
import ProductCard from "../components/ProductCard";
import { BRANDS, findBrand, type Brand } from "../components/brands";
import { Emblem } from "../components/BrandLogo";
import { useLang, t } from "../components/lang";
import "../styles.css";

function brandOf(p: Product): string | undefined {
  const x = p as Product & { brand_slug?: string; brand?: string };
  return x.brand_slug || x.brand;
}

/** Product belongs to a brand if its brand field matches the slug or name. */
function inBrand(p: Product, brand: Brand): boolean {
  const b = (brandOf(p) || "").toLowerCase();
  return b === brand.slug.toLowerCase() || b === brand.name.toLowerCase();
}

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link href={`/brand/${brand.slug}`} className="tpl-brandcard" aria-label={brand.name}>
      <span className="tpl-brandcard__logo">
        <Emblem k={brand.key} color={brand.color} size={52} />
      </span>
      <span className="tpl-brandcard__name">{brand.a}<b style={{ color: brand.color }}>{brand.b}</b></span>
    </Link>
  );
}

/* ── All Brands ──────────────────────────────────────────────────── */
export default function BrandsPage({ brands = BRANDS }: { brands?: Brand[] }) {
  const { lang } = useLang();
  return (
    <div className="tpl-home">
      <nav className="tpl-crumb" aria-label="Breadcrumb">
        <Link href="/">{t(lang, "Home", "হোম")}</Link>
        <FiChevronRight size={13} />
        <span>{t(lang, "Brands", "ব্র্যান্ড")}</span>
      </nav>

      <section className="tpl-sec">
        <Editable section="brands" field="title" defaultValue={t(lang, "Popular Brands", "জনপ্রিয় ব্র্যান্ড")} label="Brands page title">
          {(v, ep) => <h1 {...ep} className="tpl-sectitle tpl-sectitle--center">{v}</h1>}
        </Editable>
        <div className="tpl-brandgrid">
          {brands.map((b) => <BrandCard brand={b} key={b.slug} />)}
        </div>
      </section>
    </div>
  );
}

/* ── Single Brand ────────────────────────────────────────────────── */
export function BrandPage({ slug, products }: { slug: string; products: Product[] }) {
  const { lang } = useLang();
  const brand = findBrand(slug);
  const items = brand ? products.filter((p) => inBrand(p, brand)) : [];

  if (!brand) {
    return (
      <div className="tpl-home">
        <section className="tpl-sec" style={{ textAlign: "center", padding: "60px 16px" }}>
          <h1 className="tpl-sectitle">{t(lang, "Brand not found", "ব্র্যান্ড পাওয়া যায়নি")}</h1>
          <p style={{ color: "var(--tpl-muted)", margin: "8px 0 20px" }}>
            {t(lang, "We couldn't find that brand.", "আমরা সেই ব্র্যান্ডটি খুঁজে পাইনি।")}
          </p>
          <Link href="/brands" className="tpl-btn">{t(lang, "All Brands", "সব ব্র্যান্ড")}</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="tpl-home">
      <nav className="tpl-crumb" aria-label="Breadcrumb">
        <Link href="/">{t(lang, "Home", "হোম")}</Link>
        <FiChevronRight size={13} />
        <Link href="/brands">{t(lang, "Brands", "ব্র্যান্ড")}</Link>
        <FiChevronRight size={13} />
        <span>{brand.name}</span>
      </nav>

      {/* Brand header */}
      <section className="tpl-sec">
        <div className="tpl-brandhead">
          <span className="tpl-brandhead__logo">
            <Emblem k={brand.key} color={brand.color} size={56} />
          </span>
          <div className="tpl-brandhead__info">
            <h1 className="tpl-brandhead__name">{brand.name}</h1>
            {brand.blurb && <p className="tpl-brandhead__blurb">{brand.blurb}</p>}
            <span className="tpl-brandhead__count">{items.length} {t(lang, "products", "পণ্য")}</span>
          </div>
        </div>
      </section>

      {/* Brand products */}
      <section className="tpl-sec">
        <div className="tpl-sechead">
          <h2 className="tpl-sectitle">{t(lang, "Brand Products", "ব্র্যান্ড পণ্য")}</h2>
          <Link href="/shop" className="tpl-viewall">{t(lang, "VIEW ALL", "সব দেখুন")} <FiArrowRight size={13} /></Link>
        </div>
        {items.length ? (
          <div className="tpl-feed">
            {items.map((p, i) => <ProductCard product={p} key={p.id} priority={i < 4} />)}
          </div>
        ) : (
          <div className="tpl-brandempty">
            <p>{t(lang, "No products from this brand yet — check back soon.", "এই ব্র্যান্ডের কোনো পণ্য এখনো নেই — শীঘ্রই দেখুন।")}</p>
            <Link href="/shop" className="tpl-btn">{t(lang, "Browse all products", "সব পণ্য দেখুন")}</Link>
          </div>
        )}
      </section>
    </div>
  );
}
