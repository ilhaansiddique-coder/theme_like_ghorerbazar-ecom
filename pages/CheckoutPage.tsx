"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { trackAddPaymentInfo, trackInitiateCheckout, trackPurchase } from "@/lib/analytics";
import { Editable } from "@/storefront-engine/editor/Editable";
import { api } from "@/lib/api";
import { formatMoney } from "../components/helpers";
import { useAuth } from "../components/auth";
import { saveOrder, type OrderStatus } from "../components/orders";
import "../styles.css";

const DEFAULT_SHIPPING = 60;

// Demo coupons — code → discount on subtotal. Wire to the engine's promo API in prod.
const COUPONS: Record<string, (subtotal: number) => number> = {
  SAVE10: (s) => Math.round(s * 0.1),
  WELCOME: (s) => Math.round(s * 0.05),
  FRESH50: () => 50,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const settings = useSiteSettings();
  const { user } = useAuth();
  const currency = settings.currency_symbol || "৳";

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Coupon
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");

  const shipping = items.length ? DEFAULT_SHIPPING : 0;
  const discount = applied ? Math.min(applied.discount, totalPrice) : 0;
  const grandTotal = Math.max(0, totalPrice - discount) + shipping;

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const fn = COUPONS[code];
    if (!fn) { setApplied(null); setCouponMsg("Invalid coupon code."); return; }
    setApplied({ code, discount: fn(totalPrice) });
    setCouponMsg(`Coupon ${code} applied.`);
  };
  const clearCoupon = () => { setApplied(null); setCoupon(""); setCouponMsg(""); };

  useEffect(() => {
    if (items.length) {
      trackInitiateCheckout({
        value: totalPrice,
        content_ids: items.map((i) => i.id),
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      });
    }
  }, [items, totalPrice]);

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setPaymentMethod(next);
    trackAddPaymentInfo({
      value: totalPrice,
      payment_type: next,
      content_ids: items.map((i) => i.id),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await api.createOrder({
        customer_name: name,
        customer_phone: phone,
        customer_email: email || undefined,
        customer_address: address,
        city,
        subtotal: totalPrice,
        shipping_cost: shipping,
        discount,
        coupon: applied?.code,
        notes: notes || undefined,
        total: grandTotal,
        payment_method: paymentMethod,
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          variant_id: item.variantId || undefined,
          variant_label: item.variantLabel || undefined,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      trackPurchase({
        content_ids: items.map((i) => i.id),
        content_name: items.map((i) => i.name).join(", "),
        num_items: items.reduce((s, i) => s + i.quantity, 0),
        value: res.total || grandTotal,
        order_id: String(res.id || ""),
        shipping,
      });
      // Save to the theme-local order history (account "My Orders" + Track Order).
      const token = res.order_token || `SK${Date.now().toString(36).toUpperCase()}`;
      saveOrder({
        token,
        date: new Date().toISOString(),
        status: "Processing" as OrderStatus,
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image, variantLabel: i.variantLabel })),
        subtotal: totalPrice,
        shipping,
        discount,
        total: grandTotal,
        name, phone, address, city,
        payment: paymentMethod,
        notes: notes || undefined,
        coupon: applied?.code,
      });
      clearCart();
      setTimeout(() => router.push(`/order/${token}`), 800);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message || "Could not place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { name: "name",    type: "text",     label: "Full name",        value: name,    set: setName    },
    { name: "phone",   type: "tel",      label: "Phone",            value: phone,   set: setPhone   },
    { name: "email",   type: "email",    label: "Email (optional)", value: email,   set: setEmail   },
    { name: "address", type: "textarea", label: "Address",          value: address, set: setAddress },
    { name: "city",    type: "text",     label: "City",             value: city,    set: setCity    },
  ] as const;

  return (
    <div className="tpl-page">
      <div className="tpl-head">
        <span className="tpl-head__bar" />
        <Editable section="checkout" field="title" defaultValue="Checkout" label="Checkout title">
          {(v, ep) => <h2 {...ep}>{v}</h2>}
        </Editable>
      </div>

      <div className="tpl-cols">
        <form onSubmit={handleSubmit} className="tpl-panel" style={{ display: "grid", gap: 14 }}>
          {error && <div style={{ padding: 12, background: "var(--tpl-soft)", color: "var(--tpl-primary)", fontSize: 13, borderRadius: 4 }}>{error}</div>}
          {fields.map((f) => (
            <label key={f.name} className="tpl-field">
              <span>{f.label}</span>
              {f.type === "textarea" ? (
                <textarea value={f.value} onChange={(e) => f.set(e.target.value)} required rows={3} />
              ) : (
                <input type={f.type} value={f.value} onChange={(e) => f.set(e.target.value)} required={f.name !== "email"} />
              )}
            </label>
          ))}
          <label className="tpl-field">
            <span>Order notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Delivery instructions, landmark, etc." />
          </label>
          <label className="tpl-field">
            <span>Payment method</span>
            <select value={paymentMethod} onChange={handlePaymentChange}>
              <option value="cod">Cash on delivery</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
            </select>
          </label>
          <button type="submit" className="tpl-btn" disabled={submitting || !items.length} style={{ width: "100%" }}>
            {submitting ? "Placing order…" : `Place order · ${formatMoney(grandTotal, currency)}`}
          </button>
        </form>

        <aside className="tpl-panel" style={{ position: "sticky", top: 76 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Your order</h2>
          {items.length === 0 ? (
            <p style={{ color: "var(--tpl-muted)", fontSize: 14 }}>Cart is empty. <Link href="/shop" style={{ color: "var(--tpl-primary)" }}>Shop now →</Link></p>
          ) : (
            <>
              {items.map((item) => (
                <div key={`${item.id}-${item.variantId || 0}`} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, gap: 12 }}>
                  <span style={{ color: "var(--tpl-muted)" }}>{item.name} × {item.quantity}</span>
                  <b>{formatMoney(item.price * item.quantity, currency)}</b>
                </div>
              ))}
              {/* Coupon */}
              <div className="tpl-coupon">
                {applied ? (
                  <div className="tpl-coupon__applied">
                    <span>Coupon <b>{applied.code}</b></span>
                    <button type="button" onClick={clearCoupon}>Remove</button>
                  </div>
                ) : (
                  <div className="tpl-coupon__row">
                    <input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Coupon code"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                    />
                    <button type="button" onClick={applyCoupon}>Apply</button>
                  </div>
                )}
                {couponMsg && <p className={`tpl-coupon__msg${applied ? " is-ok" : " is-err"}`}>{couponMsg}</p>}
              </div>

              <div style={{ borderTop: "1px solid var(--tpl-line)", marginTop: 10, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "var(--tpl-muted)" }}>Subtotal</span><b>{formatMoney(totalPrice, currency)}</b>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
                  <span style={{ color: "var(--tpl-sale)" }}>Discount</span><b style={{ color: "var(--tpl-sale)" }}>−{formatMoney(discount, currency)}</b>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
                <span style={{ color: "var(--tpl-muted)" }}>Shipping</span><b>{formatMoney(shipping, currency)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--tpl-line)", marginTop: 8 }}>
                <b style={{ fontSize: 16 }}>Total</b><b style={{ fontSize: 20, color: "var(--tpl-primary)" }}>{formatMoney(grandTotal, currency)}</b>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
