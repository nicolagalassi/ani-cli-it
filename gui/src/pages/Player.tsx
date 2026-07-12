import { useEffect, useRef, useState } from "react";
import { useNav, type Route } from "../App";
import type { AnimeDetail } from "../types";

export function Player({ route }: { route: Extract<Route, { name: "player" }> }) {
  const { back, go } = useNav();
  const videoRef = useRef<HTMLVideoElement>(null);
  // live position/duration, updated on timeupdate — lets persist() run even
  // after React detaches the video DOM ref on unmount
  const stateRef = useRef({ position: 0, duration: 0 });
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [ep, setEp] = useState(route.ep);
  const [token, setToken] = useState(route.token);

  // load the full episode list (for next/prev + resume position)
  useEffect(() => {
    window.ani.episodes(route.slug).then(setDetail);
  }, [route.slug]);

  // resolve the mp4 for the current token
  useEffect(() => {
    let alive = true;
    setUrl(null);
    setError(null);
    window.ani
      .episodeUrl(token)
      .then((u) => {
        if (!alive) return;
        if (u) setUrl(u);
        else setError("Nessuna sorgente trovata per questo episodio.");
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

  // periodically persist progress
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
  }

  useEffect(() => {
    const id = setInterval(persist, 10000);
    return () => {
      clearInterval(id);
      persist();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep, token, detail]);

  const list = detail?.episodes ?? [];
  const idx = list.findIndex((e) => e.num === ep);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  function playEp(e: { num: string; token: string }) {
    persist();
    stateRef.current = { position: 0, duration: 0 };
    setEp(e.num);
    setToken(e.token);
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
              if (v.duration)
                stateRef.current = {
                  position: v.currentTime,
                  duration: v.duration,
                };
            }}
            onEnded={() => next && playEp(next)}
          />
        )}
      </div>

      <div className="player-controls">
        <button disabled={!prev} onClick={() => prev && playEp(prev)}>
          ⟨ Precedente
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
