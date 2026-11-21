import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Download, ExternalLink, FolderOpen, Play, TriangleAlert, X } from "lucide-react";
import { useActive, useNav, type Route } from "../App";
import { Poster, Tag } from "../components/Card";
import { isDub, nextEpisode, nextLabel } from "../lib/episodes";
import { fallbackPaint, paintVar, rememberPaint } from "../lib/paint";
import type { AniListMedia, AnimeDetail, Episode, HistoryEntry } from "../types";

const CHUNK = 100; // episodes per block on long series

function stripHtml(s: string) {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function Anime({ route }: { route: Extract<Route, { name: "anime" }> }) {
  const { go, back, canGoBack } = useNav();
  const active = useActive();
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [al, setAl] = useState<AniListMedia | null>(null);
  const [alLoaded, setAlLoaded] = useState(false);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dled, setDled] = useState<Set<string>>(new Set());
  const [prog, setProg] = useState<Record<string, number>>({});
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [showDl, setShowDl] = useState(false);
  const [notInCatalog, setNotInCatalog] = useState(false);
  const [chunk, setChunk] = useState<number | null>(null);
  const [fullDesc, setFullDesc] = useState(false);
  const [announce, setAnnounce] = useState("");
  const bulkRef = useRef<{ cancel: boolean; token: string | null }>({ cancel: false, token: null });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotInCatalog(false);
    setDetail(null);
    setAl(null);
    setAlLoaded(false);
    setEntry(null);
    setChunk(null);

    const loadAl = (malId: string | number) =>
      window.ani
        .alByMalId(malId)
        .then((m) => {
          if (!alive) return;
          setAl(m);
          setAlLoaded(true);
        })
        .catch(() => alive && setAlLoaded(true));

    const apply = (d: AnimeDetail | null) => {
      if (!alive) return;
      setLoading(false);
      if (!d) {
        setNotInCatalog(true);
        if (route.malId != null) loadAl(route.malId);
        else setAlLoaded(true);
        return;
      }
      setDetail(d);
      if (d.malId) loadAl(d.malId);
      else setAlLoaded(true);
      window.ani.getEntry(d.slug).then((e) => alive && setEntry(e));
    };

    if (route.slug) window.ani.episodes(route.slug).then(apply, () => apply(null));
    else if (route.malId != null)
      window.ani.resolveByMal(route.malId, route.titles ?? []).then(apply, () => apply(null));
    else {
      setLoading(false);
      setNotInCatalog(true);
      setAlLoaded(true);
    }

    return () => {
      alive = false;
    };
  }, [route.slug, route.malId]);

  // watched marks change while the player is on top: refresh on return
  useEffect(() => {
    if (active && detail) window.ani.getEntry(detail.slug).then(setEntry);
  }, [active, detail?.slug]);

  // remember the series paint so Home can wear it without a lookup
  useEffect(() => {
    if (detail && alLoaded) rememberPaint(detail.slug, al?.coverImage?.color ?? null);
  }, [detail?.slug, alLoaded, al]);

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
        setAnnounce(`Episodio ${m.ep} scaricato.`);
      } else if (m.type === "error") {
        setAnnounce(`Download${m.ep ? ` dell'episodio ${m.ep}` : ""} non riuscito.`);
      }
    });
  }, []);

  const episodes = detail?.episodes ?? [];
  const watched = new Set(entry?.watched ?? []);
  const next = detail ? nextEpisode(entry, episodes) : null;
  const title = detail?.title ?? route.title ?? al?.title.english ?? al?.title.romaji ?? "";
  const poster = detail?.poster || route.poster || al?.coverImage?.large || null;
  const dub = route.dub ?? (detail ? isDub(detail.slug, detail.title) : false);
  const paint = al?.coverImage?.color ?? (detail ? fallbackPaint(detail.slug) : null);
  const malId = detail?.malId ?? route.malId ?? null;

  // long series are split into blocks; start on the block holding the next episode
  const chunks = useMemo(() => {
    if (episodes.length <= CHUNK + 20) return [];
    const out: { from: number; to: number; label: string }[] = [];
    for (let i = 0; i < episodes.length; i += CHUNK) {
      const slice = episodes.slice(i, i + CHUNK);
      out.push({ from: i, to: i + slice.length, label: `${slice[0].num}–${slice[slice.length - 1].num}` });
    }
    return out;
  }, [episodes]);
  const nextIdx = next ? episodes.indexOf(next.ep) : 0;
  const activeChunk = chunk ?? (chunks.length ? Math.floor(Math.max(nextIdx, 0) / CHUNK) : 0);

  const shown = filter.trim()
    ? episodes.filter((e) => e.num.startsWith(filter.trim()))
    : chunks.length
      ? episodes.slice(chunks[activeChunk].from, chunks[activeChunk].to)
      : episodes;

  function play(e: Episode) {
    if (!detail) return;
    go({ name: "player", slug: detail.slug, title: detail.title, token: e.token, ep: e.num, poster });
  }

  function dlState(e: Episode) {
    const n = String(parseFloat(e.num));
    const p = prog[e.token];
    if (dled.has(n)) return { kind: "done" as const, label: `Episodio ${e.num} scaricato: apri la cartella` };
    if (p === -1) return { kind: "err" as const, label: `Download dell'episodio ${e.num} non riuscito: riprova` };
    if (p != null) return { kind: "active" as const, pct: p, label: `Annulla il download dell'episodio ${e.num} (${p}%)` };
    return { kind: "idle" as const, label: `Scarica l'episodio ${e.num}` };
  }

  function download(e: Episode) {
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
    window.ani.downloadEpisode({ slug: detail.slug, title: detail.title, ep: e.num, token: e.token }).catch(() => {});
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
        await window.ani.downloadEpisode({ slug: detail.slug, title: detail.title, ep: e.num, token: e.token });
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

  const desc = al?.description ? stripHtml(al.description) : null;
  const longDesc = !!desc && desc.length > 420;

  return (
    <div className="page">
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
      {canGoBack && (
        <div className="back-row">
          <button className="btn btn-ghost" onClick={back}>
            <ArrowLeft aria-hidden="true" className="ico" />
            Indietro
          </button>
        </div>
      )}

      <section
        className={"series-band" + (paint ? " painted" : " unpainted")}
        style={paintVar(paint)}
        aria-labelledby="series-title"
      >
        <div className="series-poster">
          <Poster src={poster} title={title} eager />
        </div>
        <div className="series-info">
          <h1 className="series-title" id="series-title">
            {title}
          </h1>
          <div className="tag-row">
            {detail && <Tag tone={dub ? "dub" : "sub"}>{dub ? "Dub ITA" : "Sub ITA"}</Tag>}
            {al?.format && <Tag>{al.format}</Tag>}
            {al?.seasonYear && <Tag>{al.seasonYear}</Tag>}
          </div>
          <dl className="facts">
            {detail && (
              <div>
                <dt>Episodi</dt>
                <dd>{detail.episodes.length}</dd>
              </div>
            )}
            {al?.averageScore != null && (
              <div>
                <dt>AniList</dt>
                <dd>{al.averageScore}%</dd>
              </div>
            )}
            {detail?.awScore != null && (
              <div
                title={detail.awVotes ? `${detail.awVotes.toLocaleString("it-IT")} voti su AnimeWorld` : undefined}
              >
                <dt>AnimeWorld</dt>
                <dd>{detail.awScore.toFixed(2)}</dd>
              </div>
            )}
          </dl>
          <div className="series-actions">
            {next && (
              <button className="btn btn-ink" data-primary onClick={() => play(next.ep)}>
                <Play aria-hidden="true" className="ico" />
                {nextLabel(next)}
              </button>
            )}
            {malId && (
              <button
                className="btn btn-ink-ghost"
                onClick={() => window.ani.openExternal(`https://myanimelist.net/anime/${malId}`)}
              >
                MyAnimeList
                <ExternalLink aria-hidden="true" className="ico" />
              </button>
            )}
            {al && (
              <button className="btn btn-ink-ghost" onClick={() => window.ani.openExternal(`https://anilist.co/anime/${al.id}`)}>
                AniList
                <ExternalLink aria-hidden="true" className="ico" />
              </button>
            )}
          </div>
        </div>
      </section>

      {al && (al.genres.length > 0 || desc) && (
        <div className="synopsis">
          {al.genres.length > 0 && (
            <div className="genres">
              {al.genres.map((g) => (
                <Tag key={g}>{g}</Tag>
              ))}
            </div>
          )}
          {desc && (
            <>
              <p className="desc">{longDesc && !fullDesc ? desc.slice(0, 420).trimEnd() + "…" : desc}</p>
              {longDesc && (
                <button className="link-btn" onClick={() => setFullDesc((v) => !v)} aria-expanded={fullDesc}>
                  {fullDesc ? "Mostra meno" : "Leggi tutta la trama"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="section">
          <p className="muted" role="status">
            {route.malId && !route.slug ? "Cerco la serie su AnimeWorld…" : "Carico gli episodi…"}
          </p>
          <div className="eplist" aria-hidden="true" style={{ marginTop: "1rem" }}>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="skel" style={{ height: "2.9rem" }} />
            ))}
          </div>
        </div>
      ) : notInCatalog ? (
        <div className="section notice">
          <strong>Non è (ancora) su AnimeWorld</strong>
          <span>
            Non ho trovato questa serie nel catalogo AnimeWorld. Qui sopra ci sono comunque voto e trama da AniList; prova
            a cercarla con un altro titolo.
          </span>
          <button className="btn btn-ghost" onClick={() => go({ name: "browse", query: title })}>
            Cerca “{title}”
          </button>
        </div>
      ) : (
        <section className="section" aria-labelledby="h-eps">
          <div className="section-head">
            <h2 className="section-title" id="h-eps">
              Episodi
            </h2>
            <div className="ep-toolbar">
              <input
                className="field"
                inputMode="decimal"
                aria-label="Vai all'episodio numero"
                placeholder="Vai all'episodio…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <button className="btn btn-ghost" aria-expanded={showDl} onClick={() => setShowDl((v) => !v)}>
                <Download aria-hidden="true" className="ico" />
                Scarica
              </button>
            </div>
          </div>

          {(showDl || bulk) && (
            <div className="dl-panel">
              {bulk ? (
                <>
                  <span className="dl-panel-label" role="status">
                    Scarico {bulk.done} di {bulk.total}…
                  </span>
                  <button className="btn btn-danger" onClick={cancelBulk}>
                    <X aria-hidden="true" className="ico" />
                    Interrompi
                  </button>
                </>
              ) : (
                <>
                  <span className="dl-panel-label">Scarica dall'episodio</span>
                  <input
                    className="field"
                    type="number"
                    min={1}
                    aria-label="Dall'episodio"
                    placeholder="primo"
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                  />
                  <span className="dl-panel-label">all'episodio</span>
                  <input
                    className="field"
                    type="number"
                    min={1}
                    aria-label="All'episodio"
                    placeholder="ultimo"
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={downloadRange}>
                    <Download aria-hidden="true" className="ico" />
                    Scarica
                  </button>
                  <button className="btn btn-ghost" onClick={() => window.ani.openDownloads()}>
                    <FolderOpen aria-hidden="true" className="ico" />
                    Apri cartella
                  </button>
                </>
              )}
            </div>
          )}

          {chunks.length > 0 && !filter.trim() && (
            <div className="ep-chunks" role="group" aria-label="Blocchi di episodi">
              {chunks.map((c, i) => (
                <button key={c.label} className="seg-btn" aria-pressed={i === activeChunk} onClick={() => setChunk(i)}>
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {shown.length === 0 ? (
            <p className="muted">Nessun episodio con questo numero.</p>
          ) : (
            <div className="eplist">
              {shown.map((e) => {
                const isWatched = watched.has(e.num);
                const isNext = next?.ep === e && next.kind !== "rewatch";
                const dl = dlState(e);
                return (
                  <div
                    key={e.num}
                    className={"ep" + (isWatched ? " is-watched" : "") + (isNext ? " is-next painted" : "")}
                    style={isNext ? paintVar(paint) : undefined}
                  >
                    <button
                      className="ep-play"
                      onClick={() => play(e)}
                      aria-label={`Guarda l'episodio ${e.num}${
                        isNext ? (next?.kind === "resume" ? ", riprendi" : ", prossimo") : isWatched ? ", visto" : ""
                      }`}
                    >
                      <span className="ep-num">{e.num}</span>
                      {isNext ? (
                        <span className="ep-state">{next?.kind === "resume" ? "riprendi" : "prossimo"}</span>
                      ) : isWatched ? (
                        <span className="ep-state">
                          <Check aria-hidden="true" className="ico" />
                          visto
                        </span>
                      ) : null}
                    </button>
                    <button
                      className={"ep-dl is-" + dl.kind}
                      aria-label={dl.label}
                      title={dl.label}
                      onClick={() => download(e)}
                    >
                      {dl.kind === "active" ? (
                        `${dl.pct}%`
                      ) : dl.kind === "done" ? (
                        <Check aria-hidden="true" className="ico" />
                      ) : dl.kind === "err" ? (
                        <TriangleAlert aria-hidden="true" className="ico" />
                      ) : (
                        <Download aria-hidden="true" className="ico" />
                      )}
                    </button>
                    {dl.kind === "active" && (
                      <span className="ep-bar" aria-hidden="true">
                        <span style={{ width: `${dl.pct}%` }} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
