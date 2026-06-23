# ShopKart — Demo Ecommerce Theme

A finished storefront theme: a clean **organic-grocery / natural-food marketplace**
look (soft grey app background, white rounded cards, a single fresh-green accent
for prices, CTAs, deal badges and a free-delivery announcement bar). A generic
demo organic food store — categories for mustard oil, ghee, honey, dates, nuts
& spices, bold ৳ prices and "100% organic" trust tags.
Mobile-first, all pages covered.

- **Theme id / slug:** `shopkart`
- **CSS scope class:** `.theme-shopkart` (every rule in `styles.css` is scoped under it)
- **Label in picker:** "ShopKart"
- **Design tokens** live at the top of `styles.css` — change `--tpl-primary`, `--tpl-accent`,
  `--tpl-radius`, etc. to re-skin the whole theme in one place.

> **Note — "Thank You" page:** there is no theme slot for an order-confirmation /
> thank-you page. After a successful checkout the engine redirects to
> `/order/<order_token>`, which the engine renders itself (not the theme). The
> themed Contact success state and empty-cart states are handled inside this theme.

The rest of this document is the original authoring guide — still useful for
understanding the engine contracts this theme implements.

---

A copy-paste starter for building a new storefront theme that drops cleanly into the engine.

## How to use this folder

```bash
# 1. Copy this folder under a new slug
cp -r src/themes/_template src/themes/<your-theme-id>

# 2. Search-replace TEMPLATE_ID → <your-theme-id> across the new folder
#    (slug, CSS scope class, label all use it)

# 3. Register in ONE place:
#    - src/storefront-engine/registry.ts  (import your manifest, add to STOREFRONT_THEMES_V2)

# 4. Done. Visit /dashboard/themes — the new theme is in the picker (it reads
#    the V2 registry's metadata directly).
```

`<your-theme-id>` rules: lowercase, hyphen-separated, no spaces. Examples: `lumen`, `bazaar`, `nordic-pro`.

## Folder shape (required)

```
src/themes/<your-id>/
├── manifest.ts              # Engine registration — slot loaders
├── styles.css               # Scoped under :where(.theme-<your-id>)
├── pages/
│   ├── HomePage.tsx         # Required
│   ├── ShopPage.tsx         # Required
│   ├── ProductPage.tsx      # Required
│   ├── CartPage.tsx         # Required
│   ├── CheckoutPage.tsx     # Required
│   ├── AboutPage.tsx        # Optional — falls back to default theme
│   ├── ContactPage.tsx      # Optional
│   ├── PolicyPages.tsx      # Optional — exports PrivacyPage / TermsPage / RefundPage
│   └── BlogPage.tsx         # Optional — exports default + BlogPostPage
├── chrome/
│   ├── Navbar.tsx           # Required
│   ├── Footer.tsx           # Required
│   └── CartDrawer.tsx       # Required
└── components/
    ├── ProductCard.tsx      # Used by HomePage + ShopPage
    └── helpers.ts           # Money formatting, image extraction etc.
```

Optional slots (anything in `pages/` ending with "Page") that you don't implement get the default theme's component automatically — your theme can ship partial coverage.

## What you must do

### 1. CSS scoping

EVERY rule in `styles.css` must start with `:where(.theme-<your-id>)` so it can't leak to other themes or the dashboard:

```css
:where(.theme-my-id) .my-button { padding: 12px 20px; }
:where(.theme-my-id) .my-card    { border-radius: 8px; }
```

The site layout wraps non-dashboard pages in `<div class="theme-<your-id>">` automatically.

### 2. Tenant data via hooks (never hardcode)

```ts
import { useCart } from "@/lib/CartContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { useLang } from "@/lib/LanguageContext";

const { items, addItem, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
const settings = useSiteSettings();         // tenant's site_name, currency, address, phone, social URLs
const { lang } = useLang();                 // "en" | "bn" — for bilingual UI strings
```

NEVER hardcode `"Acme Beauty"`, currency symbols, phone numbers. Always read from `settings.site_name`, `settings.currency_symbol`, etc.

### 3. Editable inline-edit wrappers

Every visible text + every editorial image must be wrapped in `<Editable>` so the tenant can edit inline from the storefront:

```tsx
import { Editable } from "@/storefront-engine/editor/Editable";

// Text — render-prop pattern
<Editable section="home" field="heroTitle" defaultValue="Welcome" label="Hero title">
  {(value, ep) => <h1 {...ep}>{value}</h1>}
</Editable>

// Image — type="image"
<Editable section="home" field="heroImage" type="image" defaultValue="/img/hero.jpg" label="Hero image">
  {(src, ep) => <img {...ep} src={src} alt="" />}
</Editable>
```

**Naming convention:** `section` = page name (home/about/shop/product/cart/etc.), `field` = camelCase identifier. Stable IDs only — renaming a field loses the tenant's saved override.

### 4. Tracking calls (FB Pixel + GA4 dataLayer in one)

All track functions push to BOTH Meta CAPI and GA4 dataLayer for GTM. Call them at the right user actions:

| Page / event | Function | When to fire |
|---|---|---|
| Shop / category page mount | `trackViewItemList` | useEffect on filtered list change |
| Product page mount | `trackViewContent` | useEffect with price |
| Product card click | `trackSelectItem` | onClick (before navigation) |
| Add to bag | `trackAddToCart` | After `addItem` succeeds |
| Remove from bag | `trackRemoveFromCart` | Before `removeItem` |
| Cart page mount | (push raw `view_cart` to dataLayer) | useEffect when items.length > 0 |
| Checkout page mount | `trackInitiateCheckout` | useEffect on items |
| Payment method picked | `trackAddPaymentInfo` | onChange of payment selector |
| Order placed (success) | `trackPurchase` | After API confirms order |
| Contact form sent | `trackLead` | After successful submit |
| Search submitted | `trackSearch` | useEffect in ShopPage when a `?search=` term is present (fires once per query) |

**All 12 events above are already wired in this template** — copy the folder and you inherit the full funnel. The base FB Pixel + GTM + GA4 dataLayer scripts are injected globally by `DeferredAnalytics` (in the shared site layout), so they fire for every theme automatically — never add pixel/GTM tags inside a theme.

```ts
import { trackAddToCart, trackViewContent /* etc. */ } from "@/lib/analytics";
```

### 5. Responsive — mobile-first

Theme must work at 320px–1920px+. Use Tailwind-style breakpoints in CSS:

```css
:where(.theme-my-id) .grid { grid-template-columns: 1fr; }              /* mobile */
@media (min-width: 640px)  { :where(.theme-my-id) .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 960px)  { :where(.theme-my-id) .grid { grid-template-columns: repeat(4, 1fr); } }
```

Touch targets ≥ 44×44px. Navbar must collapse to a drawer below 960px.

### 6. Engine type contracts

Each page receives strongly-typed props from the engine. Don't redefine the shape — import + use:

```ts
import type {
  HomePageProps,
  ShopPageProps,
  ProductPageProps,
  CartPageProps,
  CheckoutPageProps,
  AboutPageProps,
  ContactPageProps,
  PrivacyPageProps,
  TermsPageProps,
  RefundPageProps,
  BlogListingPageProps,
  BlogPostPageProps,
  NavbarProps,
  FooterProps,
  CartDrawerProps,
} from "@/storefront-engine/types/pages";
```

Server-side data (products, reviews, sections, blog posts) arrives via these props — your component just renders.

### 7. Images: tenant uploads + fallbacks

- Product images: `product.image` from props (already an absolute URL or `/storage/...`)
- For external URLs (`://` or `/storage/`), pass `unoptimized` to `<Image>`
- Editorial / hero / category images: wrap in `<Editable type="image">` with a placeholder URL as default

```tsx
<Image
  src={product.image || "/placeholder.svg"}
  alt={product.name}
  fill
  unoptimized={product.image?.startsWith("/storage/") || product.image?.includes("://")}
/>
```

### 8. Registration steps (after copying files)

**`src/storefront-engine/registry.ts`** — add to V2 registry:

```ts
import ecomTheme from "@/themes/shopkart/manifest";

export const STOREFRONT_THEMES_V2 = [
  defaultTheme,
  goCartTheme,
  conhaTheme,
  sahalanTheme,
  ecomTheme,         // ← add here
];
```

That's it. The V2 registry (`STOREFRONT_THEMES_V2`) is the single source of truth —
the `/dashboard/themes` picker reads its metadata (id / label / description / tags /
preview / isDefault) directly, so a new manifest shows up in the picker automatically.
(The old `src/lib/storefront-themes/` metadata registry was removed — don't recreate it.)

## Don't do

- ❌ Hardcode tenant-specific copy ("Welcome to Beauty Co"). Use `settings.site_name` + `<Editable>`.
- ❌ Hardcode prices, phone numbers, addresses. Read from `useSiteSettings()`.
- ❌ Import from `app/` or `lib/prisma*` — that's enforced by `.eslintrc.themes.cjs`.
- ❌ Import from another theme. Themes are isolated.
- ❌ Add tracking pixels directly. Always use `@/lib/analytics` — it dispatches to FB + GA4 + datalayer + Sentry-friendly.
- ❌ Reproduce another site's design verbatim. Themes ship to all tenants — IP risk falls on the platform.
- ❌ Skip `:where(.theme-<id>)` scoping. Unscoped CSS leaks to dashboard / other themes.

## Verifying locally before handoff

```bash
# From repo root
npm run build              # must complete without errors
# Then visit:
#   /dashboard/themes        → confirm theme appears in picker, preview loads
#   Pick the theme as tenant → visit /, /shop, /products/<slug>, /cart, /checkout
#   Toggle edit mode → confirm every <Editable> field can be edited inline
#   DevTools mobile view (320–960px) → no horizontal scroll, no clipped text
```

## Reference themes

Three production themes already live in `src/themes/`:

- `default/` — bilingual, BD-market ecommerce, comprehensive
- `go-cart/` — bright modern, all slot coverage
- `sahalan/` — editorial luxury, cream/navy/gold palette

Read them for patterns. `sahalan/` is the closest mirror of this template.

## Questions

When stuck on engine integration (slots, props, registration), read:
- `src/storefront-engine/types.ts` — manifest schema
- `src/storefront-engine/types/pages.ts` — per-page props
- `src/storefront-engine/editor/Editable.tsx` — inline edit contract
- `src/lib/analytics.ts` — full list of `track*` functions
# theme_like_ghorerbazar-ecom
