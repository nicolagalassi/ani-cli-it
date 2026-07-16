import { useEffect, useState } from "react";
import { useNav, type Route } from "../App";
import type { AnimeDetail, HistoryEntry, AniListMedia } from "../types";

export function Anime({ route }: { route: Extract<Route, { name: "anime" }> }) {
  const { go, back } = useNav();
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [al, setAl] = useState<AniListMedia | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

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

  const watched = new Set(entry?.watched ?? []);
  const eps = (detail?.episodes ?? []).filter((e) =>
    filter ? e.num.startsWith(filter.trim()) : true,
  );

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
              <span>Ep {e.num}</span>
              {watched.has(e.num) && <span className="check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
