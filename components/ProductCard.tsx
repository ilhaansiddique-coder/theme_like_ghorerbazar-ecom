"use client";

/**
 * ShopKart — product card with two layouts:
 *   • "grid" (default) — vertical card: image on top, title, price, single
 *     full-width "Add To Cart" button. Used across Home / Shop feeds.
 *   • "row" — horizontal card: image left; title, price, "Save ৳X" badge and a
 *     two-button row (outline "Add To Cart" + solid "Buy now") on the right,
 *     with a "Best Selling" tag in the top-right corner. Used by Top Selling.
 *
 * Tapping the card fires trackSelectItem; Add To Cart fires trackAddToCart;
 * Buy now adds to the cart then routes to checkout.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiShoppingCart, FiCheck, FiTag } from "react-icons/fi";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/CartContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { trackSelectItem, trackAddToCart, trackInitiateCheckout } from "@/lib/analytics";
import { formatMoney, discountPercent } from "./helpers";
import { useLang, t } from "./lang";

interface Props { product: Product; priority?: boolean; bestseller?: boolean; layout?: "grid" | "row" }

export default function ProductCard({ product, priority, bestseller, layout = "grid" }: Props) {
  const settings = useSiteSettings();
  const { addItem } = useCart();
  const { lang } = useLang();
  const router = useRouter();
  const currency = settings.currency_symbol || "৳";
  const disc = discountPercent(product.price, product.originalPrice);
  const saved = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice - product.price : null;
  const slug = product.slug || String(product.id);
  const isExternal = product.image && (product.image.startsWith("/storage/") || product.image.includes("://"));

  const preorder = !!(product as Product & { preorder?: boolean }).preorder;
  const outOfStock = !product.unlimitedStock && product.stock <= 0;

  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = () => {
    trackSelectItem({
      item_list_id: "tpl_card",
      item: { id: product.id, name: product.name, category: product.category, price: product.price },
    });
  };

  const addToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
      unlimitedStock: product.unlimitedStock,
    }, 1);
    trackAddToCart({ content_ids: [product.id], content_name: product.name, value: product.price, quantity: 1 });
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart();
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1400);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart();
    trackInitiateCheckout({ value: product.price, content_ids: [product.id], num_items: 1 });
    router.push("/checkout");
  };

  const img = (
    <Image
      src={product.image || "/placeholder.svg"}
      alt={product.name}
      fill
      sizes={layout === "row" ? "(max-width: 700px) 40vw, 220px" : "(max-width: 640px) 50vw, (max-width: 960px) 33vw, 20vw"}
      unoptimized={!!isExternal}
      priority={priority}
    />
  );

  // ── Row layout (Top Selling) ───────────────────────────────────────
  if (layout === "row") {
    return (
      <div className="tpl-rowcard">
        {bestseller && (
          <span className="tpl-rowcard__best"><FiTag size={12} /> {t(lang, "Best Selling", "বেস্ট সেলিং")}</span>
        )}
        <Link href={`/products/${slug}`} className="tpl-rowcard__media" onClick={handleSelect}>
          {img}
          {outOfStock && <span className="tpl-card__badge tpl-card__badge--stock">{t(lang, "STOCK OUT", "স্টক নেই")}</span>}
        </Link>
        <div className="tpl-rowcard__info">
          <Link href={`/products/${slug}`} className="tpl-rowcard__link" onClick={handleSelect}>
            <h3 className="tpl-rowcard__name">{product.name}</h3>
            <div className="tpl-card__priceRow">
              <span className="tpl-card__price">{formatMoney(product.price, currency)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <s>{formatMoney(product.originalPrice, currency)}</s>
              )}
              {saved != null && (
                <span className="tpl-rowcard__save">{t(lang, `Save ${currency}${saved.toLocaleString()}`, `${currency}${saved.toLocaleString()} সাশ্রয়`)}</span>
              )}
            </div>
          </Link>
          <div className="tpl-rowcard__btns">
            <button type="button" className={`tpl-rowbtn tpl-rowbtn--ghost${added ? " is-done" : ""}`} onClick={handleAdd} disabled={outOfStock}
              aria-label={`Add ${product.name} to cart`}>
              {added ? <FiCheck size={15} /> : <FiShoppingCart size={15} />}
              {outOfStock ? t(lang, "Out of Stock", "স্টক নেই") : added ? t(lang, "Added", "যোগ হয়েছে") : t(lang, "Add To Cart", "কার্টে যোগ করুন")}
            </button>
            <button type="button" className="tpl-rowbtn tpl-rowbtn--solid" onClick={handleBuyNow} disabled={outOfStock}
              aria-label={`Buy ${product.name} now`}>
              <FiShoppingCart size={15} /> {t(lang, "Buy now", "এখনই কিনুন")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Grid layout (default) ──────────────────────────────────────────
  return (
    <div className="tpl-card">
      <Link href={`/products/${slug}`} className="tpl-card__link" onClick={handleSelect}>
        <div className="tpl-card__media">
          {img}
          {outOfStock ? (
            <span className="tpl-card__badge tpl-card__badge--stock">{t(lang, "STOCK OUT", "স্টক নেই")}</span>
          ) : preorder ? (
            <span className="tpl-card__badge tpl-card__badge--pre">{t(lang, "PRE ORDER", "প্রি অর্ডার")}</span>
          ) : bestseller ? (
            <span className="tpl-card__badge tpl-card__badge--best">{t(lang, "Best Selling", "বেস্ট সেলিং")}</span>
          ) : null}
          {disc != null && <span className="tpl-card__save">{t(lang, `Save ${disc}%`, `${disc}% ছাড়`)}</span>}
        </div>
        <div className="tpl-card__body">
          <h3 className="tpl-card__name">{product.name}</h3>
          <div className="tpl-card__priceRow">
            <span className="tpl-card__price">{formatMoney(product.price, currency)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <s>{formatMoney(product.originalPrice, currency)}</s>
            )}
            {disc != null && <span className="tpl-disc">-{disc}%</span>}
          </div>
        </div>
      </Link>
      <div className="tpl-card__foot">
        <button
          type="button"
          className={`tpl-card__addbtn${added ? " tpl-card__addbtn--done" : ""}`}
          onClick={handleAdd}
          disabled={outOfStock}
          aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
        >
          {added ? <FiCheck size={16} /> : <FiShoppingCart size={16} />}
          {outOfStock
            ? t(lang, "Out of Stock", "স্টক নেই")
            : added
              ? t(lang, "Added", "যোগ হয়েছে")
              : t(lang, "Add To Cart", "কার্টে যোগ করুন")}
        </button>
      </div>
    </div>
  );
}
