"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPlus, FiTrash2, FiShoppingCart } from "react-icons/fi";
import { useCart } from "@/lib/CartContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { trackRemoveFromCart } from "@/lib/analytics";
import { Editable } from "@/storefront-engine/editor/Editable";
import { formatMoney } from "../components/helpers";
import "../styles.css";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const settings = useSiteSettings();
  const currency = settings.currency_symbol || "৳";

  // GA4 view_cart event for GTM-driven audiences.
  useEffect(() => {
    if (!items.length || typeof window === "undefined") return;
    type Layer = { dataLayer?: Array<Record<string, unknown>> };
    const w = window as Window & Layer;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ ecommerce: null });
    w.dataLayer.push({
      event: "view_cart",
      ecommerce: {
        currency: settings.currency || "BDT",
        value: totalPrice,
        items: items.map((i) => ({
          item_id: String(i.id),
          item_name: i.name,
          item_variant: i.variantLabel || undefined,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleRemove = (item: typeof items[number]) => {
    trackRemoveFromCart({
      content_ids: [item.id],
      content_name: item.name,
      value: item.price * item.quantity,
      quantity: item.quantity,
    });
    removeItem(item.id, item.variantId);
  };

  return (
    <div className="tpl-page">
      <div className="tpl-head">
        <span className="tpl-head__bar" />
        <Editable section="cart" field="title" defaultValue="Your cart" label="Cart title">
          {(v, ep) => <h2 {...ep}>{v}</h2>}
        </Editable>
      </div>

      {items.length === 0 ? (
        <div className="tpl-panel" style={{ textAlign: "center", padding: "56px 20px" }}>
          <FiShoppingCart size={40} color="var(--tpl-muted)" />
          <p style={{ color: "var(--tpl-muted)", margin: "16px 0 20px" }}>Your cart is empty.</p>
          <Link href="/shop" className="tpl-btn">Start shopping</Link>
        </div>
      ) : (
        <div className="tpl-cols">
          <div className="tpl-panel" style={{ padding: 8 }}>
            {items.map((item) => (
              <div key={`${item.id}-${item.variantId || 0}`} style={{ display: "grid", gridTemplateColumns: "76px 1fr auto", gap: 14, padding: "14px 12px", borderBottom: "1px solid var(--tpl-line)" }}>
                <div style={{ aspectRatio: "1 / 1", background: "var(--tpl-line)", overflow: "hidden", borderRadius: 4 }}>
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={76}
                    height={76}
                    unoptimized={item.image?.startsWith("/storage/") || item.image?.includes("://")}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>{item.name}</h4>
                  {item.variantLabel && <small style={{ color: "var(--tpl-muted)" }}>{item.variantLabel}</small>}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                    <div className="tpl-qty">
                      <button type="button" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variantId)} style={{ width: 28, height: 28 }}><FiMinus size={12} /></button>
                      <span style={{ minWidth: 24, textAlign: "center" }}>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)} style={{ width: 28, height: 28 }}><FiPlus size={12} /></button>
                    </div>
                    <button type="button" onClick={() => handleRemove(item)} style={{ background: "transparent", border: 0, color: "var(--tpl-muted)", cursor: "pointer" }} aria-label="Remove"><FiTrash2 size={15} /></button>
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: "var(--tpl-primary)" }}>{formatMoney(item.price * item.quantity, currency)}</div>
              </div>
            ))}
          </div>

          <aside className="tpl-panel" style={{ position: "sticky", top: 76 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Order summary</h2>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 14 }}>
              <span style={{ color: "var(--tpl-muted)" }}>Subtotal</span>
              <b>{formatMoney(totalPrice, currency)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 14 }}>
              <span style={{ color: "var(--tpl-muted)" }}>Shipping</span>
              <b>Calculated at checkout</b>
            </div>
            <Link href="/checkout" className="tpl-btn" style={{ width: "100%", marginTop: 16 }}>Proceed to checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
