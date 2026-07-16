import { useEffect, useRef, useState } from "react";
import { useNav, type Route } from "../App";
import type { AnimeDetail, SkipTimes } from "../types";

// Material-style monochrome icons (inherit currentColor)
const ICONS: Record<string, string> = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  prev: "M6 6h2v12H6zm3.5 6 8.5 6V6z",
  next: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  rewind: "M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z",
  forward: "M4 18l8.5-6L4 6v12zm9-12v12l8.5-6-8.5-6z",
  volume:
    "M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  muted:
    "M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4 9.91 6.09 12 8.18V4z",
  fsEnter: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z",
  fsExit: "M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z",
};

function Icon({ name }: { name: string }) {
  return (
    <svg className="np-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}
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
  // custom-controls state (native controls are hidden so buttons work in fullscreen)
  const stageRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fs, setFs] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);

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

  // track fullscreen state (fullscreen is requested on the stage wrapper so the
  // custom controls overlay stays visible)
  useEffect(() => {
    const onFs = () => setFs(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // keyboard shortcuts (work in fullscreen): space, f, m, ←/→ 5s, o = +85s
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
        case "o":
          skipBy(SKIP_SECONDS);
          break;
        case "ArrowRight":
          skipBy(5);
          break;
        case "ArrowLeft":
          skipBy(-5);
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // auto-hide the controls after inactivity while playing
  function showUi() {
    setUiVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setUiVisible(false);
    }, 3000);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  function changeVolume(val: number) {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  }
  function seekTo(fraction: number) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.max(0, Math.min(v.duration, fraction * v.duration));
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else stageRef.current?.requestFullscreen().catch(() => {});
  }
  function fmtTime(s: number) {
    if (!isFinite(s) || s < 0) s = 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
    return (h > 0 ? h + ":" : "") + mm + ":" + String(sec).padStart(2, "0");
  }

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

  // contextual overlay button: intro -> skip OP; outro -> go to next episode (Netflix-style)
  const opActive =
    !!skip?.op && curTime >= skip.op.start && curTime < skip.op.end;
  const edActive =
    !!skip?.ed && curTime >= skip.ed.start && curTime < skip.ed.end;
  const overlayAction = opActive
    ? { kind: "intro" as const, label: "Salta intro" }
    : edActive && next
      ? { kind: "next" as const, label: "Prossimo episodio" }
      : edActive
        ? { kind: "outro" as const, label: "Salta sigla" }
        : null;

  function doOverlay() {
    if (!overlayAction) return;
    if (overlayAction.kind === "next" && next) {
      playEp(next);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    if (overlayAction.kind === "intro" && skip?.op) v.currentTime = skip.op.end + 0.3;
    else if (overlayAction.kind === "outro" && skip?.ed) v.currentTime = skip.ed.end + 0.3;
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

  const progress = duration ? (curTime / duration) * 100 : 0;

  return (
    <div className="page player-page">
      <button className="back" onClick={back}>
        ← Indietro
      </button>
      <div className="player-head">
        <h1 className="player-title">{detail?.title ?? route.title}</h1>
        <span className="pill">Episodio {ep}</span>
      </div>

      <div
        ref={stageRef}
        className={"player-stage" + (uiVisible || !playing ? " ui" : "")}
        onMouseMove={showUi}
        onMouseLeave={() => playing && setUiVisible(false)}
      >
        {error ? (
          <div className="player-error">{error}</div>
        ) : !url ? (
          <div className="player-loading">
            <div className="spinner" />
            <div>Caricamento episodio {ep}…</div>
            <div className="dim">Recupero sorgente da AnimeWorld…</div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={url}
              autoPlay
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
              onPlay={() => {
                setPlaying(true);
                showUi();
              }}
              onPause={() => setPlaying(false)}
              onVolumeChange={(e) => {
                setVolume(e.currentTarget.volume);
                setMuted(e.currentTarget.muted);
              }}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
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

            {/* contextual overlay: skip intro / go to next episode (Netflix-style) */}
            {overlayAction && (
              <button
                className={"overlay-action" + (overlayAction.kind === "next" ? " is-next" : "")}
                onClick={doOverlay}
              >
                {overlayAction.label}
                <Icon name={overlayAction.kind === "next" ? "next" : "forward"} />
              </button>
            )}

            {/* custom control overlay (visible in fullscreen too) */}
            <div className="np-controls">
              <div
                className="np-seek"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  seekTo((e.clientX - r.left) / r.width);
                }}
              >
                <div className="np-seek-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="np-bar">
                <button className="np-btn" onClick={togglePlay} title="Play / Pausa (Spazio)">
                  <Icon name={playing ? "pause" : "play"} />
                </button>
                <button className="np-btn" disabled={!prev} onClick={() => prev && playEp(prev)} title="Episodio precedente">
                  <Icon name="prev" />
                </button>
                <button className="np-btn" disabled={!next} onClick={() => next && playEp(next)} title="Episodio successivo">
                  <Icon name="next" />
                </button>
                <span className="np-sep" />
                <button className="np-btn" onClick={() => skipBy(-SKIP_SECONDS)} title="Torna indietro 85s">
                  <Icon name="rewind" />
                </button>
                <button className="np-btn np-skip" onClick={() => skipBy(SKIP_SECONDS)} title="Salta intro (+85s)">
                  <Icon name="forward" />
                </button>
                <span className="np-time">
                  {fmtTime(curTime)} / {fmtTime(duration)}
                </span>
                <span className="np-spacer" />
                <button className="np-btn" onClick={toggleMute} title="Muto (M)">
                  <Icon name={muted || volume === 0 ? "muted" : "volume"} />
                </button>
                <input
                  className="np-vol"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  title="Volume"
                />
                <button className="np-btn" onClick={toggleFullscreen} title="Schermo intero (F)">
                  <Icon name={fs ? "fsExit" : "fsEnter"} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="player-controls">
        <button
          className="ghost"
          onClick={() => go({ name: "anime", slug: route.slug, title: route.title })}
        >
          Tutti gli episodi
        </button>
      </div>
    </div>
  );
}
