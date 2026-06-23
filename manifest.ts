/**
 * ShopKart — a clean organic-grocery / natural-food marketplace
 * theme. Soft grey app background, white rounded cards, a fresh-green accent
 * for prices, CTAs and deal badges, plus a free-delivery announcement bar.
 *
 * Every slot you omit falls back to the default theme. Required slots for
 * a usable storefront:
 *   home, shop, product, cart, checkout + navbar, footer, cartDrawer.
 */

import type { StorefrontThemeV2 } from "@/storefront-engine/types";

const ecomTheme: StorefrontThemeV2 = {
  id: "shopkart",
  label: "ShopKart",
  description: "Clean organic-grocery storefront — fresh-green accents, deal badges, bold prices, mobile-first.",
  tags: ["Grocery", "Organic", "Marketplace", "Mobile-first"],

  pages: {
    loadHomePage:     () => import("./pages/HomePage").then((m) => m.default),
    loadShopPage:     () => import("./pages/ShopPage").then((m) => m.default),
    loadProductPage:  () => import("./pages/ProductPage").then((m) => m.default),
    loadCartPage:     () => import("./pages/CartPage").then((m) => m.default),
    loadCheckoutPage: () => import("./pages/CheckoutPage").then((m) => m.default),
    loadAboutPage:    () => import("./pages/AboutPage").then((m) => m.default),
    loadContactPage:  () => import("./pages/ContactPage").then((m) => m.default),
    loadPrivacyPage:  () => import("./pages/PolicyPages").then((m) => m.PrivacyPage),
    loadTermsPage:    () => import("./pages/PolicyPages").then((m) => m.TermsPage),
    loadRefundPage:   () => import("./pages/PolicyPages").then((m) => m.RefundPage),
    loadBlogPage:     () => import("./pages/BlogPage").then((m) => m.default),
    loadBlogPostPage: () => import("./pages/BlogPage").then((m) => m.BlogPostPage),
    // Customer-facing extras this theme ships beyond the core slots.
    loadAccountPage:    () => import("./pages/AccountPage").then((m) => m.default),
    loadBrandsPage:     () => import("./pages/BrandsPage").then((m) => m.default),
    loadLivePage:       () => import("./pages/LivePage").then((m) => m.default),
    loadTrackOrderPage: () => import("./pages/TrackOrderPage").then((m) => m.default),
  },

  chrome: {
    loadNavbar:     () => import("./chrome/Navbar").then((m) => m.default),
    loadFooter:     () => import("./chrome/Footer").then((m) => m.default),
    loadCartDrawer: () => import("./chrome/CartDrawer").then((m) => m.default),
  },
};

export default ecomTheme;
