import { useEffect, useState, type ReactNode } from "react";
import { useNav } from "../App";
import { Card } from "../components/Card";
import { ContinueCard } from "../components/ContinueCard";
import { LatestCard } from "../components/LatestCard";
import type {
  HistoryEntry,
  LatestItem,
  Mode,
  AniListEntry,
  AniListStatus,
  AniListViewer,
} from "../types";

type SectionId = "continue" | "latest" | "anilist";
const DEFAULT_ORDER: SectionId[] = ["continue", "latest", "anilist"];

// statuses offered under the "In visione su AniList" cards
const AL_STATUSES: { value: AniListStatus; label: string }[] = [
  { value: "CURRENT", label: "In visione" },
  { value: "COMPLETED", label: "Completato" },
  { value: "PAUSED", label: "In pausa" },
  { value: "DROPPED", label: "Abbandonato" },
  { value: "PLANNING", label: "Da vedere" },
];

// highest watched episode number of a history entry
function lastWatched(h: HistoryEntry): number | null {
  const nums = [...h.watched, h.lastEp ?? ""]
    .map((e) => parseFloat(e))
    .filter((n) => !Number.isNaN(n));
  return nums.length ? Math.max(...nums) : null;
}

// "Ep 4 da vedere" / "3 episodi da vedere" when AnimeWorld has newer episodes
function freshLabel(h: HistoryEntry, released: number | null | undefined): string | null {
  const seen = lastWatched(h);
  if (released == null || seen == null || released <= seen) return null;
  const missing = Math.floor(released) - Math.floor(seen);
  if (missing <= 1) return `Ep ${released} da vedere`;
  return `${missing} episodi da vedere`;
}

export function Home() {
  const { go } = useNav();
  const [hist, setHist] = useState<HistoryEntry[]>([]);
  const [mode, setMode] = useState<Mode>("sub");
  const [latest, setLatest] = useState<LatestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [morePage, setMorePage] = useState(1); // next /updated page to read
  const [loadingMore, setLoadingMore] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [released, setReleased] = useState<Record<string, number | null>>({});
  const [statusBusy, setStatusBusy] = useState<number | null>(null);
  const [viewer, setViewer] = useState<AniListViewer | null>(null);
  const [watching, setWatching] = useState<AniListEntry[]>([]);
  const [order, setOrder] = useState<SectionId[]>(DEFAULT_ORDER);

  function reloadHistory() {
    window.ani.history().then((h) => {
      setHist(h);
      // check AnimeWorld for episodes newer than the last one watched
      window.ani.released(h.slice(0, 24).map((e) => e.slug)).then(setReleased);
    });
  }

  useEffect(() => {
    reloadHistory();
    window.ani.alViewer().then((v) => {
      setViewer(v);
      if (v) window.ani.alUserList("CURRENT").then(setWatching);
    });
    window.ani.settings().then((s) => {
      const saved = s.homeSectionOrder as SectionId[] | undefined;
      if (Array.isArray(saved) && saved.length === DEFAULT_ORDER.length) {
        setOrder(saved);
      }
    });
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMorePage(1);
    setNoMore(false);
    window.ani.latest(mode).then((l) => {
      if (alive) {
        setLatest(l);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [mode]);

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

  // header with reorder controls
  function head(id: SectionId, title: string, extra?: ReactNode) {
    const i = order.indexOf(id);
    return (
      <div className="section-head">
        <div className="section-title-wrap">
          <h2 className="section-title">{title}</h2>
          <span className="reorder">
            <button
              className="reorder-btn"
              title="Sposta su"
              disabled={i <= 0}
              onClick={() => move(id, -1)}
            >
              ↑
            </button>
            <button
              className="reorder-btn"
              title="Sposta giù"
              disabled={i >= order.length - 1}
              onClick={() => move(id, 1)}
            >
              ↓
            </button>
          </span>
        </div>
        {extra}
      </div>
    );
  }

  const sections: Record<SectionId, () => ReactNode> = {
    continue: () =>
      hist.length > 0 ? (
        <section className="section" key="continue">
          {head("continue", "▸ Continua a guardare")}
          <div className="ccard-list">
            {hist
              .slice(0, 24)
              .map((h) => ({ h, fresh: freshLabel(h, released[h.slug]) }))
              // anime with something new to watch come first, otherwise keep recency order
              .sort((a, b) => Number(!!b.fresh) - Number(!!a.fresh))
              .map(({ h, fresh }) => (
                <ContinueCard
                  key={h.slug}
                  title={h.title}
                  poster={h.poster}
                  sub={h.lastEp ? `Visto fino all'episodio ${h.lastEp}` : null}
                  fresh={fresh}
                  progress={h.duration ? h.position / h.duration : null}
                  onClick={() =>
                    go({ name: "anime", slug: h.slug, title: h.title, poster: h.poster })
                  }
                  onRemove={() => removeEntry(h.slug)}
                />
              ))}
          </div>
        </section>
      ) : null,

    anilist: () =>
      viewer && watching.length > 0 ? (
        <section className="section" key="anilist">
          {head("anilist", "▸ In visione su AniList")}
          <div className="row">
            {watching.map((e) => (
              <div className="al-item" key={e.media.id}>
                <Card
                  title={e.media.title.english || e.media.title.romaji}
                  poster={e.media.coverImage?.large || null}
                  badge={e.media.format}
                  sub={`Ep ${e.progress}${e.media.episodes ? " / " + e.media.episodes : ""}`}
                  onClick={() =>
                    go({
                      name: "anime",
                      malId: e.media.idMal,
                      titles: [e.media.title.english, e.media.title.romaji].filter(
                        (t): t is string => !!t,
                      ),
                      title: e.media.title.english || e.media.title.romaji,
                      poster: e.media.coverImage?.large || null,
                    })
                  }
                />
                <select
                  className="al-status"
                  aria-label="Stato su AniList"
                  value="CURRENT"
                  disabled={statusBusy === e.media.id}
                  onChange={(ev) => changeStatus(e, ev.target.value as AniListStatus)}
                >
                  {AL_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.value === "CURRENT" ? "Stato: In visione" : s.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      ) : null,

    latest: () => (
      <section className="section" key="latest">
        {head(
          "latest",
          "▸ Ultimi episodi",
          <div className="tabs">
            <button
              className={"tab" + (mode === "sub" ? " active" : "")}
              onClick={() => setMode("sub")}
            >
              Sub ITA
            </button>
            <button
              className={"tab" + (mode === "dub" ? " active" : "")}
              onClick={() => setMode("dub")}
            >
              Dub ITA
            </button>
          </div>,
        )}
        {loading ? (
          <div className="loading">Caricamento…</div>
        ) : (
          <div className="grid">
            {latest.map((l) => (
              <LatestCard
                key={`${l.slug}#${l.ep}`}
                item={l}
                onClick={() =>
                  go({
                    name: "player",
                    slug: l.slug,
                    title: l.title,
                    token: l.token,
                    ep: l.ep,
                    poster: l.poster,
                  })
                }
              />
            ))}
          </div>
        )}
        {!loading && !noMore && (
          <button className="load-more" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? "Caricamento…" : "Carica altri episodi"}
          </button>
        )}
      </section>
    ),
  };

  return (
    <div className="page">
      <div className="hero">
        <span className="hero-kicker">
          {viewer ? `ANILIST · ${viewer.name.toUpperCase()}` : "ANIMEWORLD · SUB / DUB ITA"}
        </span>
        <h1 className="hero-title">La tua dashboard anime.</h1>
        <p className="hero-sub">
          Cerca, riprendi e guarda anime in italiano, tutto in un posto.
        </p>
      </div>

      {order.map((id) => sections[id]())}
    </div>
  );
}
