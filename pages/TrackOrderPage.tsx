"use client";

/**
 * ShopKart — Track Order page.
 *
 * A fully dynamic, real-time order-tracking screen: the shopper types an order
 * number (or arrives with `?order=<token>` in the URL) and the page looks the
 * order up against the engine's PUBLIC order endpoint
 *   GET /api/v1/orders/token/<token>
 * then renders a live shipment timeline, the delivery address, the line items
 * and the totals — every value comes from the API + tenant settings, nothing
 * is hardcoded. A miss renders the "Order Not Found" card.
 *
 * Not a standard engine slot (there is no track-order slot, same as LivePage),
 * so it is wired to a `/track-order` route and linked from the navbar.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiSearch, FiPackage, FiCheckCircle, FiTruck, FiHome,
  FiClock, FiMapPin, FiPhone, FiXCircle, FiRotateCcw, FiShoppingBag,
} from "react-icons/fi";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { Editable } from "@/storefront-engine/editor/Editable";
import { useLang, t } from "../components/lang";
import { formatMoney } from "../components/helpers";
import "../styles.css";

/* ── Engine order contract (serialized camelCase from /orders/token/<token>) ── */
interface TrackedOrderItem {
  id: number;
  productName: string;
  variantLabel?: string | null;
  price: number;
  quantity: number;
}
interface TrackedOrder {
  id: number;
  orderToken?: string | null;
  status: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  city?: string | null;
  subtotal?: number | null;
  shippingCost?: number | null;
  discount?: number | null;
  total: number;
  courierStatus?: string | null;
  courierType?: string | null;
  consignmentId?: string | null;
  createdAt?: string | null;
  items?: TrackedOrderItem[];
}

type Phase = "idle" | "loading" | "found" | "notfound" | "error";

/** Public order-lookup endpoint base — overridable per tenant via env. */
const ENDPOINT =
  process.env.NEXT_PUBLIC_ORDER_TRACK_ENDPOINT || "/api/v1/orders/token";

/** Canonical shipment journey. The order's `status` maps onto one of these
 *  indices; everything up to and including it is rendered as "done". */
const STEPS = [
  { key: "placed",    en: "Order Placed", bn: "অর্ডার করা হয়েছে",  icon: FiPackage },
  { key: "confirmed", en: "Confirmed",    bn: "নিশ্চিত হয়েছে",     icon: FiCheckCircle },
  { key: "shipped",   en: "Shipped",      bn: "পাঠানো হয়েছে",     icon: FiTruck },
  { key: "delivered", en: "Delivered",    bn: "ডেলিভারি হয়েছে",    icon: FiHome },
] as const;

/** Map an engine status string to a STEPS index. -1 ⇒ terminal/cancelled. */
function statusToIndex(status: string): number {
  switch ((status || "").toLowerCase()) {
    case "delivered":              return 3;
    case "shipped":                return 2;
    case "confirmed":
    case "processing":             return 1;
    case "cancelled":
    case "trashed":                return -1;
    case "pending":
    case "on_hold":
    default:                       return 0;
  }
}

function prettyStatus(status: string): string {
  const s = (status || "").replace(/_/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pending";
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function TrackOrderPage({ endpoint = ENDPOINT }: { endpoint?: string }) {
  const settings = useSiteSettings();
  const currency = settings.currency_symbol || "৳";
  const { lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const lookup = useCallback(async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setPhase("loading");
    setOrder(null);
    try {
      const sep = endpoint.endsWith("/") ? "" : "/";
      const res = await fetch(`${endpoint}${sep}${encodeURIComponent(value)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.status === 404) { setPhase("notfound"); return; }
      if (!res.ok) { setPhase("error"); return; }
      const data = (await res.json()) as TrackedOrder | { order?: TrackedOrder };
      const found = "id" in data ? data : data.order;
      if (!found || !("id" in found)) { setPhase("notfound"); return; }
      setOrder(found as TrackedOrder);
      setPhase("found");
    } catch {
      setPhase("error");
    }
  }, [endpoint]);

  // Deep-link: /track-order?order=<token> auto-runs the lookup on mount/param change.
  useEffect(() => {
    const fromUrl = searchParams.get("order");
    if (fromUrl) {
      setQuery(fromUrl);
      void lookup(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = query.trim();
    if (!value) return;
    // Keep the URL shareable / refresh-safe; the effect above runs the lookup.
    router.replace(`?order=${encodeURIComponent(value)}`);
    void lookup(value);
  };

  return (
    <div className="tpl-track">
      {/* ── Header band: intro + search ───────────────────────────── */}
      <section className="tpl-track__head">
        <div className="tpl-track__intro">
          <Editable section="track" field="eyebrow" defaultValue="LIVE ORDER TRACKING" label="Track eyebrow">
            {(v, ep) => <span {...ep} className="tpl-track__eyebrow"><i /> {v}</span>}
          </Editable>
          <Editable section="track" field="title" defaultValue="Track Your Order" label="Track title">
            {(v, ep) => <h1 {...ep} className="tpl-track__title">{v}</h1>}
          </Editable>
          <Editable section="track" field="subtitle" defaultValue="Real-time updates on your shipment progress" label="Track subtitle">
            {(v, ep) => <p {...ep} className="tpl-track__sub">{v}</p>}
          </Editable>
        </div>

        <form className="tpl-track__search" onSubmit={handleSubmit} role="search">
          <input
            type="text"
            className="tpl-track__input"
            placeholder={t(lang, "Enter order number...", "অর্ডার নম্বর লিখুন...")}
            aria-label={t(lang, "Order number", "অর্ডার নম্বর")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="tpl-btn tpl-track__btn" disabled={phase === "loading" || !query.trim()}>
            {phase === "loading"
              ? t(lang, "Searching…", "খোঁজা হচ্ছে…")
              : (<><FiSearch size={15} /> {t(lang, "Search", "খুঁজুন")}</>)}
          </button>
        </form>
      </section>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="tpl-track__body">
        {phase === "idle" && (
          <div className="tpl-track__card tpl-track__card--state">
            <span className="tpl-track__emoji" aria-hidden>🔍</span>
            <Editable section="track" field="idleTitle" defaultValue="Enter your order number" label="Idle title">
              {(v, ep) => <h2 {...ep} className="tpl-track__state-title">{v}</h2>}
            </Editable>
            <Editable section="track" field="idleBody" defaultValue="Type the order number from your confirmation message above to see live delivery updates." label="Idle body">
              {(v, ep) => <p {...ep} className="tpl-track__state-sub">{v}</p>}
            </Editable>
            <Link href="/shop" className="tpl-btn tpl-track__back">
              <FiShoppingBag size={15} /> {t(lang, "Back to shopping", "শপিংয়ে ফিরে যান")}
            </Link>
          </div>
        )}

        {phase === "loading" && (
          <div className="tpl-track__card tpl-track__card--state">
            <span className="tpl-track__spinner" aria-hidden />
            <p className="tpl-track__state-sub">{t(lang, "Fetching your order…", "আপনার অর্ডার আনা হচ্ছে…")}</p>
          </div>
        )}

        {phase === "error" && (
          <div className="tpl-track__card tpl-track__card--state">
            <span className="tpl-track__emoji" aria-hidden>⚠️</span>
            <h2 className="tpl-track__state-title">{t(lang, "Something went wrong", "কিছু একটা সমস্যা হয়েছে")}</h2>
            <p className="tpl-track__state-sub">{t(lang, "We couldn't reach the tracking service. Please try again in a moment.", "ট্র্যাকিং সার্ভিসে পৌঁছানো যায়নি। একটু পরে আবার চেষ্টা করুন।")}</p>
            <button type="button" className="tpl-btn tpl-track__back" onClick={() => lookup(query)}>
              <FiRotateCcw size={15} /> {t(lang, "Try again", "আবার চেষ্টা করুন")}
            </button>
          </div>
        )}

        {phase === "notfound" && (
          <div className="tpl-track__card tpl-track__card--state">
            <span className="tpl-track__emoji" aria-hidden>📦</span>
            <Editable section="track" field="notFoundTitle" defaultValue="Order Not Found" label="Not-found title">
              {(v, ep) => <h2 {...ep} className="tpl-track__state-title">{v}</h2>}
            </Editable>
            <Editable section="track" field="notFoundBody" defaultValue="We couldn't find an order with that number. Please double-check and try again." label="Not-found body">
              {(v, ep) => <p {...ep} className="tpl-track__state-sub">{v}</p>}
            </Editable>
            <Link href="/shop" className="tpl-btn tpl-track__back">
              <FiShoppingBag size={15} /> {t(lang, "Back to shopping", "শপিংয়ে ফিরে যান")}
            </Link>
          </div>
        )}

        {phase === "found" && order && (
          <OrderResult order={order} currency={currency} lang={lang} />
        )}
      </div>
    </div>
  );
}

/* ── Found-order detail ─────────────────────────────────────────── */
function OrderResult({
  order, currency, lang,
}: { order: TrackedOrder; currency: string; lang: ReturnType<typeof useLang>["lang"] }) {
  const idx = statusToIndex(order.status);
  const cancelled = idx === -1;
  const items = order.items || [];
  const placed = formatDate(order.createdAt);
  const subtotal = order.subtotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = order.shippingCost ?? 0;
  const discount = order.discount ?? 0;

  return (
    <div className="tpl-track__result">
      {/* Summary header */}
      <div className="tpl-track__card tpl-track__summary">
        <div>
          <span className="tpl-track__ref-label">{t(lang, "Order", "অর্ডার")}</span>
          <b className="tpl-track__ref">#{order.orderToken || order.id}</b>
          {placed && (
            <span className="tpl-track__placed">
              <FiClock size={13} /> {t(lang, "Placed", "অর্ডার")} {placed}
            </span>
          )}
        </div>
        <span className={`tpl-track__status tpl-track__status--${cancelled ? "bad" : idx >= 3 ? "done" : "live"}`}>
          {cancelled ? <FiXCircle size={14} /> : <FiTruck size={14} />} {prettyStatus(order.status)}
        </span>
      </div>

      {/* Live shipment timeline */}
      <div className="tpl-track__card">
        <h3 className="tpl-track__h3">{t(lang, "Shipment progress", "শিপমেন্ট অগ্রগতি")}</h3>
        {cancelled ? (
          <p className="tpl-track__cancelled"><FiXCircle size={16} /> {t(lang, "This order was cancelled.", "এই অর্ডারটি বাতিল করা হয়েছে।")}</p>
        ) : (
          <ol className={`tpl-track__steps tpl-track__steps--at-${idx}`}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i <= idx;
              const current = i === idx;
              return (
                <li key={step.key} className={`tpl-track__step ${done ? "is-done" : ""} ${current ? "is-current" : ""}`}>
                  <span className="tpl-track__dot"><Icon size={15} /></span>
                  <span className="tpl-track__step-label">{t(lang, step.en, step.bn)}</span>
                </li>
              );
            })}
          </ol>
        )}
        {order.consignmentId && (
          <p className="tpl-track__consign">
            {t(lang, "Courier tracking", "কুরিয়ার ট্র্যাকিং")}: <b>{order.consignmentId}</b>
            {order.courierType ? ` · ${prettyStatus(order.courierType)}` : ""}
          </p>
        )}
      </div>

      {/* Delivery + items */}
      <div className="tpl-track__grid">
        <div className="tpl-track__card">
          <h3 className="tpl-track__h3">{t(lang, "Delivery", "ডেলিভারি")}</h3>
          {order.customerName && <p className="tpl-track__line"><b>{order.customerName}</b></p>}
          {order.customerPhone && <p className="tpl-track__line"><FiPhone size={14} /> {order.customerPhone}</p>}
          {(order.customerAddress || order.city) && (
            <p className="tpl-track__line">
              <FiMapPin size={14} />
              <span>{[order.customerAddress, order.city].filter(Boolean).join(", ")}</span>
            </p>
          )}
          {order.paymentMethod && (
            <p className="tpl-track__line tpl-track__pay">
              {t(lang, "Payment", "পেমেন্ট")}: {prettyStatus(order.paymentMethod)}
              {order.paymentStatus ? ` · ${prettyStatus(order.paymentStatus)}` : ""}
            </p>
          )}
        </div>

        <div className="tpl-track__card">
          <h3 className="tpl-track__h3">
            {t(lang, "Items", "পণ্য")} <span className="tpl-track__count">{items.length}</span>
          </h3>
          <ul className="tpl-track__items">
            {items.map((it) => (
              <li key={it.id} className="tpl-track__item">
                <span className="tpl-track__qty">{it.quantity}×</span>
                <span className="tpl-track__name">
                  {it.productName}
                  {it.variantLabel && <small> · {it.variantLabel}</small>}
                </span>
                <span className="tpl-track__price">{formatMoney(it.price * it.quantity, currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="tpl-track__totals">
            <div><dt>{t(lang, "Subtotal", "সাবটোটাল")}</dt><dd>{formatMoney(subtotal, currency)}</dd></div>
            {shipping > 0 && <div><dt>{t(lang, "Shipping", "ডেলিভারি")}</dt><dd>{formatMoney(shipping, currency)}</dd></div>}
            {discount > 0 && <div><dt>{t(lang, "Discount", "ছাড়")}</dt><dd>−{formatMoney(discount, currency)}</dd></div>}
            <div className="tpl-track__grand"><dt>{t(lang, "Total", "মোট")}</dt><dd>{formatMoney(order.total, currency)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="tpl-track__actions">
        <Link href="/shop" className="tpl-btn tpl-track__back"><FiShoppingBag size={15} /> {t(lang, "Back to shopping", "শপিংয়ে ফিরে যান")}</Link>
      </div>
    </div>
  );
}
