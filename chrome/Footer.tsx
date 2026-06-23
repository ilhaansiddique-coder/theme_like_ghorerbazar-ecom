"use client";

import Link from "next/link";
import { FaFacebookF, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";
import { FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import { Editable } from "@/storefront-engine/editor/Editable";
import { useLang, t } from "../components/lang";
import ReveChat from "./ReveChat";
import "../styles.css";

// Footer link columns — mirror the reference layout (Information / Shop By /
// Support / Consumer Policy). All targets are real routes the theme ships, so
// every link resolves.
const COLUMNS = [
  {
    en: "Information", bn: "তথ্য", links: [
      { href: "/about",   en: "About Us",            bn: "আমাদের কথা" },
      { href: "/contact", en: "Contact Us",          bn: "যোগাযোগ" },
      { href: "/about",   en: "Company Information",  bn: "কোম্পানি তথ্য" },
      { href: "/blog",    en: "Our Stories",         bn: "আমাদের গল্প" },
      { href: "/terms",   en: "Terms & Conditions",  bn: "শর্তাবলী" },
      { href: "/privacy", en: "Privacy Policy",      bn: "প্রাইভেসি পলিসি" },
      { href: "/contact", en: "Careers",             bn: "ক্যারিয়ার" },
    ],
  },
  {
    en: "Shop By", bn: "শপ", links: [
      { href: "/shop?category=oil-ghee",       en: "Oil & Ghee",      bn: "তেল ও ঘি" },
      { href: "/shop?category=honey",          en: "Honey",           bn: "মধু" },
      { href: "/shop?category=dates",          en: "Dates",           bn: "খেজুর" },
      { href: "/shop?category=spices",         en: "Spices",          bn: "মসলা" },
      { href: "/shop?category=nuts-seeds",     en: "Nuts & Seeds",    bn: "বাদাম ও বীজ" },
      { href: "/shop?category=beverage",       en: "Beverage",        bn: "পানীয়" },
      { href: "/shop?category=functional-food", en: "Functional Foods", bn: "ফাংশনাল ফুড" },
    ],
  },
  {
    en: "Support", bn: "সহায়তা", links: [
      { href: "/contact",     en: "Support Center", bn: "সাপোর্ট সেন্টার" },
      { href: "/about",       en: "How to Order",   bn: "যেভাবে অর্ডার করবেন" },
      { href: "/track-order", en: "Order Tracking", bn: "অর্ডার ট্র্যাকিং" },
      { href: "/about",       en: "Payment",        bn: "পেমেন্ট" },
      { href: "/about",       en: "Shipping",       bn: "শিপিং" },
      { href: "/contact",     en: "FAQ",            bn: "প্রশ্নোত্তর" },
    ],
  },
  {
    en: "Consumer Policy", bn: "কনজিউমার পলিসি", links: [
      { href: "/refund",  en: "Happy Return",   bn: "হ্যাপি রিটার্ন" },
      { href: "/refund",  en: "Refund Policy",  bn: "রিফান্ড পলিসি" },
      { href: "/refund",  en: "Exchange",       bn: "এক্সচেঞ্জ" },
      { href: "/refund",  en: "Cancellation",   bn: "ক্যান্সেলেশন" },
      { href: "/shop",    en: "Pre-Order",      bn: "প্রি-অর্ডার" },
      { href: "/shop",    en: "Extra Discount", bn: "এক্সট্রা ডিসকাউন্ট" },
    ],
  },
];

export default function Footer() {
  const settings = useSiteSettings();
  const brand = settings.site_name || "Brand";
  const { lang } = useLang();
  const year = new Date().getFullYear();
  const social = settings as typeof settings & {
    facebook?: string; instagram?: string; youtube?: string; twitter?: string;
    android?: string; ios?: string;
    address?: string; phone?: string; email?: string;
  };
  const address = social.address || "Dhaka, Bangladesh";
  const phone = social.phone || "01XXX-XXXXXX";
  const email = social.email || `contact@${brand.toLowerCase().replace(/\s+/g, "")}.com`;

  return (
    <footer className="tpl-foot">
      <div className="tpl-foot__top">
        {/* Brand + app download */}
        <div className="tpl-foot__brand">
          <h4>{brand}</h4>
          <Editable section="footer" field="tagline" defaultValue={t(lang, "100% pure, organic & safe food — sourced from trusted farmers and delivered fresh to your door.", "100% খাঁটি, অর্গানিক ও নিরাপদ খাবার — বিশ্বস্ত কৃষকের কাছ থেকে সংগ্রহ করে আপনার দরজায় পৌঁছে দিই।")} label="Footer tagline">
            {(v, ep) => <p {...ep}>{v}</p>}
          </Editable>

          <ul className="tpl-foot__contact">
            <li><FiMapPin size={15} /><span>{address}</span></li>
            <li><a href={`tel:${phone.replace(/\s+/g, "")}`}><FiPhone size={15} /><span>{phone}</span></a></li>
            <li><a href={`mailto:${email}`}><FiMail size={15} /><span>{email}</span></a></li>
          </ul>

          <div className="tpl-foot__social">
            <a href={social.facebook || "#"} aria-label="Facebook"><FaFacebookF size={15} /></a>
            <a href={social.twitter || "#"} aria-label="Twitter"><FaTwitter size={15} /></a>
            <a href={social.instagram || "#"} aria-label="Instagram"><FaInstagram size={16} /></a>
            {social.youtube && <a href={social.youtube} aria-label="YouTube"><FaYoutube size={16} /></a>}
          </div>

          <p className="tpl-foot__applabel">{t(lang, "Download App on Mobile", "মোবাইলে অ্যাপ ডাউনলোড করুন")} :</p>
          <div className="tpl-foot__apps">
            <a href={social.android || "#"} className="tpl-foot__app" aria-label="Get it on Google Play">
              <img src="/google-play.svg" alt="Get it on Google Play" />
            </a>
            <a href={social.ios || "#"} className="tpl-foot__app" aria-label="Download on the App Store">
              <img src="/app-store.svg" alt="Download on the App Store" />
            </a>
          </div>
        </div>

        {/* Link columns */}
        <div className="tpl-foot__cols">
          {COLUMNS.map((col) => (
            <div className="tpl-foot__col" key={col.en}>
              <h4>{t(lang, col.en, col.bn)}</h4>
              {col.links.map((l, i) => (
                <Link key={`${l.href}-${i}`} href={l.href}>{t(lang, l.en, l.bn)}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="tpl-foot__copy">© {year} {brand}. {t(lang, "All rights reserved.", "সর্বস্বত্ব সংরক্ষিত।")}</p>

      {/* Global green-themed REVE Chat launcher (fixed, shows on every page) */}
      <ReveChat />
    </footer>
  );
}
