"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiSearch, FiChevronRight, FiSliders, FiX } from "react-icons/fi";
import type { Product } from "@/data/products";
import type { ShopPageProps } from "@/storefront-engine/types/pages";
import { Editable } from "@/storefront-engine/editor/Editable";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { trackViewItemList, trackSearch } from "@/lib/analytics";
import ProductCard from "../components/ProductCard";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import { BRANDS } from "../components/brands";
import { useLang, t } from "../components/lang";
import "../styles.css";

const SORT_OPTIONS: DropdownOption[] = [
  { value: "featured",   label: "Default Sorting" },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "newest",     label: "Newest" },
  { value: "popular",    label: "Popular" },
];

// Combos has no filter sidebar (curated bundles, not a filterable catalogue).
const NO_FILTER_CATS = new Set(["organic"]);

// Sub-categories (types) within a top-level category — products are matched by a
// keyword in their name. Lets a category page (e.g. Honey) filter by type.
const SUBCATS: Record<string, { en: string; bn: string; kw: string }[]> = {
  honey: [
    { en: "Sundarban Honey", bn: "সুন্দরবন মধু", kw: "sundarban" },
    { en: "Mustard Flower", bn: "সরিষা ফুল", kw: "mustard" },
    { en: "Black Seed", bn: "কালোজিরা", kw: "black seed" },
    { en: "Lychee Flower", bn: "লিচু ফুল", kw: "lychee" },
    { en: "Acacia / Wildflower", bn: "বুনো ফুল", kw: "acacia" },
  ],
  dates: [
    { en: "Ajwa", bn: "আজওয়া", kw: "ajwa" },
    { en: "Medjool", bn: "মেডজুল", kw: "medjool" },
    { en: "Safawi", bn: "সাফাওয়ি", kw: "safawi" },
    { en: "Deglet", bn: "ডেগলেট", kw: "deglet" },
  ],
  spices: [
    { en: "Turmeric", bn: "হলুদ", kw: "turmeric" },
    { en: "Chilli", bn: "মরিচ", kw: "chilli" },
    { en: "Coriander", bn: "ধনিয়া", kw: "coriander" },
    { en: "Flour / Atta", bn: "আটা", kw: "flour" },
  ],
  "nuts-seeds": [
    { en: "Mixed Nuts", bn: "মিক্সড নাট", kw: "mixed" },
    { en: "Chia Seeds", bn: "চিয়া সিড", kw: "chia" },
  ],
  mango: [
    { en: "Amrapali", bn: "আম্রপালি", kw: "amrapali" },
    { en: "Himsagar", bn: "হিমসাগর", kw: "himsagar" },
  ],
};

type WithSold = Product & { sold?: number; preorder?: boolean };
const soldOf = (p: Product) => (p as WithSold).sold || 0;

function ShopContent({ products, categories }: { products: Product[]; categories: ShopPageProps["apiCategories"] }) {
  const params = useSearchParams();
  const settings = useSiteSettings();
  const { lang } = useLang();
  const currency = settings.currency_symbol || "৳";
  const [sort, setSort] = useState("featured");
  // Mobile/tablet: filter sidebar opens as an off-canvas drawer.
  const [filterOpen, setFilterOpen] = useState(false);
  const rawSearch = params.get("search") || "";
  const search = rawSearch.toLowerCase();
  const activeCategory = params.get("category") || "";
  const showFilters = !NO_FILTER_CATS.has(activeCategory);

  // Lock page scroll while the mobile filter drawer is open.
  useEffect(() => {
    if (!filterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [filterOpen]);

  const categoryOptions = categories.length
    ? categories.map((c) => ({ id: c.slug || String(c.id), name: c.name }))
    : Array.from(new Set(products.map((p) => p.category).filter(Boolean))).map((name) => ({ id: name as string, name: name as string }));

  // Base list — category + search only (drives the filter ranges/options).
  const base = useMemo(() => products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (activeCategory && activeCategory !== p.category_slug && activeCategory !== p.category) return false;
    return true;
  }), [products, search, activeCategory]);

  // Price bounds from the base list.
  const [pmin, pmax] = useMemo(() => {
    if (!base.length) return [0, 0];
    const prices = base.map((p) => p.price);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [base]);

  // Brands present in the base list.
  const brandsInList = useMemo(
    () => BRANDS.filter((b) => base.some((p) => p.brand_slug === b.slug)),
    [base],
  );

  // "Best Selling" = sold at/above the median of the base list.
  const bestThreshold = useMemo(() => {
    if (!base.length) return Infinity;
    const sorted = [...base].map(soldOf).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }, [base]);

  // Category filter — sub-categories (types) when on a category page that has
  // them, otherwise the distinct top-level categories present in the base list.
  const subDefs = activeCategory ? (SUBCATS[activeCategory] || []) : [];
  const useSub = subDefs.length > 0;
  const catOptions = useMemo(() => {
    if (useSub) {
      return subDefs
        .filter((s) => base.some((p) => p.name.toLowerCase().includes(s.kw)))
        .map((s) => ({ key: s.kw, label: t(lang, s.en, s.bn) }));
    }
    const seen = new Map<string, string>();
    base.forEach((p) => {
      const key = (p.category_slug || p.category || "") as string;
      if (key && !seen.has(key)) seen.set(key, (p.category || key) as string);
    });
    return Array.from(seen, ([key, label]) => ({ key, label }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, useSub, lang]);

  // Filter state.
  const [lo, setLo] = useState(pmin);
  const [hi, setHi] = useState(pmax);
  const [catSel, setCatSel] = useState<Set<string>>(new Set());
  const [brandSel, setBrandSel] = useState<Set<string>>(new Set());
  const [flagSel, setFlagSel] = useState<Set<string>>(new Set());
  // Accordion — which filter sections are collapsed.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Reset filters when the category/search (i.e. the base list) changes.
  useEffect(() => {
    setLo(pmin); setHi(pmax); setCatSel(new Set()); setBrandSel(new Set()); setFlagSel(new Set());
  }, [pmin, pmax, activeCategory, rawSearch]);

  const toggle = (set: Set<string>, key: string): Set<string> => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  };

  const isBest = (p: Product) => soldOf(p) >= bestThreshold;
  const isNew = (p: Product) => !!(p as WithSold).preorder;

  const filtered = useMemo(() => {
    const list = base.filter((p) => {
      if (showFilters) {
        if (catSel.size) {
          const ok = useSub
            ? [...catSel].some((kw) => p.name.toLowerCase().includes(kw))
            : catSel.has((p.category_slug || p.category || "") as string);
          if (!ok) return false;
        }
        if (p.price < lo || p.price > hi) return false;
        if (brandSel.size && !(p.brand_slug && brandSel.has(p.brand_slug))) return false;
        if (flagSel.size) {
          const ok = (flagSel.has("best") && isBest(p)) || (flagSel.has("new") && isNew(p));
          if (!ok) return false;
        }
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "newest") return Number(b.id) - Number(a.id);
      if (sort === "popular") return soldOf(b) - soldOf(a);
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, showFilters, lo, hi, catSel, useSub, brandSel, flagSel, sort, bestThreshold]);

  const title = activeCategory ? categoryOptions.find((c) => c.id === activeCategory)?.name || "Products" : "All products";

  useEffect(() => {
    const q = rawSearch.trim();
    if (q) trackSearch({ search_string: q });
  }, [rawSearch]);

  useEffect(() => {
    if (!filtered.length) return;
    trackViewItemList({
      item_list_id: `tpl_shop_${activeCategory || "all"}`,
      item_list_name: title,
      items: filtered.slice(0, 20).map((p) => ({ id: p.id, name: p.name, category: p.category, price: p.price })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, filtered.length]);

  const money = (n: number) => `${currency}${n.toLocaleString()}`;

  const grid = filtered.length === 0 ? (
    <div className="tpl-empty">
      <span className="tpl-empty__icon"><FiSearch size={26} /></span>
      <p>{rawSearch ? `No products found for "${rawSearch}".` : t(lang, "No products match your filters.", "কোনো পণ্য মেলেনি।")}</p>
      <Link href="/shop" className="tpl-btn">{t(lang, "View all products", "সব পণ্য দেখুন")}</Link>
    </div>
  ) : (
    <div className="tpl-grid">
      {filtered.map((p, i) => <ProductCard product={p} key={p.id} priority={i < 4} />)}
    </div>
  );

  // Collapsible filter-section header (accordion) with a −/+ toggle.
  const head = (id: string, label: string) => (
    <button
      type="button"
      className="tpl-flt__head"
      aria-expanded={!collapsed.has(id)}
      onClick={() => setCollapsed((s) => toggle(s, id))}
    >
      <h3 className="tpl-flt__title">{label}</h3>
      <span className={`tpl-flt__toggle${collapsed.has(id) ? "" : " is-open"}`} aria-hidden />
    </button>
  );
  const open = (id: string) => !collapsed.has(id);

  const sortBar = (
    <div className="tpl-sortbar">
      <label className="tpl-sortbar__label">{t(lang, "Sort By", "সাজান")} :</label>
      <Dropdown value={sort} options={SORT_OPTIONS} onChange={setSort} ariaLabel="Sort products" />
      <span className="tpl-sortbar__count">{filtered.length} {t(lang, "products", "পণ্য")}</span>
    </div>
  );

  return (
    <div className="tpl-page">
      {/* Header — title + breadcrumb */}
      <div className="tpl-shophead">
        <Editable section="shop" field="title" defaultValue={title} label="Shop title">
          {(v, ep) => <h1 {...ep} className="tpl-shophead__title">{v}</h1>}
        </Editable>
        <nav className="tpl-crumb" aria-label="Breadcrumb">
          <Link href="/">{t(lang, "Home", "হোম")}</Link>
          <FiChevronRight size={13} />
          <span>{title}</span>
        </nav>
      </div>

      {showFilters ? (
        <div className="tpl-shoplayout">
          {/* Scrim behind the off-canvas drawer (mobile/tablet only) */}
          <div
            className={`tpl-filters__scrim${filterOpen ? " is-open" : ""}`}
            onClick={() => setFilterOpen(false)}
            aria-hidden
          />
          {/* Filter sidebar — static on desktop, off-canvas drawer on mobile/tablet */}
          <aside className={`tpl-filters${filterOpen ? " is-open" : ""}`}>
            {/* Drawer header (mobile/tablet only) */}
            <div className="tpl-filters__head">
              <span>{t(lang, "FILTERS", "ফিল্টার")}</span>
              <button
                type="button"
                className="tpl-filters__close"
                onClick={() => setFilterOpen(false)}
                aria-label={t(lang, "Close filters", "ফিল্টার বন্ধ করুন")}
              >
                <FiX size={20} />
              </button>
            </div>
            {/* Category / type */}
            {catOptions.length > 1 && (
              <section className="tpl-flt">
                {head("cat", t(lang, "FILTER BY CATEGORY", "ক্যাটাগরি অনুযায়ী"))}
                <div className={`tpl-flt__panel${open("cat") ? " is-open" : ""}`}>
                  <div className="tpl-flt__opts">
                    {catOptions.map((c) => (
                      <label key={c.key} className="tpl-flt__opt">
                        <input
                          type="checkbox"
                          checked={catSel.has(c.key)}
                          onChange={() => setCatSel((s) => toggle(s, c.key))}
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Price range */}
            <section className="tpl-flt">
              {head("price", t(lang, "PRICE RANGE", "মূল্য পরিসীমা"))}
              <div className={`tpl-flt__panel${open("price") ? " is-open" : ""}`}>
                <div className="tpl-flt__rangelabels">
                  <b>{money(lo)}</b><b>{money(hi)}</b>
                </div>
                <div
                  className="tpl-flt__range"
                  style={{
                    ["--lo" as string]: `${((lo - pmin) / Math.max(1, pmax - pmin)) * 100}%`,
                    ["--hi" as string]: `${((hi - pmin) / Math.max(1, pmax - pmin)) * 100}%`,
                  }}
                >
                  <span className="tpl-flt__track" aria-hidden />
                  <span className="tpl-flt__fill" aria-hidden />
                  <input
                    type="range" min={pmin} max={pmax} value={lo}
                    onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
                    aria-label="Minimum price"
                  />
                  <input
                    type="range" min={pmin} max={pmax} value={hi}
                    onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
                    aria-label="Maximum price"
                  />
                </div>
              </div>
            </section>

            {/* Brands */}
            {brandsInList.length > 0 && (
              <section className="tpl-flt">
                {head("brands", t(lang, "BRANDS", "ব্র্যান্ড"))}
                <div className={`tpl-flt__panel${open("brands") ? " is-open" : ""}`}>
                  <div className="tpl-flt__opts">
                    {brandsInList.map((b) => (
                      <label key={b.slug} className="tpl-flt__opt">
                        <input
                          type="checkbox"
                          checked={brandSel.has(b.slug)}
                          onChange={() => setBrandSel((s) => toggle(s, b.slug))}
                        />
                        <span>{b.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Product flag */}
            <section className="tpl-flt">
              {head("flag", t(lang, "PRODUCT FLAG", "প্রোডাক্ট ফ্ল্যাগ"))}
              <div className={`tpl-flt__panel${open("flag") ? " is-open" : ""}`}>
                <div className="tpl-flt__opts">
                  <label className="tpl-flt__opt">
                    <input type="checkbox" checked={flagSel.has("best")} onChange={() => setFlagSel((s) => toggle(s, "best"))} />
                    <span>{t(lang, "Best Selling", "বেস্ট সেলিং")}</span>
                  </label>
                  <label className="tpl-flt__opt">
                    <input type="checkbox" checked={flagSel.has("new")} onChange={() => setFlagSel((s) => toggle(s, "new"))} />
                    <span>{t(lang, "New Arrival", "নতুন এসেছে")}</span>
                  </label>
                </div>
              </div>
            </section>
          </aside>

          {/* Main — toolbar (filter button + sort) + grid */}
          <div className="tpl-shopmain">
            <div className="tpl-shoptoolbar">
              <button type="button" className="tpl-filterbtn" onClick={() => setFilterOpen(true)}>
                <FiSliders size={16} /> {t(lang, "FILTERS", "ফিল্টার")}
              </button>
              {sortBar}
            </div>
            {grid}
          </div>
        </div>
      ) : (
        <>
          {sortBar}
          {grid}
        </>
      )}
    </div>
  );
}

export default function ShopPage(props: ShopPageProps) {
  return (
    <Suspense fallback={<div className="tpl-page" style={{ textAlign: "center" }}>Loading…</div>}>
      <ShopContent products={props.initialProducts} categories={props.apiCategories} />
    </Suspense>
  );
}
