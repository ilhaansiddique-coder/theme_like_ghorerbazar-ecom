"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPlus, FiTrash2, FiX, FiShoppingCart } from "react-icons/fi";
import { useCart } from "@/lib/CartContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { trackRemoveFromCart } from "@/lib/analytics";
import type { CartDrawerProps } from "@/storefront-engine/types/pages";
import { formatMoney } from "../components/helpers";
import "../styles.css";

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const settings = useSiteSettings();
  const currency = settings.currency_symbol || "৳";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
    <>
      <div
        onClick={onClose}
        className={`tpl-cart-backdrop${open ? " tpl-cart-backdrop--open" : ""}`}
        aria-hidden={!open}
      />
      <aside className={`tpl-cart${open ? " tpl-cart--open" : ""}`} role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div className="tpl-cart__head">
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            <FiShoppingCart size={18} /> Your cart
          </h2>
          <button type="button" onClick={onClose} className="tpl-nav__icon" aria-label="Close"><FiX size={18} /></button>
        </div>

        <div className="tpl-cart__body">
          {items.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--tpl-muted)", padding: "48px 0" }}>
              Your cart is empty.
            </p>
          ) : (
            items.map((item) => (
              <div key={`${item.id}-${item.variantId || 0}`} className="tpl-panel" style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ aspectRatio: "1 / 1", background: "var(--tpl-line)", overflow: "hidden", borderRadius: 4 }}>
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={60}
                    height={60}
                    unoptimized={item.image?.startsWith("/storage/") || item.image?.includes("://")}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600 }}>{item.name}</h4>
                  {item.variantLabel && <small style={{ color: "var(--tpl-muted)" }}>{item.variantLabel}</small>}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                    <div className="tpl-qty">
                      <button type="button" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variantId)} style={{ width: 26, height: 26 }}><FiMinus size={11} /></button>
                      <span style={{ minWidth: 22, textAlign: "center", fontSize: 13 }}>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)} style={{ width: 26, height: 26 }}><FiPlus size={11} /></button>
                    </div>
                    <button type="button" onClick={() => handleRemove(item)} style={{ background: "transparent", border: 0, color: "var(--tpl-muted)", cursor: "pointer" }} aria-label="Remove"><FiTrash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "var(--tpl-primary)" }}>{formatMoney(item.price * item.quantity, currency)}</div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="tpl-cart__foot">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "baseline" }}>
              <span style={{ color: "var(--tpl-muted)", fontSize: 14 }}>Subtotal</span>
              <b style={{ fontSize: 20, color: "var(--tpl-primary)" }}>{formatMoney(totalPrice, currency)}</b>
            </div>
            <Link href="/checkout" onClick={onClose} className="tpl-btn" style={{ width: "100%" }}>Checkout</Link>
          </div>
        )}
      </aside>
    </>
  );
}
