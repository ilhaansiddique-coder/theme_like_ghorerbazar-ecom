/**
 * Brand catalogue — ORIGINAL house/partner brands (no real third-party
 * trademarks). Each carries an emblem `key` + `color` so the logo is rendered
 * as original SVG artwork (see BrandLogo.tsx) on both the Home strip and the
 * Brands pages — one consistent, IP-clean source of truth.
 *
 * Products associate to a brand via an optional `brand_slug` field.
 */

export interface Brand {
  name: string;   // full display name
  a: string;      // wordmark — first part (ink)
  b: string;      // wordmark — second part (brand colour)
  slug: string;
  color: string;
  key: string;    // emblem icon id (see BrandLogo.tsx ICONS)
  blurb?: string;
}

export const BRANDS: Brand[] = [
  { name: "PureLeaf",     a: "Pure",    b: "Leaf",    slug: "pureleaf",    color: "#1f8a3c", key: "leaf",     blurb: "Cold-pressed oils & pure ghee from trusted farms." },
  { name: "GoldenBee",    a: "Golden",  b: "Bee",     slug: "goldenbee",   color: "#e0a416", key: "hex",      blurb: "Raw, unfiltered honey full of natural goodness." },
  { name: "Orchard & Co", a: "Orchard", b: "&Co",     slug: "orchard",     color: "#3f7d3a", key: "tree",     blurb: "Premium dates & dried fruit, naturally sweet." },
  { name: "SaffronMill",  a: "Saffron", b: "Mill",    slug: "saffronmill", color: "#e8552d", key: "wheat",    blurb: "Stone-ground spices with bold, honest flavour." },
  { name: "NutriVana",    a: "Nutri",   b: "Vana",    slug: "nutrivana",   color: "#0e9aa7", key: "drop",     blurb: "Functional foods & superfood blends for daily wellness." },
  { name: "SunHarvest",   a: "Sun",     b: "Harvest", slug: "sunharvest",  color: "#d99a09", key: "sun",      blurb: "Fresh teas, coffee & everyday beverages." },
  { name: "TerraNut",     a: "Terra",   b: "Nut",     slug: "terranut",    color: "#8a5a2b", key: "seed",     blurb: "Roasted nuts & seeds — protein-packed and crunchy." },
  { name: "HimaPure",     a: "Hima",    b: "Pure",    slug: "himapure",    color: "#2e7d8a", key: "mountain", blurb: "Clean staples — flours, lentils & grains." },
];

export function findBrand(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
}
