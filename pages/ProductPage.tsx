"use client";

/**
 * Single product page — modelled on the ghorerbazar.com product layout:
 *   1. Product card — thumbnail rail + main image (with prev/next) on the left;
 *      title, price (now / was / Save%), quantity stepper, a 2×2 action grid
 *      (Add To Cart / Buy Now / Order On WhatsApp / Call For Order) and a brand
 *      chip on the right.
 *   2. Tabs — Description | Customer Reviews (n).
 *   3. Reviews — average-rating summary + star bars on the left, a "Submit Your
 *      Review" form on the right (UI only; backend wired later).
 *   4. Related Products — a row of the standard product cards.
 *
 * Product imagery comes from the catalogue; the brand mark is our own original
 * emblem (see brands.ts / BrandLogo.tsx) — no third-party trademarks embedded.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FiMinus, FiPlus, FiChevronLeft, FiChevronRight,
  FiShoppingCart, FiPhone, FiStar, FiZoomIn,
} from "react-icons/fi";
import { FaWhatsapp, FaHeart, FaRegHeart } from "react-icons/fa";
import type { ProductPageProps } from "@/storefront-engine/types/pages";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/CartContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { trackAddToCart, trackInitiateCheckout, trackViewContent } from "@/lib/analytics";
import { Editable } from "@/storefront-engine/editor/Editable";
import { formatMoney, productImages, discountPercent } from "../components/helpers";
import { findBrand } from "../components/brands";
import { Emblem } from "../components/BrandLogo";
import ProductCard from "../components/ProductCard";
import Lightbox from "../components/Lightbox";
import { useWishlist } from "../components/wishlist";
import { useReviews, addReview } from "../components/reviews";
import { useAuth } from "../components/auth";
import { useLang, t } from "../components/lang";
import "../styles.css";

type Props = ProductPageProps & { related?: Product[] };

export default function ProductPage({ product, related = [] }: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const settings = useSiteSettings();
  const { lang } = useLang();
  const wish = useWishlist();
  const { user } = useAuth();
  const { list: reviews, count: reviewCount, average, dist, recommended } = useReviews(product.id);
  const currency = settings.currency_symbol || "৳";
  const variants = useMemo(() => product.hasVariations ? product.variants ?? [] : [], [product]);
  const [variantId, setVariantId] = useState<number | undefined>(variants[0]?.id);
  const selectedVariant = variants.find((v) => v.id === variantId);
  const images = productImages(product);
  const [imgIndex, setImgIndex] = useState(0);
  const [lbOpen, setLbOpen] = useState(false);
  const mainImage = selectedVariant?.image || images[imgIndex] || images[0] || "/placeholder.svg";
  const [quantity, setQuantity] = useState(1);
  const price = selectedVariant?.price ?? product.price;
  const originalPrice = selectedVariant?.original_price ?? product.originalPrice;
  const disc = discountPercent(price, originalPrice);
  const activeImage = selectedVariant?.image || product.image || "/placeholder.svg";
  const brand = product.brand_slug ? findBrand(product.brand_slug) : undefined;

  // Tabs scroll to their section (description, then reviews below it).
  const [tab, setTab] = useState<"desc" | "reviews">("desc");
  const descRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  function goTab(which: "desc" | "reviews") {
    setTab(which);
    const el = which === "desc" ? descRef.current : reviewsRef.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  // Review form (UI only — backend later, like the chat widget).
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState("");
  const [reviewSent, setReviewSent] = useState(false);

  // Render the description: blank-line-separated paragraphs, plus a
  // "Nutritional Benefits:" block whose lines become a benefits list.
  function renderDescription() {
    const blocks = (product.description || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    if (!blocks.length) return <p><i>{t(lang, "No description available.", "কোনো বিবরণ নেই।")}</i></p>;
    return blocks.map((block, i) => {
      if (block.includes("\n")) {
        const [head, ...lines] = block.split("\n");
        return (
          <div className="tpl-pdp__benefits" key={i}>
            <p className="tpl-pdp__benefitshead">{head}</p>
            <ul>{lines.map((l, j) => <li key={j}>{l}</li>)}</ul>
          </div>
        );
      }
      return <p key={i}>{block}</p>;
    });
  }

  // WhatsApp "order" deep-link + Call-for-order, from the tenant phone.
  const rawPhone = settings.phone || "";
  const waPhone = rawPhone.replace(/\D/g, "");
  const waText = encodeURIComponent(
    t(
      lang,
      `Hi! I'd like to order: ${product.name}${selectedVariant ? ` (${selectedVariant.label})` : ""} — ${formatMoney(price, currency)}`,
      `আসসালামু আলাইকুম! আমি অর্ডার করতে চাই: ${product.name}${selectedVariant ? ` (${selectedVariant.label})` : ""} — ${formatMoney(price, currency)}`,
    ),
  );

  useEffect(() => {
    trackViewContent({ content_ids: [product.id], content_name: product.name, value: price });
  }, [price, product.id, product.name]);

  // Reset gallery when the product changes.
  useEffect(() => { setImgIndex(0); setTab("desc"); }, [product.id]);

  // BUY NOW attention shake — replays every 3.5s, reduced-motion safe.
  const buyRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      el.classList.remove("tpl-shake");
      void el.offsetWidth; // force reflow so the animation restarts
      el.classList.add("tpl-shake");
    }, 3500);
    return () => clearInterval(id);
  }, []);

  function addToBag() {
    addItem({
      id: product.id,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label,
      name: product.name,
      price,
      image: activeImage,
      stock: selectedVariant ? selectedVariant.stock : product.stock,
      unlimitedStock: selectedVariant ? selectedVariant.unlimited_stock : product.unlimitedStock,
    }, quantity);
    trackAddToCart({ content_ids: [product.id], content_name: product.name, value: price * quantity, quantity });
  }

  function buyNow() {
    addToBag();
    trackInitiateCheckout({ value: price * quantity, content_ids: [product.id], num_items: quantity });
    router.push("/checkout");
  }

  const step = (img: string) => images.indexOf(img);
  const goImg = (dir: 1 | -1) => {
    if (!images.length) return;
    setImgIndex((i) => (i + dir + images.length) % images.length);
  };

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const rating = Number(reviewRating);
    if (!rating || !reviewText.trim()) return;
    addReview(product.id, { rating, text: reviewText.trim(), author: user?.name || t(lang, "Guest", "অতিথি") });
    setReviewText("");
    setReviewRating("");
    setReviewSent(true);
  }

  // Star-bar rows for the ratings summary (5★ → 1★).
  const bars = [5, 4, 3, 2, 1];
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="tpl-page">
      {/* Breadcrumb */}
      <nav className="tpl-crumb" aria-label="Breadcrumb">
        <Link href="/">{t(lang, "Home", "হোম")}</Link>
        <FiChevronRight size={13} />
        <Link href="/shop">{t(lang, "Products", "পণ্য")}</Link>
      </nav>

      {/* ── 1. Product card ───────────────────────────────────────────── */}
      <div className="tpl-pdpcard">
        <div className="tpl-pdp">
          {/* Gallery */}
          <div className={`tpl-pdp__gallery${images.length > 1 ? "" : " tpl-pdp__gallery--single"}`}>
            {images.length > 1 && (
              <div className="tpl-pdp__thumbs">
                {images.slice(0, 5).map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setImgIndex(step(img))}
                    className={`tpl-pdp__thumb${mainImage === img ? " is-active" : ""}`}
                    aria-label="View image"
                  >
                    <Image src={img} alt="" width={120} height={120} unoptimized={img.startsWith("/storage/") || img.includes("://")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </button>
                ))}
              </div>
            )}
            <div className="tpl-pdp__media">
              <button
                type="button"
                className="tpl-pdp__expand"
                onClick={() => setLbOpen(true)}
                aria-label={t(lang, "View full image", "বড় ছবি দেখুন")}
              >
                <Image
                  src={mainImage}
                  alt={product.name}
                  width={640}
                  height={640}
                  priority
                  unoptimized={mainImage.startsWith("/storage/") || mainImage.includes("://")}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
                <span className="tpl-pdp__zoomhint" aria-hidden="true"><FiZoomIn size={16} /></span>
              </button>
              {images.length > 1 && (
                <>
                  <button type="button" className="tpl-pdp__nav tpl-pdp__nav--prev" onClick={() => goImg(-1)} aria-label="Previous image"><FiChevronLeft size={18} /></button>
                  <button type="button" className="tpl-pdp__nav tpl-pdp__nav--next" onClick={() => goImg(1)} aria-label="Next image"><FiChevronRight size={18} /></button>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="tpl-pdp__info">
            <h1 className="tpl-pdp__title">{product.name}</h1>

            <div className="tpl-pdp__price">
              <span className="now">{formatMoney(price, currency)}</span>
              {originalPrice && originalPrice > price && <s>{formatMoney(originalPrice, currency)}</s>}
              {disc != null && <span className="tpl-pdp__save">{t(lang, `Save ${disc}%`, `${disc}% ছাড়`)}</span>}
            </div>

            <hr className="tpl-pdp__rule" />

            {variants.length > 0 && (
              <div className="tpl-pdp__variants">
                <b className="tpl-pdp__vlabel">{product.variationType || t(lang, "Options", "অপশন")}</b>
                <div className="tpl-pdp__vrow">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!v.unlimited_stock && v.stock <= 0}
                      onClick={() => { setVariantId(v.id); }}
                      className={`tpl-variant ${v.id === variantId ? "tpl-variant--active" : ""}`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="tpl-pdp__qtyrow">
              <span className="tpl-pdp__qtylabel">{t(lang, "Quantity:", "পরিমাণ:")}</span>
              <div className="tpl-qty">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease"><FiMinus size={13} /></button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Increase"><FiPlus size={13} /></button>
              </div>
            </div>

            {/* 2×2 action grid */}
            <div className="tpl-pdp__actions">
              <button type="button" className="tpl-pdpbtn tpl-pdpbtn--cart" onClick={addToBag}>
                <FiShoppingCart size={16} />
                <Editable section="product" field="addToBag" defaultValue={t(lang, "ADD TO CART", "কার্টে যোগ করুন")} label="Add to cart CTA">
                  {(v, ep) => <span {...ep}>{v}</span>}
                </Editable>
              </button>
              <button ref={buyRef} type="button" className="tpl-pdpbtn tpl-pdpbtn--buy" onClick={buyNow}>
                <Editable section="product" field="buyNow" defaultValue={t(lang, "BUY NOW", "এখনই কিনুন")} label="Buy now CTA">
                  {(v, ep) => <span {...ep}>{v}</span>}
                </Editable>
              </button>
              <a
                className={`tpl-pdpbtn tpl-pdpbtn--wa${waPhone ? "" : " is-disabled"}`}
                href={waPhone ? `https://wa.me/${waPhone}?text=${waText}` : undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp size={17} />
                {t(lang, "Order On WhatsApp", "হোয়াটসঅ্যাপে অর্ডার")}
              </a>
              <a
                className={`tpl-pdpbtn tpl-pdpbtn--call${rawPhone ? "" : " is-disabled"}`}
                href={rawPhone ? `tel:${waPhone}` : undefined}
              >
                <FiPhone size={16} />
                {t(lang, "Call For Order", "কল করে অর্ডার")}
              </a>
            </div>

            <button
              type="button"
              className={`tpl-pdp__wishbtn${wish.has(product.id) ? " is-on" : ""}`}
              onClick={() => wish.toggle(product)}
              aria-pressed={wish.has(product.id)}
            >
              {wish.has(product.id) ? <FaHeart size={15} /> : <FaRegHeart size={15} />}
              {wish.has(product.id)
                ? t(lang, "Saved to Wishlist", "উইশলিস্টে সংরক্ষিত")
                : t(lang, "Add to Wishlist", "উইশলিস্টে যোগ করুন")}
            </button>

            {brand && (
              <Link href={`/brand/${brand.slug}`} className="tpl-pdp__brand">
                <span>{t(lang, "Brand:", "ব্র্যান্ড:")}</span>
                <Emblem k={brand.key} color={brand.color} size={22} />
                <b>{brand.a}<i style={{ color: brand.color, fontStyle: "normal" }}>{brand.b}</i></b>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Tabs (scroll to section) ───────────────────────────────── */}
      <div className="tpl-pdpcard tpl-pdptabs">
        <div className="tpl-tabbar">
          <button type="button" className={`tpl-tab${tab === "desc" ? " is-active" : ""}`} onClick={() => goTab("desc")}>
            {t(lang, "Description", "বিবরণ")}
          </button>
          <button type="button" className={`tpl-tab${tab === "reviews" ? " is-active" : ""}`} onClick={() => goTab("reviews")}>
            {t(lang, "Customer Reviews", "কাস্টমার রিভিউ")} ({reviewCount})
          </button>
        </div>
      </div>

      {/* ── 2b. Description ───────────────────────────────────────────── */}
      <div className="tpl-pdpcard tpl-pdpsection" id="description" ref={descRef}>
        <h3 className="tpl-sectitle tpl-sectitle--accent">{t(lang, "Product Details", "পণ্যের বিবরণ")}</h3>
        <div className="tpl-pdp__desc">{renderDescription()}</div>
      </div>

      {/* ── 3. Reviews (below the description) ─────────────────────────── */}
      <div className="tpl-pdpcard tpl-pdpsection" id="reviews" ref={reviewsRef}>
        <div className="tpl-reviews">
          {/* Summary */}
          <div className="tpl-reviews__summary">
            <div className="tpl-reviews__big">{average.toFixed(1)}</div>
            <div className="tpl-reviews__avglabel">
              <span className="tpl-reviews__avgttl">{t(lang, "Average Rating", "গড় রেটিং")}</span>
              <span className="tpl-stars" aria-hidden>
                {[1, 2, 3, 4, 5].map((s) => <FiStar key={s} size={14} className={s <= Math.round(average) ? "is-on" : ""} />)}
              </span>
              <span className="tpl-reviews__count">({reviewCount} {t(lang, "Reviews", "রিভিউ")})</span>
            </div>
            <div className="tpl-reviews__rec">{recommended}% <span>{t(lang, "Recommended", "সুপারিশকৃত")}</span></div>
            <div className="tpl-reviews__bars">
              {bars.map((b, idx) => {
                const pct = reviewCount ? Math.round((dist[idx] / reviewCount) * 100) : 0;
                return (
                  <div className="tpl-reviews__bar" key={b}>
                    <span className="tpl-reviews__barstars">{Array.from({ length: b }).map((_, i) => <FiStar key={i} size={11} />)}</span>
                    <span className="tpl-reviews__track"><i style={{ width: `${pct}%` }} /></span>
                    <span className="tpl-reviews__pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit form */}
          <div className="tpl-reviews__form">
            <h3 className="tpl-sectitle tpl-sectitle--accent">{t(lang, "Submit Your Review", "আপনার রিভিউ দিন")}</h3>
            {reviewSent ? (
              <p className="tpl-reviews__thanks">{t(lang, "Thanks! Your review has been submitted for approval.", "ধন্যবাদ! আপনার রিভিউ অনুমোদনের জন্য জমা হয়েছে।")}</p>
            ) : (
              <form onSubmit={submitReview}>
                <p className="tpl-reviews__note">
                  {t(lang, "Your email address will not be published. Required fields are marked *", "আপনার ইমেইল প্রকাশ করা হবে না। আবশ্যক ঘরগুলো * চিহ্নিত।")}
                </p>
                <label className="tpl-field">
                  <span>{t(lang, "Write your opinion about the product", "পণ্যটি সম্পর্কে আপনার মতামত লিখুন")}</span>
                  <textarea
                    rows={5}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={t(lang, "Write Your Review Here...", "এখানে আপনার রিভিউ লিখুন...")}
                    required
                  />
                </label>
                <label className="tpl-field tpl-field--inline">
                  <span>{t(lang, "Your Rating:", "আপনার রেটিং:")}</span>
                  <select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)} required>
                    <option value="">{t(lang, "Select One", "একটি নির্বাচন করুন")}</option>
                    <option value="5">★★★★★ (5)</option>
                    <option value="4">★★★★ (4)</option>
                    <option value="3">★★★ (3)</option>
                    <option value="2">★★ (2)</option>
                    <option value="1">★ (1)</option>
                  </select>
                </label>
                <button type="submit" className="tpl-reviews__submit">{t(lang, "SUBMIT REVIEW", "রিভিউ জমা দিন")}</button>
              </form>
            )}
          </div>
        </div>

        {/* Submitted reviews */}
        {reviews.length > 0 && (
          <ul className="tpl-reviews__list">
            {reviews.map((r) => (
              <li className="tpl-reviewitem" key={r.id}>
                <div className="tpl-reviewitem__head">
                  <span className="tpl-reviewitem__avatar">{r.author.charAt(0).toUpperCase()}</span>
                  <div>
                    <b className="tpl-reviewitem__author">{r.author}</b>
                    <span className="tpl-reviewitem__date">{fmtDate(r.date)}</span>
                  </div>
                  <span className="tpl-reviewitem__stars" aria-label={`${r.rating} / 5`}>
                    {[1, 2, 3, 4, 5].map((s) => <FiStar key={s} size={13} className={s <= r.rating ? "is-on" : ""} />)}
                  </span>
                </div>
                <p className="tpl-reviewitem__text">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 4. Related products ───────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="tpl-sec tpl-pdprelated">
          <div className="tpl-sechead">
            <h2 className="tpl-sectitle">{t(lang, "Related Products", "সম্পর্কিত পণ্য")}</h2>
            <Link href="/shop" className="tpl-viewall">{t(lang, "More Products", "আরও পণ্য")} <FiChevronRight size={13} /></Link>
          </div>
          <div className="tpl-feed">
            {related.slice(0, 5).map((p, i) => <ProductCard product={p} key={p.id} priority={i < 4} />)}
          </div>
        </section>
      )}

      {/* ── Fullscreen image gallery (auto + manual slideshow) ────────── */}
      {lbOpen && (
        <Lightbox
          images={images}
          index={imgIndex}
          alt={product.name}
          onIndex={setImgIndex}
          onClose={() => setLbOpen(false)}
        />
      )}

    </div>
  );
}
