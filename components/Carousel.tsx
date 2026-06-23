"use client";

/**
 * Horizontal scroll carousel with pagination dots (page-based, responsive).
 * Children are laid out in a scroll-snap rail; the dot count = number of pages
 * (scrollWidth / clientWidth) and the active dot tracks scroll position. Clicking
 * a dot scrolls to that page. Item widths are set in CSS via `.tpl-caro__rail`.
 */

import { useEffect, useRef, useState } from "react";

export default function Carousel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const cw = el.clientWidth || 1;
      setPages(Math.max(1, Math.round(el.scrollWidth / cw)));
      setActive(Math.round(el.scrollLeft / cw));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, [children]);

  const go = (i: number) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="tpl-caro">
      <div className={`tpl-caro__rail ${className}`.trim()} ref={ref}>{children}</div>
      {pages > 1 && (
        <div className="tpl-caro__dots">
          {Array.from({ length: pages }).map((_, i) => (
            <button key={i} type="button" className={i === active ? "is-on" : ""} aria-label={`Page ${i + 1}`} aria-current={i === active} onClick={() => go(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
