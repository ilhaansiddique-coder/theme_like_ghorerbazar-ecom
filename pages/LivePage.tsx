"use client";

/**
 * ShopKart — Live streaming page (matches the reference app's
 * "live" tab). Logged-out notice + Recommended / Popular tabs + a 2-column
 * grid of live cards (LIVE badge, view count, title overlay).
 *
 * Not a standard engine slot — this lives in the theme so it can be wired to a
 * /live route when the platform exposes live shopping.
 */

import { useState } from "react";
import Link from "next/link";
import { FiRadio } from "react-icons/fi";
import { Editable } from "@/storefront-engine/editor/Editable";
import "../styles.css";

export interface LiveStream {
  id: number;
  title: string;
  views: number;
  cover?: string;
  productSlug?: string;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")} million views`;
  return `${n.toLocaleString()} views`;
}

export default function LivePage({ streams = [] }: { streams?: LiveStream[] }) {
  const [tab, setTab] = useState<"recommend" | "popular">("recommend");

  return (
    <div className="tpl-live">
      <Editable section="live" field="title" defaultValue="Live streams I'm following" label="Live title">
        {(v, ep) => <h1 {...ep} style={{ fontSize: 18, fontWeight: 800, margin: "6px 4px 12px" }}>{v}</h1>}
      </Editable>

      <div className="tpl-panel tpl-live__notice">
        <Editable section="live" field="loginTitle" defaultValue="You are not logged in yet." label="Login notice title">
          {(v, ep) => <b {...ep}>{v}</b>}
        </Editable>
        <Editable section="live" field="loginBody" defaultValue="Log in to view updates from the live streams you follow." label="Login notice body">
          {(v, ep) => <p {...ep}>{v}</p>}
        </Editable>
        <Link href="/account" className="tpl-btn" style={{ width: "100%" }}>Log in</Link>
      </div>

      <div className="tpl-tabs" style={{ marginTop: 10 }}>
        <button type="button" className={`tpl-tab ${tab === "recommend" ? "tpl-tab--active" : ""}`} onClick={() => setTab("recommend")}>
          <Editable section="live" field="tabRecommend" defaultValue="Recommended" label="Recommend tab">
            {(v, ep) => <span {...ep}>{v}</span>}
          </Editable>
        </button>
        <button type="button" className={`tpl-tab ${tab === "popular" ? "tpl-tab--active" : ""}`} onClick={() => setTab("popular")}>
          <Editable section="live" field="tabPopular" defaultValue="Popular outfits" label="Popular tab">
            {(v, ep) => <span {...ep}>{v}</span>}
          </Editable>
        </button>
      </div>

      <div className="tpl-live__grid">
        {streams.map((s) => {
          const inner = (
            <>
              {s.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.cover} alt="" />
              )}
              <span className="tpl-livecard__overlay" />
              <span className="tpl-livecard__badge">
                <span className="tpl-livecard__live"><FiRadio size={11} /> LIVE</span>
                <span className="tpl-livecard__views">{formatViews(s.views)}</span>
              </span>
              <span className="tpl-livecard__wm">LIVE</span>
              <span className="tpl-livecard__name">{s.title}</span>
            </>
          );
          return s.productSlug ? (
            <Link key={s.id} href={`/products/${s.productSlug}`} className="tpl-livecard">{inner}</Link>
          ) : (
            <div key={s.id} className="tpl-livecard">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
