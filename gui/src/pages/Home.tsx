import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Compass, Play, Search } from "lucide-react";
import { useActive, useNav, usePlaySeries } from "../App";
import { Card, CardSkeletons, Poster, Tag } from "../components/Card";
import { ContinueCard } from "../components/ContinueCard";
import { LatestCard } from "../components/LatestCard";
import {
  epNumeral,
  fmtTime,
  isDub,
  isFinished,
  lastWatched,
  newCount,
  nextEpisode,
  nextLabel,
  type NextEpisode,
} from "../lib/episodes";
import { cachedPaint, fallbackPaint, paintVar, resolvePaint } from "../lib/paint";
import type { AniListEntry, AniListStatus, Episode, HistoryEntry, LatestItem, Mode } from "../types";

type SectionId = "continue" | "latest" | "anilist";
const DEFAULT_ORDER: SectionId[] = ["continue", "latest", "anilist"];
const SECTION_NAMES: Record<SectionId, string> = {
  continue: "Da vedere ora e Continua a guardare",
  latest: "Ultime uscite",
  anilist: "In visione su AniList",
};
const RECENT = 24; // history entries checked for new episodes
const LEAD_SIDE = 4; // new-episode cards beside the lead panel

// statuses offered under the "In visione su AniList" cards
const AL_STATUSES: { value: AniListStatus; label: string }[] = [
  { value: "CURRENT", label: "In visione" },
  { value: "COMPLETED", label: "Completato" },
  { value: "PAUSED", label: "In pausa" },
  { value: "DROPPED", label: "Abbandonato" },
  { value: "PLANNING", label: "Da vedere" },
];

interface Fresh {
  h: HistoryEntry;
  n: number; // released episodes after the last one opened
}

interface Lead {
  slug: string;
  paint: string;
  next: NextEpisode | null;
  newEps: Episode[]; // released after the last one opened, playable directly
}

function newLabel(f: Fresh, released: number | null | undefined) {
  return f.n === 1 ? `Ep ${released} nuovo` : `${f.n} nuovi`;
}

function continueLine(h: HistoryEntry, released: number | null | undefined): string {
  if (!h.lastEp) return "Da iniziare";
  if (!isFinished(h)) {
    return h.duration ? `Ep ${h.lastEp} · ${fmtTime(h.position)} / ${fmtTime(h.duration)}` : `Ep ${h.lastEp}`;
  }
  const seen = lastWatched(h);
  if (released != null && seen != null && released <= seen) return `Ep ${h.lastEp} · in pari`;
  return `Ep ${h.lastEp} · finito`;
}

export function Home() {
  const { go, viewer } = useNav();
  const active = useActive();
  const playSeries = usePlaySeries();
  const [hist, setHist] = useState<HistoryEntry[] | null>(null);
  const [released, setReleased] = useState<Record<string, number | null>>({});
  const [mode, setMode] = useState<Mode>("sub");
  const [latest, setLatest] = useState<LatestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestError, setLatestError] = useState(false);
  const [morePage, setMorePage] = useState(1); // next /updated page to read
  const [loadingMore, setLoadingMore] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [statusBusy, setStatusBusy] = useState<number | null>(null);
  const [watching, setWatching] = useState<AniListEntry[]>([]);
  const [order, setOrder] = useState<SectionId[]>(DEFAULT_ORDER);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [query, setQuery] = useState("");
  const [latestTry, setLatestTry] = useState(0); // bump to refetch after an error

  // overlapping reloads: only the latest one may write state
  const reloadId = useRef(0);
  function reloadHistory() {
    const id = ++reloadId.current;
    window.ani.history().then((h) => {
      if (id !== reloadId.current) return;
      setHist(h);
      // check AnimeWorld for episodes newer than the last one opened
      window.ani
        .released(h.slice(0, RECENT).map((e) => e.slug))
        .then((r) => id === reloadId.current && setReleased(r))
        .catch(() => {});
    });
  }

  // history changes while watching: re-read it whenever Home comes back
  useEffect(() => {
    if (active) reloadHistory();
  }, [active]);

  useEffect(() => {
    window.ani.settings().then((s) => {
      const saved = s.homeSectionOrder as SectionId[] | undefined;
      // accept only a permutation of the known sections
      if (
        Array.isArray(saved) &&
        saved.length === DEFAULT_ORDER.length &&
        DEFAULT_ORDER.every((id) => saved.includes(id))
      )
        setOrder(saved);
    });
  }, []);

  useEffect(() => {
    if (!viewer) {
      setWatching([]);
      return;
    }
    if (active) window.ani.alUserList("CURRENT").then(setWatching).catch(() => {});
  }, [viewer, active]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLatestError(false);
    setMorePage(1);
    setNoMore(false);
    window.ani.latest(mode).then(
      (l) => {
        if (!alive) return;
        setLatest(l);
        setLoading(false);
      },
      () => {
        if (!alive) return;
        setLatest([]);
        setLatestError(true);
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, [mode, latestTry]);

  const recent = (hist ?? []).slice(0, RECENT);
  const fresh: Fresh[] = recent
    .map((h) => ({ h, n: newCount(h, released[h.slug]) }))
    .filter((f) => f.n > 0);
  const leadFresh = fresh[0] ?? null;
  const sideFresh = fresh.slice(1, 1 + LEAD_SIDE);
  const rowFresh = fresh.slice(1 + LEAD_SIDE);
  const freshSlugs = new Set(fresh.map((f) => f.h.slug));
  const rest = recent.filter((h) => !freshSlugs.has(h.slug));

  // the lead panel knows its exact next episode and wears the series' paint
  const leadSlug = leadFresh?.h.slug ?? null;
  // recompute when the lead's progress changes too (e.g. back from the player)
  const leadKey = leadFresh
    ? `${leadFresh.h.slug}|${leadFresh.h.lastEp}|${leadFresh.h.position}|${leadFresh.h.watched.length}`
    : null;
  useEffect(() => {
    if (!leadSlug) {
      setLead(null);
      return;
    }
    let alive = true;
    setLead((prev) =>
      prev?.slug === leadSlug
        ? { ...prev, next: null }
        : { slug: leadSlug, paint: cachedPaint(leadSlug) ?? fallbackPaint(leadSlug), next: null, newEps: [] },
    );
    Promise.all([window.ani.episodes(leadSlug), window.ani.getEntry(leadSlug)])
      .then(async ([d, entry]) => {
        const paint = await resolvePaint(leadSlug, d.malId);
        const seen = entry ? lastWatched(entry) : null;
        const newEps = seen == null ? [] : d.episodes.filter((e) => parseFloat(e.num) > seen).slice(0, 12);
        if (alive) setLead({ slug: leadSlug, paint, next: nextEpisode(entry, d.episodes), newEps });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadKey]);

  // one action to the right episode; series that are up to date open their page
  async function play(h: HistoryEntry) {
    const seen = lastWatched(h);
    const rel = released[h.slug];
    if (isFinished(h) && rel != null && seen != null && rel <= seen) {
      go({ name: "anime", slug: h.slug, title: h.title, poster: h.poster });
      return;
    }
    setBusySlug(h.slug);
    try {
      await playSeries(h.slug, h.title, h.poster);
    } catch {
      go({ name: "anime", slug: h.slug, title: h.title, poster: h.poster });
    } finally {
      setBusySlug(null);
    }
  }

  function playLead(h: HistoryEntry) {
    const n = lead?.slug === h.slug ? lead.next : null;
    if (n && n.kind !== "rewatch") {
      go({ name: "player", slug: h.slug, title: h.title, token: n.ep.token, ep: n.ep.num, poster: h.poster });
    } else play(h);
  }

  function openSeries(h: HistoryEntry) {
    go({ name: "anime", slug: h.slug, title: h.title, poster: h.poster });
  }

  // older episodes from AnimeWorld's /updated listing, appended without duplicates.
  // The first /updated pages repeat what the home tab already shows, so keep
  // reading until at least 12 new episodes turn up (or AnimeWorld runs out).
  async function loadMore() {
    setLoadingMore(true);
    try {
      const keys = new Set(latest.map((l) => `${l.slug}#${l.ep}`));
      const added: LatestItem[] = [];
      let page = morePage;
      for (let round = 0; round < 4 && added.length < 12; round++) {
        const res = await window.ani.updated(mode, page);
        page = res.next;
        for (const l of res.items) {
          const k = `${l.slug}#${l.ep}`;
          if (!keys.has(k)) {
            keys.add(k);
            added.push(l);
          }
        }
        // last AnimeWorld page reached; an empty answer without end is a failed
        // request, retried from the same page on the next click
        if (res.end) {
          setNoMore(true);
          break;
        }
        if (res.items.length === 0) break;
      }
      setMorePage(page);
      setLatest((prev) => [...prev, ...added]);
    } finally {
      setLoadingMore(false);
    }
  }

  // change an AniList entry's status; anything but CURRENT leaves this section
  async function changeStatus(e: AniListEntry, status: AniListStatus) {
    setStatusBusy(e.media.id);
    try {
      const res = await window.ani.alSetStatus(e.media.id, status);
      if (res && status !== "CURRENT") {
        setWatching((prev) => prev.filter((w) => w.media.id !== e.media.id));
      }
    } finally {
      setStatusBusy(null);
    }
  }

  async function removeEntry(slug: string) {
    await window.ani.removeEntry(slug);
    reloadHistory();
  }

  // move a section up (-1) or down (+1) and persist the order
  function move(id: SectionId, dir: -1 | 1) {
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      window.ani.setSetting("homeSectionOrder", next);
      return next;
    });
  }

  function head(id: SectionId | null, title: ReactNode, extra?: ReactNode) {
    const i = id ? order.indexOf(id) : -1;
    return (
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        <div className="section-tools">
          {extra}
          {id && (
            <span className="reorder" role="group" aria-label="Ordine della sezione">
              <button className="icon-btn" aria-label={`Sposta «${SECTION_NAMES[id]}» su`} title="Sposta su" disabled={i <= 0} onClick={() => move(id, -1)}>
                <ChevronUp aria-hidden="true" className="ico" />
              </button>
              <button
                className="icon-btn"
                aria-label={`Sposta «${SECTION_NAMES[id]}» giù`}
                title="Sposta giù"
                disabled={i >= order.length - 1}
                onClick={() => move(id, 1)}
              >
                <ChevronDown aria-hidden="true" className="ico" />
              </button>
            </span>
          )}
        </div>
      </div>
    );
  }

  function renderLead(f: Fresh) {
    const h = f.h;
    const rel = released[h.slug];
    const n = lead?.slug === h.slug ? lead.next : null;
    const paint = lead?.slug === h.slug ? lead.paint : cachedPaint(h.slug) ?? fallbackPaint(h.slug);
    const seen = lastWatched(h);
    const shownEp = n ? n.ep.num : isFinished(h) && seen != null ? String(Math.floor(seen) + 1) : h.lastEp ?? "1";
    const dub = isDub(h.slug, h.title);
    return (
      <article className="lead painted" style={paintVar(paint)} aria-label={`${h.title}: ${newLabel(f, rel)}`}>
        <button className="lead-poster" onClick={() => openSeries(h)} aria-label={`Scheda: ${h.title}`} tabIndex={-1}>
          <Poster src={h.poster} title={h.title} eager />
        </button>
        <div className="lead-body">
          <p className="lead-ep" aria-hidden="true">
            EP {epNumeral(shownEp)}
          </p>
          <h3 className="lead-title">{h.title}</h3>
          <div className="tag-row">
            <Tag tone="new">{newLabel(f, rel)}</Tag>
            <Tag tone={dub ? "dub" : "sub"}>{dub ? "Dub ITA" : "Sub ITA"}</Tag>
          </div>
          {h.lastEp && <p className="lead-note">Hai visto fino all'episodio {h.lastEp}.</p>}
          {lead?.slug === h.slug && lead.newEps.length > 0 && (
            <div className="lead-eps" role="group" aria-label="Episodi nuovi">
              <span className="lead-eps-label">Episodi nuovi</span>
              {lead.newEps.map((e) => (
                <button
                  key={e.num}
                  className="lead-ep-chip"
                  aria-label={`Guarda l'episodio ${e.num}`}
                  onClick={() =>
                    go({ name: "player", slug: h.slug, title: h.title, token: e.token, ep: e.num, poster: h.poster })
                  }
                >
                  {e.num}
                </button>
              ))}
            </div>
          )}
          <div className="lead-actions">
            <button className="btn btn-ink" data-primary onClick={() => playLead(h)} aria-busy={busySlug === h.slug || undefined}>
              <Play aria-hidden="true" className="ico" />
              {busySlug === h.slug ? "Apertura…" : n ? nextLabel(n) : `Guarda l'episodio ${shownEp}`}
            </button>
            <button className="btn btn-ink-ghost" onClick={() => openSeries(h)}>
              Scheda
            </button>
          </div>
        </div>
      </article>
    );
  }

  function renderNewCard(f: Fresh) {
    const h = f.h;
    const rel = released[h.slug];
    return (
      <button key={h.slug} className="newcard" onClick={() => play(h)} title={h.title} aria-busy={busySlug === h.slug || undefined}>
        <span className="newcard-poster">
          <Poster src={h.poster} title={h.title} />
        </span>
        <span className="newcard-body">
          <span className="newcard-title">{h.title}</span>
          <span className="newcard-meta">
            <Tag tone="new">{newLabel(f, rel)}</Tag>
            <span className="newcard-ep">{busySlug === h.slug ? "Apertura…" : `visto fino all'ep ${h.lastEp ?? "–"}`}</span>
          </span>
        </span>
      </button>
    );
  }

  const sections: Record<SectionId, () => ReactNode> = {
    continue: () => {
      if (hist === null) return null;
      if (hist.length === 0)
        return (
          <section className="section welcome" key="continue">
            <h2 className="section-title">Benvenuto su Animix</h2>
            <p className="muted">
              Qui troverai le serie che stai seguendo, con gli episodi nuovi in evidenza. Per iniziare cerca un titolo
              oppure guarda cosa è uscito oggi più in basso.
            </p>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => go({ name: "browse" })}>
                <Search aria-hidden="true" className="ico" />
                Cerca un anime
              </button>
              <button className="btn btn-ghost" onClick={() => go({ name: "discover" })}>
                <Compass aria-hidden="true" className="ico" />
                Scopri le classifiche
              </button>
            </div>
          </section>
        );
      const rowItems = [...rowFresh, ...rest.map((h) => ({ h, n: 0 }))];
      return (
        <div key="continue" className="section-group">
          {leadFresh && (
            <section className="section" aria-labelledby="h-fresh">
              {head(
                "continue",
                <span id="h-fresh">
                  <span>Da vedere ora</span>
                  <span className="section-count">
                    {fresh.length === 1 ? "1 serie con episodi nuovi" : `${fresh.length} serie con episodi nuovi`}
                  </span>
                </span>,
              )}
              <div className={"next-grid" + (sideFresh.length === 0 ? " solo" : "")}>
                {renderLead(leadFresh)}
                {sideFresh.length > 0 && <div className="next-side">{sideFresh.map(renderNewCard)}</div>}
              </div>
            </section>
          )}
          {rowItems.length > 0 && (
            <section className="section" aria-labelledby="h-continue">
              {head(leadFresh ? null : "continue", <span id="h-continue">Continua a guardare</span>)}
              <div className="hrow">
                {rowItems.map(({ h, n }) => (
                  <ContinueCard
                    key={h.slug}
                    title={h.title}
                    poster={h.poster}
                    line={
                      n > 0
                        ? `Visto ep ${h.lastEp ?? "–"} · ${n === 1 ? "1 nuovo" : `${n} nuovi`}`
                        : continueLine(h, released[h.slug])
                    }
                    progress={h.duration ? h.position / h.duration : null}
                    busy={busySlug === h.slug}
                    lit={n > 0}
                    onPlay={() => play(h)}
                    onInfo={() => openSeries(h)}
                    onRemove={() => removeEntry(h.slug)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      );
    },

    anilist: () =>
      viewer && watching.length > 0 ? (
        <section className="section" key="anilist" aria-labelledby="h-anilist">
          {head("anilist", <span id="h-anilist">In visione su AniList</span>)}
          <div className="grid">
            {watching.map((e) => {
              const title = e.media.title.english || e.media.title.romaji;
              return (
                <Card
                  key={e.media.id}
                  title={title}
                  poster={e.media.coverImage?.large || null}
                  badge={e.media.format ? { label: e.media.format } : null}
                  sub={`Ep ${e.progress}${e.media.episodes ? " di " + e.media.episodes : ""}`}
                  progress={e.media.episodes ? e.progress / e.media.episodes : null}
                  onClick={() =>
                    go({
                      name: "anime",
                      malId: e.media.idMal,
                      titles: [e.media.title.english, e.media.title.romaji].filter((t): t is string => !!t),
                      title,
                      poster: e.media.coverImage?.large || null,
                    })
                  }
                >
                  <select
                    className="select select-sm"
                    aria-label={`Stato su AniList: ${title}`}
                    value="CURRENT"
                    disabled={statusBusy === e.media.id}
                    onChange={(ev) => changeStatus(e, ev.target.value as AniListStatus)}
                  >
                    {AL_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.value === "CURRENT" ? "Stato: in visione" : s.label}
                      </option>
                    ))}
                  </select>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null,

    latest: () => (
      <section className="section" key="latest" aria-labelledby="h-latest">
        {head(
          "latest",
          <span id="h-latest">Ultime uscite</span>,
          <div className="seg" role="group" aria-label="Lingua">
            <button className="seg-btn seg-sub" aria-pressed={mode === "sub"} onClick={() => setMode("sub")}>
              Sub ITA
            </button>
            <button className="seg-btn seg-dub" aria-pressed={mode === "dub"} onClick={() => setMode("dub")}>
              Dub ITA
            </button>
          </div>,
        )}
        {loading ? (
          <CardSkeletons count={14} />
        ) : latestError ? (
          <div className="notice">
            <strong>AnimeWorld non risponde.</strong>
            <span>Controlla la connessione o aggiorna il dominio in Impostazioni, poi riprova.</span>
            <button className="btn btn-ghost" onClick={() => setLatestTry((n) => n + 1)}>
              Riprova
            </button>
          </div>
        ) : (
          <div className="grid">
            {latest.map((l) => (
              <LatestCard
                key={`${l.slug}#${l.ep}`}
                item={l}
                mode={mode}
                onClick={() =>
                  go({ name: "player", slug: l.slug, title: l.title, token: l.token, ep: l.ep, poster: l.poster })
                }
              />
            ))}
          </div>
        )}
        {!loading && !latestError && !noMore && (
          <button className="btn btn-ghost load-more" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? "Caricamento…" : "Carica episodi più vecchi"}
          </button>
        )}
      </section>
    ),
  };

  return (
    <div className="page">
      <h1 className="sr-only">Home</h1>
      <form
        className="searchbar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go({ name: "browse", query: query.trim() || undefined });
        }}
      >
        <Search aria-hidden="true" className="ico searchbar-ico" />
        <input
          className="field"
          aria-label="Cerca un anime"
          placeholder="Cerca un anime…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd className="kbd" title="Premi / da qualunque schermata per cercare">
          /
        </kbd>
      </form>
      {order.map((id) => sections[id]())}
    </div>
  );
}
