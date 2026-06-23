"use client";

/**
 * Search box with live autocomplete. Typing (2+ chars, debounced) queries the
 * products search API and shows a suggestions dropdown — thumbnail, name and
 * price. Click a suggestion to open the product; Enter (or "See all") runs the
 * full search on /shop?search=. Keyboard: ↑/↓ to move, Enter to open, Esc to
 * close. Degrades gracefully — if the API isn't reachable, Enter still searches.
 *
 * The endpoint is configurable via the `endpoint` prop or
 * NEXT_PUBLIC_SEARCH_ENDPOINT, and the response parser accepts the common
 * shapes (flat array, { products }, { results }, Elasticsearch/Algolia, …).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { formatMoney } from "../components/helpers";
import { useLang, t } from "../components/lang";

interface Suggestion { id: number; name: string; slug?: string; price: number; image?: string }

const DEFAULT_ENDPOINT = process.env.NEXT_PUBLIC_SEARCH_ENDPOINT || "/api/v1/products";

interface SearchBarProps {
  /** Search API path; receives `?search=<term>&limit=<n>`. Defaults to /api/v1/products. */
  endpoint?: string;
  /** Focus the input on mount (used by the mobile top-search overlay). */
  autoFocus?: boolean;
  /** Fired right before navigating (submit / suggestion / "see all") so a host
   *  overlay can close itself. */
  onNavigate?: () => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Pull the result array out of whatever envelope the API uses.
function resultArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return data.products || data.results || data.items || data.hits || data.data || [];
}

// Normalise one result row — flat product, or nested under product/_source/etc.
function normalize(raw: any): Suggestion | null {
  const o = raw?.product || raw?._source || raw?.document || raw?.node || raw;
  if (!o || typeof o !== "object") return null;
  const name = o.name ?? o.title ?? o.product_name;
  if (name == null) return null;
  const id = o.id ?? o.product_id ?? o.objectID ?? raw.id ?? raw.objectID ?? raw._id;
  const image = o.image ?? o.image_url ?? o.thumbnail ?? (Array.isArray(o.images) ? o.images[0] : o.images);
  const slug = o.slug ?? o.handle ?? raw.slug ?? (id != null ? String(id) : undefined);
  return {
    id: Number(id) || 0,
    name: String(name),
    slug: slug ? String(slug) : undefined,
    price: Number(o.price ?? o.amount ?? o.min_price ?? 0),
    image: image ? String(image) : undefined,
  };
}

function asList(data: unknown): Suggestion[] {
  return resultArray(data).map(normalize).filter((s): s is Suggestion => s !== null);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function SearchBar({ endpoint = DEFAULT_ENDPOINT, autoFocus, onNavigate }: SearchBarProps) {
  const router = useRouter();
  const settings = useSiteSettings();
  const { lang } = useLang();
  const currency = settings.currency_symbol || "৳";

  const [q, setQ] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLFormElement>(null);

  // Debounced fetch of suggestions as the user types.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const sep = endpoint.includes("?") ? "&" : "?";
        const res = await fetch(`${endpoint}${sep}search=${encodeURIComponent(term)}&limit=6`, { headers: { Accept: "application/json" } });
        setResults(asList(await res.json()).slice(0, 6));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [q, endpoint]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runSearch = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/shop?search=${encodeURIComponent(t)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const r = results[active];
      setOpen(false);
      onNavigate?.();
      router.push(`/products/${r.slug || r.id}`);
    }
  };

  const showMenu = open && q.trim().length >= 2;

  return (
    <form className="tpl-search" ref={ref} role="search" onSubmit={(e) => { e.preventDefault(); runSearch(q); }}>
      <input
        className="tpl-search__input"
        type="search"
        autoFocus={autoFocus}
        value={q}
        placeholder={t(lang, "Search in…", "এখানে খুঁজুন…")}
        autoComplete="off"
        aria-label={t(lang, "Search products", "পণ্য খুঁজুন")}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <button type="submit" className="tpl-search__btn" aria-label={t(lang, "Search", "খুঁজুন")}>
        <FiSearch size={18} className="tpl-search__icon" />
      </button>

      {showMenu && (
        <div className="tpl-search__menu">
          {loading && results.length === 0 && <div className="tpl-search__msg">Searching…</div>}
          {!loading && results.length === 0 && <div className="tpl-search__msg">No products found</div>}
          {results.map((r, i) => (
            <Link
              key={r.id}
              href={`/products/${r.slug || r.id}`}
              className={`tpl-search__item${i === active ? " tpl-search__item--active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => { setOpen(false); onNavigate?.(); }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image || "/placeholder.svg"} alt="" />
              <span className="tpl-search__name">{r.name}</span>
              <span className="tpl-search__price">{formatMoney(r.price, currency)}</span>
            </Link>
          ))}
          {results.length > 0 && (
            <button type="button" className="tpl-search__all" onClick={() => runSearch(q)}>
              See all results for “{q.trim()}”
            </button>
          )}
        </div>
      )}
    </form>
  );
}
