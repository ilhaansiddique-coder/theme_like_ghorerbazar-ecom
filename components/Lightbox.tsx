"use client";

/**
 * Lightbox — a self-contained, dependency-free fullscreen image gallery used by
 * the product page. Replicates the PhotoSwipe-style feature set requested for
 * the theme without pulling in a third-party library (so it ships inside the
 * theme files):
 *
 *   • Counter (current / total) top-left.
 *   • Toolbar top-right: Zoom · Slideshow play/pause · Thumbnails toggle · Close.
 *   • Manual sliding: prev/next arrows, keyboard ◀ ▶, Esc to close, touch swipe.
 *   • Automatic sliding: play button starts a ~3s looping slideshow; press again
 *     to pause. Works on desktop, tablet and mobile.
 *   • Thumbnail strip (toggled) with the active thumb in the accent orange.
 *   • Tap / click to zoom (2×). Dark translucent backdrop, body scroll-lock,
 *     focus moved to Close on open and restored on close, reduced-motion safe.
 *
 * Fully controlled by the parent's `index` so the page's main image stays in
 * sync after the lightbox closes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiX, FiZoomIn, FiZoomOut, FiPlay, FiPause, FiGrid,
  FiChevronLeft, FiChevronRight,
} from "react-icons/fi";

type Props = {
  images: string[];
  index: number;
  alt?: string;
  onIndex: (i: number) => void;
  onClose: () => void;
};

export default function Lightbox({ images, index, alt = "", onIndex, onClose }: Props) {
  const n = images.length;
  const [zoom, setZoom] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [thumbs, setThumbs] = useState(false);

  // Latest index for interval/keyboard closures.
  const idxRef = useRef(index);
  idxRef.current = index;
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevActive = useRef<Element | null>(null);

  const go = useCallback((dir: 1 | -1) => {
    setZoom(false);
    onIndex((idxRef.current + dir + n) % n);
  }, [n, onIndex]);

  const jump = useCallback((i: number) => {
    setZoom(false);
    onIndex(((i % n) + n) % n);
  }, [n, onIndex]);

  // Open: lock body scroll + move focus to Close; restore both on unmount.
  useEffect(() => {
    prevActive.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      (prevActive.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  // Keyboard: arrows navigate, Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Autoplay slideshow (~3s), looping, while `playing`.
  useEffect(() => {
    if (!playing || n <= 1) return;
    const id = setInterval(() => onIndex((idxRef.current + 1) % n), 3000);
    return () => clearInterval(id);
  }, [playing, n, onIndex]);

  // Touch swipe (mobile / tablet).
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null || n <= 1) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  const src = images[index] || images[0];

  return (
    <div className="tpl-lb" role="dialog" aria-modal="true" aria-label={alt || "Image gallery"}>
      <button className="tpl-lb__backdrop" aria-label="Close gallery" tabIndex={-1} onClick={onClose} />

      <div className="tpl-lb__counter">{index + 1} / {n}</div>

      <div className="tpl-lb__toolbar">
        <button type="button" className={`tpl-lb__tool${zoom ? " is-on" : ""}`} onClick={() => setZoom((z) => !z)} aria-label={zoom ? "Zoom out" : "Zoom in"} aria-pressed={zoom}>
          {zoom ? <FiZoomOut size={18} /> : <FiZoomIn size={18} />}
        </button>
        {n > 1 && (
          <button type="button" className={`tpl-lb__tool${playing ? " is-on" : ""}`} onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause slideshow" : "Play slideshow"} aria-pressed={playing}>
            {playing ? <FiPause size={18} /> : <FiPlay size={18} />}
          </button>
        )}
        {n > 1 && (
          <button type="button" className={`tpl-lb__tool${thumbs ? " is-on" : ""}`} onClick={() => setThumbs((t) => !t)} aria-label="Toggle thumbnails" aria-pressed={thumbs}>
            <FiGrid size={18} />
          </button>
        )}
        <button ref={closeRef} type="button" className="tpl-lb__tool" onClick={onClose} aria-label="Close gallery">
          <FiX size={20} />
        </button>
      </div>

      <div className="tpl-lb__stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {n > 1 && (
          <button type="button" className="tpl-lb__arrow tpl-lb__arrow--prev" onClick={() => go(-1)} aria-label="Previous image">
            <FiChevronLeft size={26} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`tpl-lb__img${zoom ? " is-zoom" : ""}`}
          onClick={() => setZoom((z) => !z)}
          draggable={false}
        />
        {n > 1 && (
          <button type="button" className="tpl-lb__arrow tpl-lb__arrow--next" onClick={() => go(1)} aria-label="Next image">
            <FiChevronRight size={26} />
          </button>
        )}
      </div>

      {thumbs && n > 1 && (
        <div className="tpl-lb__thumbs">
          {images.map((img, i) => (
            <button key={i} type="button" className={`tpl-lb__thumb${i === index ? " is-active" : ""}`} onClick={() => jump(i)} aria-label={`Go to image ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
