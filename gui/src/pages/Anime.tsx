import { useEffect, useState, type MouseEvent } from "react";
import { useNav, type Route } from "../App";
import type { AnimeDetail, HistoryEntry, AniListMedia, Episode } from "../types";

export function Anime({ route }: { route: Extract<Route, { name: "anime" }> }) {
  const { go, back } = useNav();
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [al, setAl] = useState<AniListMedia | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dled, setDled] = useState<Set<string>>(new Set());
  const [prog, setProg] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    setLoading(true);
    window.ani.episodes(route.slug).then((d) => {
      if (!alive) return;
      setDetail(d);
      setLoading(false);
      // enrich with AniList metadata via the MAL id from the play page
      if (d.malId) window.ani.alByMalId(d.malId).then((m) => alive && setAl(m));
    });
    window.ani.getEntry(route.slug).then((e) => alive && setEntry(e));
    return () => {
      alive = false;
    };
  }, [route.slug]);

  // which episodes are already downloaded (normalized ep numbers)
  useEffect(() => {
    if (!detail) return;
    let alive = true;
    window.ani.downloadedEps(detail.title).then((l) => alive && setDled(new Set(l)));
    return () => {
      alive = false;
    };
  }, [detail?.title]);

  // live download progress
  useEffect(() => {
    return window.ani.onDownload((m) => {
      setProg((p) => {
        const next = { ...p };
        if (m.type === "progress") next[m.token] = m.pct ?? 0;
        else if (m.type === "error") next[m.token] = -1;
        else delete next[m.token];
        return next;
      });
      if (m.type === "done" && m.ep != null) {
        const n = String(parseFloat(m.ep));
        setDled((s) => new Set(s).add(n));
      }
    });
  }, []);

  const watched = new Set(entry?.watched ?? []);
  const eps = (detail?.episodes ?? []).filter((e) =>
    filter ? e.num.startsWith(filter.trim()) : true,
  );

  function dlState(e: Episode) {
    const n = String(parseFloat(e.num));
    const p = prog[e.token];
    if (dled.has(n))
      return { label: "⬇ ✓", title: "Scaricato — apri cartella", cls: "done" };
    if (p === -1) return { label: "⚠", title: "Errore — riprova", cls: "err" };
    if (p != null) return { label: `${p}%`, title: "Annulla download", cls: "active" };
    return { label: "⬇", title: "Scarica episodio", cls: "" };
  }

  function download(e: Episode, ev: MouseEvent) {
    ev.stopPropagation();
    if (!detail) return;
    const n = String(parseFloat(e.num));
    if (dled.has(n)) {
      window.ani.openDownloads();
      return;
    }
    const p = prog[e.token];
    if (p != null && p >= 0) {
      window.ani.cancelDownload(e.token);
      return;
    }
    setProg((m) => ({ ...m, [e.token]: 0 }));
    window.ani.downloadEpisode({
      slug: route.slug,
      title: detail.title,
      ep: e.num,
      token: e.token,
    });
  }

  return (
    <div className="page">
      <button className="back" onClick={back}>
        ← Indietro
      </button>
      <div className="detail">
        <div className="detail-poster">
          {detail?.poster || route.poster || al?.coverImage?.large ? (
            <img src={(detail?.poster || route.poster || al?.coverImage?.large)!} alt={detail?.title ?? ""} />
          ) : (
            <div className="card-noposter big">
              {(route.title ?? "?").slice(0, 1)}
            </div>
          )}
        </div>
        <div className="detail-info">
          <span className="hero-kicker">ORA IN VISIONE</span>
          <h1 className="detail-title">{detail?.title ?? route.title}</h1>
          <div className="detail-meta">
            {detail && (
              <span className="pill">{detail.episodes.length} episodi</span>
            )}
            {route.dub && <span className="pill dub">DUB ITA</span>}
            {al?.averageScore && <span className="pill score">★ {al.averageScore}%</span>}
            {detail?.awScore != null && (
              <span
                className="pill score aw"
                title={
                  detail.awVotes
                    ? `Voto AnimeWorld — ${detail.awVotes.toLocaleString("it-IT")} voti`
                    : "Voto AnimeWorld"
                }
              >
                AW ★ {detail.awScore.toFixed(2)}
              </span>
            )}
            {al?.format && <span className="pill">{al.format}</span>}
            {al?.seasonYear && <span className="pill">{al.seasonYear}</span>}
            {detail?.malId && (
              <button
                className="pill link"
                onClick={() =>
                  window.ani.openExternal(
                    `https://myanimelist.net/anime/${detail.malId}`,
                  )
                }
              >
                MAL ↗
              </button>
            )}
            {al && (
              <button
                className="pill link"
                onClick={() =>
                  window.ani.openExternal(`https://anilist.co/anime/${al.id}`)
                }
              >
                AniList ↗
              </button>
            )}
          </div>
          {entry?.lastEp && (
            <button
              className="resume"
              onClick={() => {
                const ep = detail?.episodes.find((e) => e.num === entry.lastEp);
                if (ep)
                  go({
                    name: "player",
                    slug: route.slug,
                    title: detail!.title,
                    token: ep.token,
                    ep: ep.num,
                    poster: detail?.poster || route.poster,
                  });
              }}
            >
              ▸ Riprendi dall'episodio {entry.lastEp}
            </button>
          )}
        </div>
      </div>

      {al && (al.genres.length > 0 || al.description) && (
        <div className="synopsis">
          {al.genres.length > 0 && (
            <div className="genres">
              {al.genres.map((g) => (
                <span key={g} className="genre">
                  {g}
                </span>
              ))}
            </div>
          )}
          {al.description && (
            <p className="desc">
              {al.description.replace(/<[^>]+>/g, "").slice(0, 600)}
            </p>
          )}
        </div>
      )}

      <div className="section-head">
        <h2 className="section-title">Episodi</h2>
        <button
          className="pill link dl-open"
          title="Apri la cartella dei download"
          onClick={() => window.ani.openDownloads()}
        >
          ⬇ Cartella download
        </button>
        <input
          className="mini-search"
          placeholder="Trova episodio…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Caricamento episodi…</div>
      ) : (
        <div className="eplist">
          {eps.map((e) => (
            <button
              key={e.num}
              className={"epitem" + (watched.has(e.num) ? " watched" : "")}
              onClick={() =>
                go({
                  name: "player",
                  slug: route.slug,
                  title: detail!.title,
                  token: e.token,
                  ep: e.num,
                  poster: detail?.poster || route.poster,
                })
              }
            >
              <span className="ep-num">Ep {e.num}</span>
              <span className="ep-actions">
                {watched.has(e.num) && <span className="check">✓</span>}
                <span
                  className={"ep-dl " + dlState(e).cls}
                  role="button"
                  title={dlState(e).title}
                  onClick={(ev) => download(e, ev)}
                >
                  {dlState(e).label}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
