import type { Episode, HistoryEntry } from "../types";

// an episode counts as finished past this fraction (same threshold as the AniList sync)
export const FINISHED_AT = 0.9;

// AnimeWorld lists dubbed series separately: their slug ends in "-ita.<id>" and
// their title in "(ITA)"
export function isDub(slug: string, title?: string | null): boolean {
  return /-ita\.[^./]+$/.test(slug) || /\(ITA\)\s*$/.test(title ?? "");
}

// highest episode number opened for a history entry
export function lastWatched(h: HistoryEntry): number | null {
  const nums = [...h.watched, h.lastEp ?? ""]
    .map((e) => parseFloat(e))
    .filter((n) => !Number.isNaN(n));
  return nums.length ? Math.max(...nums) : null;
}

export function isFinished(h: HistoryEntry): boolean {
  return h.duration > 0 && h.position / h.duration >= FINISHED_AT;
}

// how many released episodes come after the last one opened (0 = up to date)
export function newCount(h: HistoryEntry, released: number | null | undefined): number {
  const seen = lastWatched(h);
  if (released == null || seen == null || released <= seen) return 0;
  return Math.max(1, Math.floor(released) - Math.floor(seen));
}

export type NextKind = "start" | "resume" | "next" | "rewatch";
export interface NextEpisode {
  ep: Episode;
  kind: NextKind;
}

// what "play" means for a series: resume an unfinished episode, otherwise the
// one after it in list order; "rewatch" when the last released one is done
export function nextEpisode(entry: HistoryEntry | null, eps: Episode[]): NextEpisode | null {
  if (eps.length === 0) return null;
  if (!entry || !entry.lastEp) return { ep: eps[0], kind: "start" };
  const idx = eps.findIndex((e) => e.num === entry.lastEp);
  if (idx < 0) {
    const seen = lastWatched(entry) ?? 0;
    const after = eps.find((e) => parseFloat(e.num) > seen);
    return after ? { ep: after, kind: "next" } : { ep: eps[eps.length - 1], kind: "rewatch" };
  }
  if (!isFinished(entry)) return { ep: eps[idx], kind: "resume" };
  if (idx + 1 < eps.length) return { ep: eps[idx + 1], kind: "next" };
  return { ep: eps[idx], kind: "rewatch" };
}

export function nextLabel(n: NextEpisode): string {
  switch (n.kind) {
    case "start":
      return `Inizia dall'episodio ${n.ep.num}`;
    case "resume":
      return `Riprendi l'episodio ${n.ep.num}`;
    case "next":
      return `Guarda l'episodio ${n.ep.num}`;
    case "rewatch":
      return `Rivedi l'episodio ${n.ep.num}`;
  }
}

// 0 -> "0:00", 754 -> "12:34", 3725 -> "1:02:05"
export function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return (h > 0 ? h + ":" : "") + mm + ":" + String(sec).padStart(2, "0");
}

// two-digit numeral for display ("5" -> "05"; "12.5" and "1158" unchanged)
export function epNumeral(num: string): string {
  return /^\d$/.test(num) ? "0" + num : num;
}
