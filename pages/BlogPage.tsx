"use client";

import Image from "next/image";
import Link from "next/link";
import { FiEdit3 } from "react-icons/fi";
import type { BlogListingPageProps, BlogPostPageProps } from "@/storefront-engine/types/pages";
import { Editable } from "@/storefront-engine/editor/Editable";
import { sanitizeRichText } from "@/lib/sanitize-html";
import "../styles.css";

/* ─── Listing ───────────────────────────────────────────────────── */
export default function BlogPage({ posts }: BlogListingPageProps) {
  return (
    <div className="tpl-page">
      <section className="tpl-pagehero">
        <span className="tpl-pagehero__pill"><FiEdit3 size={12} /> Our blog</span>
        <Editable section="blog" field="title" defaultValue="Blog" label="Blog title">
          {(v, ep) => <h1 {...ep}>{v}</h1>}
        </Editable>
        <Editable section="blog" field="subtitle" defaultValue="Tips, guides and stories from our team." label="Blog subtitle">
          {(v, ep) => <p {...ep}>{v}</p>}
        </Editable>
      </section>

      {posts.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--tpl-muted)", padding: "48px 0" }}>
          Our blog is coming soon — check back for great content.
        </p>
      ) : (
        <div className="tpl-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="tpl-card">
              <div className="tpl-card__media" style={{ aspectRatio: "16 / 10" }}>
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.title}
                    width={600}
                    height={400}
                    unoptimized={p.image.startsWith("/storage/") || p.image.includes("://")}
                  />
                ) : <div style={{ width: "100%", height: "100%", background: "var(--tpl-line)" }} />}
              </div>
              <div className="tpl-card__body">
                <small style={{ color: "var(--tpl-muted)", fontSize: 11 }}>
                  {new Date(p.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} · {p.author_name}
                </small>
                <h3 className="tpl-card__name" style={{ fontSize: 16, WebkitLineClamp: 2 }}>{p.title}</h3>
                {p.excerpt && <p style={{ color: "var(--tpl-muted)", fontSize: 13, lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Single post ──────────────────────────────────────────────── */
export function BlogPostPage({ post, related }: BlogPostPageProps) {
  return (
    <article className="tpl-page" style={{ maxWidth: 800 }}>
      <div className="tpl-panel" style={{ padding: "28px 24px" }}>
        <p style={{ color: "var(--tpl-muted)", fontSize: 12, marginTop: 0 }}>
          {new Date(post.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} · {post.author_name}
        </p>
        <h1 style={{ fontSize: 28, margin: "4px 0 24px", fontWeight: 800, lineHeight: 1.3 }}>{post.title}</h1>

        {post.image && (
          <div style={{ aspectRatio: "16 / 9", overflow: "hidden", background: "var(--tpl-line)", marginBottom: 24, borderRadius: "var(--tpl-radius-sm)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        <div
          style={{ color: "var(--tpl-ink)", lineHeight: 1.8, fontSize: 15 }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(post.content) }}
        />
      </div>

      {related.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div className="tpl-head">
            <span className="tpl-head__bar" />
            <h2 style={{ fontSize: 18, margin: 0, fontWeight: 800 }}>More posts</h2>
          </div>
          <div className="tpl-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {related.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="tpl-card">
                <div className="tpl-card__media" style={{ aspectRatio: "16 / 10" }}>
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.title}
                      width={400}
                      height={250}
                      unoptimized={p.image.startsWith("/storage/") || p.image.includes("://")}
                    />
                  ) : <div style={{ width: "100%", height: "100%", background: "var(--tpl-line)" }} />}
                </div>
                <div className="tpl-card__body">
                  <h3 className="tpl-card__name">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
