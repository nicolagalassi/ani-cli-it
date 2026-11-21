import type { CSSProperties } from "react";

// "Ridipintura": every series paints its page with its own cel colour, taken
// from AniList's cover colour. CSS normalises it to one lightness/chroma band
// (see .painted in styles.css), so ink text always reads on it. Series without
// an AniList colour get a stable fallback paint derived from the slug.

const KEY = "animix:paint:";
const NONE = "-";
const FALLBACK = ["#e4a143", "#4393e4", "#e45dc9", "#50c9a0", "#f19328", "#8f7cf0", "#d65c5c", "#5dbbf1"];

export function fallbackPaint(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return FALLBACK[Math.abs(h) % FALLBACK.length];
}

function read(slug: string): string | null {
  try {
    return localStorage.getItem(KEY + slug);
  } catch {
    return null;
  }
}

// cached paint for a slug (AniList colour or fallback), without any lookup
export function cachedPaint(slug: string): string | null {
  const v = read(slug);
  if (v == null) return null;
  return v === NONE ? fallbackPaint(slug) : v;
}

export function rememberPaint(slug: string, color: string | null | undefined) {
  try {
    localStorage.setItem(KEY + slug, color || NONE);
  } catch {
    // storage unavailable: paint is recomputed next time
  }
}

// paint for a series; looks AniList up once and caches the answer
export async function resolvePaint(slug: string, malId: string | number | null | undefined): Promise<string> {
  const cached = cachedPaint(slug);
  if (cached) return cached;
  if (malId == null) return fallbackPaint(slug);
  const media = await window.ani.alByMalId(malId).catch(() => null);
  const color = media?.coverImage?.color ?? null;
  rememberPaint(slug, color);
  return color ?? fallbackPaint(slug);
}

// inline style that feeds a .painted element its source colour
export function paintVar(color: string | null | undefined): CSSProperties | undefined {
  return color ? ({ "--paint-src": color } as CSSProperties) : undefined;
}
