import { useEffect, useRef, useState, type MouseEvent } from "react";
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
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [notInCatalog, setNotInCatalog] = useState(false);
  const bulkRef = useRef<{ cancel: boolean; token: string | null }>({
    cancel: false,
    token: null,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotInCatalog(false);
    setDetail(null);
    setAl(null);
    setEntry(null);

    const apply = (d: AnimeDetail | null) => {
      if (!alive) return;
      setLoading(false);
      if (!d) {
        setNotInCatalog(true);
        if (route.malId != null)
          window.ani.alByMalId(route.malId).then((m) => alive && setAl(m));
        return;
      }
      setDetail(d);
      if (d.malId) window.ani.alByMalId(d.malId).then((m) => alive && setAl(m));
      window.ani.getEntry(d.slug).then((e) => alive && setEntry(e));
    };

    if (route.slug)
      window.ani.episodes(route.slug).then(apply, () => apply(null));
    else if (route.malId != null)
      window.ani
        .resolveByMal(route.malId, route.titles ?? [])
        .then(apply, () => apply(null));
    else {
      setLoading(false);
      setNotInCatalog(true);
    }

    return () => {
      alive = false;
    };
  }, [route.slug, route.malId]);

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
      slug: detail.slug,
      title: detail.title,
      ep: e.num,
      token: e.token,
    });
  }

  // download every episode in [from, to] (empty bound = open-ended) sequentially
  async function downloadRange() {
    if (!detail || bulk) return;
    const from = parseFloat(rangeFrom);
    const to = parseFloat(rangeTo);
    const list = detail.episodes.filter((e) => {
      const n = parseFloat(e.num);
      if (isNaN(n)) return false;
      if (!isNaN(from) && n < from) return false;
      if (!isNaN(to) && n > to) return false;
      return !dled.has(String(n));
    });
    if (list.length === 0) return;
    bulkRef.current = { cancel: false, token: null };
    setBulk({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      if (bulkRef.current.cancel) break;
      const e = list[i];
      bulkRef.current.token = e.token;
      setProg((m) => ({ ...m, [e.token]: 0 }));
      try {
        await window.ani.downloadEpisode({
          slug: detail.slug,
          title: detail.title,
          ep: e.num,
          token: e.token,
        });
      } catch {
        // skip failed episode, keep going
      }
      setBulk((b) => (b ? { ...b, done: i + 1 } : null));
    }
    bulkRef.current.token = null;
    setBulk(null);
  }

  function cancelBulk() {
    bulkRef.current.cancel = true;
    if (bulkRef.current.token) window.ani.cancelDownload(bulkRef.current.token);
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
            {(detail?.malId ?? route.malId) && (
              <button
                className="pill link"
                onClick={() =>
                  window.ani.openExternal(
                    `https://myanimelist.net/anime/${detail?.malId ?? route.malId}`,
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
                    slug: detail!.slug,
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

      {loading ? (
        <div className="loading">
          {route.malId && !route.slug
            ? "Ricerca dell'anime su AnimeWorld…"
            : "Caricamento episodi…"}
        </div>
      ) : notInCatalog ? (
        <div className="not-in-catalog">
          <strong>Non presente nel catalogo AnimeWorld</strong>
          <span>
            Questo titolo non è (ancora) disponibile su AnimeWorld. Qui sopra
            trovi comunque valutazioni e informazioni da AniList.
          </span>
        </div>
      ) : (
        <>
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

          <div className="dl-range">
            {bulk ? (
              <>
                <span className="dl-range-status">
                  Scaricando {bulk.done}/{bulk.total}…
                </span>
                <button className="pill link" onClick={cancelBulk}>
                  Interrompi
                </button>
              </>
            ) : (
              <>
                <span className="dl-range-label">Scarica episodi</span>
                <input
                  className="dl-range-input"
                  type="number"
                  min={1}
                  placeholder="da"
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                />
                <span className="dim">–</span>
                <input
                  className="dl-range-input"
                  type="number"
                  min={1}
                  placeholder="a"
                  value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                />
                <button className="btn-small" onClick={downloadRange}>
                  ⬇ Scarica
                </button>
                <span className="dl-range-hint">vuoto = tutti</span>
              </>
            )}
          </div>

          <div className="eplist">
            {eps.map((e) => (
              <button
                key={e.num}
                className={"epitem" + (watched.has(e.num) ? " watched" : "")}
                onClick={() =>
                  go({
                    name: "player",
                    slug: detail!.slug,
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
        </>
      )}
    </div>
  );
}
