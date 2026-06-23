"use client";

/**
 * Original brand logos — inline-SVG emblem (rounded badge + simple original
 * icon) + two-tone wordmark. Used by the Home "Our Brands" strip and the
 * Brands pages so both render the same original artwork. Data lives in brands.ts.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import type { Brand } from "./brands";

const ICONS: Record<string, ReactNode> = {
  leaf:     <path d="M13 27c0-8 6-14 14-14 0 8-6 14-14 14z" />,
  hex:      <path d="M20 9l9 5v12l-9 5-9-5V14z" />,
  tree:     <><circle cx="20" cy="16" r="7" /><rect x="18.5" y="21" width="3" height="9" rx="1.5" /></>,
  wheat:    <><ellipse cx="14" cy="20" rx="2.4" ry="7" /><ellipse cx="20" cy="20" rx="2.4" ry="7" /><ellipse cx="26" cy="20" rx="2.4" ry="7" /></>,
  drop:     <path d="M20 10c4 6 7 9 7 13a7 7 0 1 1-14 0c0-4 3-7 7-13z" />,
  seed:     <ellipse cx="20" cy="20" rx="6" ry="9" />,
  mountain: <path d="M8 30l7-12 5 7 4-6 8 11z" />,
};

export function Emblem({ k, color, size = 34 }: { k: string; color: string; size?: number }) {
  return (
    <svg className="tpl-brandlogo__mark" viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill={color} />
      {k === "sun" ? (
        <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="20" cy="20" r="5.5" fill="#fff" stroke="none" />
          <line x1="20" y1="6" x2="20" y2="9.5" /><line x1="20" y1="30.5" x2="20" y2="34" />
          <line x1="6" y1="20" x2="9.5" y2="20" /><line x1="30.5" y1="20" x2="34" y2="20" />
          <line x1="10" y1="10" x2="12.5" y2="12.5" /><line x1="27.5" y1="27.5" x2="30" y2="30" />
          <line x1="30" y1="10" x2="27.5" y2="12.5" /><line x1="12.5" y1="27.5" x2="10" y2="30" />
        </g>
      ) : (
        <g fill="#fff">{ICONS[k]}</g>
      )}
    </svg>
  );
}

export function BrandLogo({ m }: { m: Brand }) {
  return (
    <Link href={`/brand/${m.slug}`} className="tpl-brands__card" aria-label={m.name}>
      <span className="tpl-brandlogo">
        <Emblem k={m.key} color={m.color} />
        <span className="tpl-brandlogo__name">{m.a}<b style={{ color: m.color }}>{m.b}</b></span>
      </span>
    </Link>
  );
}
