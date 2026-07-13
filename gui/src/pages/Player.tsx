import { useEffect, useRef, useState } from "react";
import { useNav, type Route } from "../App";
import type { AnimeDetail, SkipTimes } from "../types";

export function Player({ route }: { route: Extract<Route, { name: "player" }> }) {
  const { back, go } = useNav();
  const videoRef = useRef<HTMLVideoElement>(null);
  // live position/duration, updated on timeupdate — lets persist() run even
  // after React detaches the video DOM ref on unmount
  const stateRef = useRef({ position: 0, duration: 0 });
  // cache of resolved mp4 URLs per episode token (enables instant switching)
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  const preloadVidRef = useRef<HTMLVideoElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [ep, setEp] = useState(route.ep);
  const [token, setToken] = useState(route.token);
  const [skip, setSkip] = useState<SkipTimes | null>(null);
  const [curTime, setCurTime] = useState(0);

  // load the full episode list (for next/prev + resume position)
  useEffect(() => {
    window.ani.episodes(route.slug).then(setDetail);
  }, [route.slug]);

  // fetch OP/ED skip times for the current episode (needs the MAL id)
  useEffect(() => {
    setSkip(null);
    if (detail?.malId) window.ani.skipTimes(detail.malId, ep).then(setSkip);
  }, [detail?.malId, ep]);

  // resolve the mp4 for the current token
  useEffect(() => {
    let alive = true;
    // instant if the token was preloaded
    const cached = urlCacheRef.current.get(token);
    if (cached) {
      setUrl(cached);
      setError(null);
      return;
    }
    setUrl(null);
    setError(null);
    window.ani
      .episodeUrl(token)
      .then((u) => {
        if (!alive) return;
        if (u) {
          urlCacheRef.current.set(token, u);
          setUrl(u);
        } else setError("Nessuna sorgente trovata per questo episodio.");
      })
      .catch(() => alive && setError("Errore nel recupero della sorgente."));
    return () => {
      alive = false;
    };
  }, [token]);

  // resume from saved position once metadata is ready
  useEffect(() => {
    if (!url) return;
    let done = false;
    window.ani.getEntry(route.slug).then((entry) => {
      const v = videoRef.current;
      if (!v || done) return;
      if (entry && entry.lastEp === ep && entry.position > 5) {
        const seek = () => {
          v.currentTime = entry.position;
          v.removeEventListener("loadedmetadata", seek);
        };
        if (v.readyState >= 1) v.currentTime = entry.position;
        else v.addEventListener("loadedmetadata", seek);
      }
    });
    return () => {
      done = true;
    };
  }, [url, ep, route.slug]);

  const pushedRef = useRef<string | null>(null);
  // periodically persist progress locally, and sync to AniList when mostly watched
  function persist() {
    const { position, duration } = stateRef.current;
    if (!duration) return;
    window.ani.recordProgress({
      slug: route.slug,
      title: detail?.title ?? route.title,
      poster: detail?.poster ?? route.poster ?? null,
      ep,
      token,
      position: Math.floor(position),
      duration: Math.floor(duration),
    });
    // sync to AniList once per episode after ~90% watched (no-op if not logged in)
    if (
      detail?.malId &&
      position / duration > 0.9 &&
      pushedRef.current !== ep
    ) {
      pushedRef.current = ep;
      const n = parseInt(ep, 10);
      if (n) window.ani.alSetProgress(detail.malId, n).catch(() => {});
    }
  }

  useEffect(() => {
    const id = setInterval(persist, 10000);
    return () => {
      clearInterval(id);
      persist();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep, token, detail]);

  // remove the hidden preload <video> when leaving the player
  useEffect(() => {
    return () => {
      preloadVidRef.current?.remove();
      preloadVidRef.current = null;
    };
  }, []);

  const list = detail?.episodes ?? [];
  const idx = list.findIndex((e) => e.num === ep);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  function playEp(e: { num: string; token: string }) {
    persist();
    stateRef.current = { position: 0, duration: 0 };
    setCurTime(0);
    setEp(e.num);
    setToken(e.token);
  }

  // which skip segment (if any) is active at the current time
  const active =
    skip?.op && curTime >= skip.op.start && curTime < skip.op.end
      ? { label: "Salta intro", end: skip.op.end }
      : skip?.ed && curTime >= skip.ed.start && curTime < skip.ed.end
        ? { label: "Salta sigla", end: skip.ed.end }
        : null;

  function doSkip() {
    const v = videoRef.current;
    if (v && active) v.currentTime = active.end + 0.3;
  }

  // manual fixed skip (like the AnimeWorld Better Player extension: O/B keys)
  const SKIP_SECONDS = 85;
  function skipBy(delta: number) {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration || 0;
    v.currentTime = Math.max(0, Math.min(d, v.currentTime + delta));
  }

  // preload the next episode's mp4 URL (and warm the file) for instant switching
  function preloadNext() {
    if (!next) return;
    if (urlCacheRef.current.has(next.token)) return;
    window.ani.episodeUrl(next.token).then((u) => {
      if (!u || urlCacheRef.current.has(next.token)) return;
      urlCacheRef.current.set(next.token, u);
      // warm the mp4 in a hidden, muted preload element (best-effort)
      try {
        preloadVidRef.current?.remove();
        const pv = document.createElement("video");
        pv.preload = "auto";
        pv.muted = true;
        pv.src = u;
        pv.style.cssText = "position:fixed;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none";
        document.body.appendChild(pv);
        pv.load();
        preloadVidRef.current = pv;
      } catch {
        /* ignore */
      }
    });
  }

  return (
    <div className="page player-page">
      <button className="back" onClick={back}>
        ← Indietro
      </button>
      <div className="player-head">
        <h1 className="player-title">{detail?.title ?? route.title}</h1>
        <span className="pill">Episodio {ep}</span>
      </div>

      <div className="player-stage">
        {error ? (
          <div className="player-error">{error}</div>
        ) : !url ? (
          <div className="player-loading">
            <div className="spinner" />
            <div>Caricamento episodio {ep}…</div>
            <div className="dim">Recupero sorgente da AnimeWorld…</div>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls
            autoPlay
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              setCurTime(v.currentTime);
              if (v.duration) {
                stateRef.current = {
                  position: v.currentTime,
                  duration: v.duration,
                };
                if (v.currentTime / v.duration >= 0.75) preloadNext();
              }
            }}
            onEnded={() => next && playEp(next)}
          />
        )}
        {url && active && (
          <button className="skip-intro" onClick={doSkip}>
            {active.label} ⏭
          </button>
        )}
      </div>

      <div className="player-controls">
        <button disabled={!prev} onClick={() => prev && playEp(prev)}>
          ⟨ Precedente
        </button>
        <button className="ghost" onClick={() => skipBy(-SKIP_SECONDS)}>
          ⏪ -85s
        </button>
        <button className="ghost" onClick={() => skipBy(SKIP_SECONDS)}>
          Salta +85s ⏩
        </button>
        <button
          className="ghost"
          onClick={() =>
            go({ name: "anime", slug: route.slug, title: route.title })
          }
        >
          Tutti gli episodi
        </button>
        <button disabled={!next} onClick={() => next && playEp(next)}>
          Successivo ⟩
        </button>
      </div>
    </div>
  );
}
