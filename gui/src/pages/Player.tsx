import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import {
  ArrowLeft,
  ListVideo,
  Maximize,
  Minimize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNav, type Route } from "../App";
import { epNumeral, fmtTime, isDub } from "../lib/episodes";
import { paintVar, resolvePaint } from "../lib/paint";
import { Tag } from "../components/Card";
import type { AnimeDetail, SkipTimes } from "../types";
import { singleKeysEnabled } from "../lib/shortcuts";

// manual fixed skip (like the AnimeWorld Better Player extension: O key)
const SKIP_SECONDS = 85;
const STRIP_RADIUS = 40; // episodes shown each side of the current one

export function Player({ route }: { route: Extract<Route, { name: "player" }> }) {
  const { back, go, replaceRoute } = useNav();
  const videoRef = useRef<HTMLVideoElement>(null);
  // live position/duration, updated on timeupdate — lets persist() run even
  // after React detaches the video DOM ref on unmount
  const stateRef = useRef({ position: 0, duration: 0 });
  // cache of resolved mp4 URLs per episode token (enables instant switching)
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  const preloadVidRef = useRef<HTMLVideoElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0); // bump to re-resolve the source
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [ep, setEp] = useState(route.ep);
  const [token, setToken] = useState(route.token);
  const [skip, setSkip] = useState<SkipTimes | null>(null);
  const [curTime, setCurTime] = useState(0);
  const [paint, setPaint] = useState<string | null>(null);
  // custom-controls state (native controls are hidden so buttons work in fullscreen)
  const stageRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const volTimerRef = useRef<number | undefined>(undefined);
  const volRef = useRef({ volume: 1, muted: false });
  const volPendingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fs, setFs] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [hover, setHover] = useState<number | null>(null); // 0..1 under the pointer
  const [drag, setDrag] = useState<number | null>(null); // 0..1 while dragging

  // load the full episode list (for next/prev + resume position)
  useEffect(() => {
    window.ani.episodes(route.slug).then(setDetail).catch(() => {});
    window.ani.getEntry(route.slug).then((e) => setWatched(new Set(e?.watched ?? [])));
  }, [route.slug]);

  // the series paint colours the progress bar
  useEffect(() => {
    if (!detail) return;
    let alive = true;
    resolvePaint(route.slug, detail.malId).then((p) => alive && setPaint(p));
    return () => {
      alive = false;
    };
  }, [detail, route.slug]);

  // remembered volume
  useEffect(() => {
    window.ani.settings().then((s) => {
      const v = typeof s.volume === "number" ? Math.max(0, Math.min(1, s.volume)) : 1;
      const m = s.muted === true;
      volRef.current = { volume: v, muted: m };
      setVolume(v);
      setMuted(m);
      const el = videoRef.current;
      if (el) {
        el.volume = v;
        el.muted = m;
      }
    });
  }, []);

  // fetch OP/ED skip times for the current episode (needs the MAL id)
  useEffect(() => {
    setSkip(null);
    if (detail?.malId) window.ani.skipTimes(detail.malId, ep).then(setSkip).catch(() => {});
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
        } else setError("AnimeWorld non ha una sorgente per questo episodio.");
      })
      .catch(() => alive && setError("Non riesco a raggiungere AnimeWorld."));
    return () => {
      alive = false;
    };
  }, [token, attempt]);

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
    if (detail?.malId && position / duration > 0.9 && pushedRef.current !== ep) {
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

  // keep the stacked route on the episode being played (see replaceRoute)
  useEffect(() => {
    if (ep !== route.ep || token !== route.token) replaceRoute({ ...route, ep, token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep, token]);

  // remove the hidden preload <video> when leaving the player
  useEffect(() => {
    return () => {
      preloadVidRef.current?.remove();
      preloadVidRef.current = null;
      clearTimeout(hideTimerRef.current);
      clearTimeout(volTimerRef.current);
      // a volume change made just before leaving is still saved
      if (volPendingRef.current) {
        window.ani.setSetting("volume", volRef.current.volume);
        window.ani.setSetting("muted", volRef.current.muted);
      }
    };
  }, []);

  // track fullscreen state (fullscreen is requested on the stage wrapper so the
  // custom controls overlay stays visible)
  useEffect(() => {
    const onFs = () => setFs(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const list = detail?.episodes ?? [];
  const idx = list.findIndex((e) => e.num === ep);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  // contextual overlay button: intro -> skip OP; outro -> go to next episode (Netflix-style)
  const opActive = !!skip?.op && curTime >= skip.op.start && curTime < skip.op.end;
  const edActive = !!skip?.ed && curTime >= skip.ed.start && curTime < skip.ed.end;
  // near the end even without ED data (some episodes have no proper ending, just
  // a final scene): last 90s and past 80% -> still offer "next episode"
  const nearEnd = duration > 0 && curTime >= duration - 90 && curTime >= duration * 0.8;
  const overlayAction = opActive
    ? { kind: "intro" as const, label: "Salta la sigla" }
    : next && (edActive || nearEnd)
      ? { kind: "next" as const, label: `Episodio ${next.num}` }
      : edActive
        ? { kind: "outro" as const, label: "Salta la sigla finale" }
        : null;

  // the [] keydown handler reaches this render's values and functions through
  // a ref (playEp/persist close over ep, token, detail; doOverlay over skip)
  const live = useRef({ prev, next, overlayAction, playEp, doOverlay });

  // keyboard shortcuts (work in fullscreen)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== "range") return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const isArrow = e.key.startsWith("Arrow");
      const t = e.target instanceof HTMLElement ? e.target : null;
      // arrows act on the video only from the page or the stage; the volume
      // slider keeps its own arrows; elsewhere the app moves focus
      if (isArrow && t && t !== document.body && (!stageRef.current?.contains(t) || t.matches('input[type="range"]'))) return;
      // letter shortcuts can be switched off in Settings (Space and arrows stay)
      if (e.key.length === 1 && e.key !== " " && !singleKeysEnabled()) return;
      const { prev: p, next: n, overlayAction: o, playEp: play, doOverlay: overlay } = live.current;
      // episode switching works even while the source is loading or failed
      if (e.key === "n" || e.key === "p") {
        const target = e.key === "n" ? n : p;
        if (target) play(target);
        return;
      }
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case " ":
          // a focused button handles Space itself; toggling here too would undo it
          if (e.target instanceof HTMLElement && e.target.closest("button, a")) return;
          e.preventDefault();
          togglePlay();
          break;
        case "k":
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
        case "s":
          if (o) overlay(o.kind);
          break;
        case "Home":
          if (!t?.closest(".np-seek")) return;
          e.preventDefault();
          v.currentTime = 0;
          break;
        case "End":
          if (!t?.closest(".np-seek")) return;
          e.preventDefault();
          v.currentTime = Math.max(0, (v.duration || 0) - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          skipBy(5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipBy(-5);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(Math.min(1, (v.muted ? 0 : v.volume) + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(Math.max(0, v.volume - 0.1));
          break;
        default:
          return;
      }
      showUi();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-hide the controls after inactivity while playing
  function showUi() {
    setUiVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      // keep the controls up while a control has keyboard focus
      if (stageRef.current?.querySelector(":focus-visible")) return;
      if (videoRef.current && !videoRef.current.paused) setUiVisible(false);
    }, 3000);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }
  function saveVolume() {
    clearTimeout(volTimerRef.current);
    volPendingRef.current = true;
    volTimerRef.current = window.setTimeout(() => {
      volPendingRef.current = false;
      window.ani.setSetting("volume", volRef.current.volume);
      window.ani.setSetting("muted", volRef.current.muted);
    }, 500);
  }
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.5;
    volRef.current = { volume: v.volume, muted: v.muted };
    setMuted(v.muted);
    setVolume(v.volume);
    saveVolume();
  }
  function changeVolume(val: number) {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    volRef.current = { volume: val, muted: val === 0 };
    setVolume(val);
    setMuted(val === 0);
    saveVolume();
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
  function skipBy(delta: number) {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration || 0;
    v.currentTime = Math.max(0, Math.min(d, v.currentTime + delta));
  }

  function playEp(e: { num: string; token: string }) {
    persist();
    stateRef.current = { position: 0, duration: 0 };
    setCurTime(0);
    setWatched((w) => new Set(w).add(ep));
    setEp(e.num);
    setToken(e.token);
  }

  function doOverlay(kind: "intro" | "next" | "outro") {
    const n = live.current.next;
    if (kind === "next" && n) {
      playEp(n);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    if (kind === "intro" && skip?.op) v.currentTime = skip.op.end + 0.3;
    else if (kind === "outro" && skip?.ed) v.currentTime = skip.ed.end + 0.3;
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

  live.current = { prev, next, overlayAction, playEp, doOverlay };

  // seek bar: dragging shows the target and seeks once on release
  function fracAt(e: RPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  }

  const shownFrac = drag ?? (duration ? curTime / duration : 0);
  const tipFrac = drag ?? hover;
  const dub = isDub(route.slug, detail?.title ?? route.title);
  const stripFrom = Math.max(0, idx - STRIP_RADIUS);
  const strip = idx >= 0 ? list.slice(stripFrom, idx + STRIP_RADIUS + 1) : list.slice(0, STRIP_RADIUS * 2);

  return (
    <div className="page">
      <div className="player-head">
        <button className="btn btn-ghost" onClick={back}>
          <ArrowLeft aria-hidden="true" className="ico" />
          Indietro
        </button>
        <h1 className="player-title">{detail?.title ?? route.title}</h1>
        <span className="player-ep">EP {epNumeral(ep)}</span>
        <Tag tone={dub ? "dub" : "sub"}>{dub ? "Dub ITA" : "Sub ITA"}</Tag>
        <span className="spacer" />
        <button
          className="btn btn-ghost"
          onClick={() => go({ name: "anime", slug: route.slug, title: route.title, poster: route.poster })}
        >
          <ListVideo aria-hidden="true" className="ico" />
          Scheda della serie
        </button>
      </div>

      <div
        ref={stageRef}
        className={"player-stage" + (uiVisible || !playing ? " ui" : "")}
        style={paintVar(paint)}
        onMouseMove={showUi}
        onMouseLeave={() => playing && setUiVisible(false)}
      >
        {error ? (
          <div className="player-error" role="alert">
            <strong>{error}</strong>
            <span>Riprova tra poco, oppure controlla il dominio di AnimeWorld in Impostazioni.</span>
            <div className="btn-row">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  urlCacheRef.current.delete(token);
                  setAttempt((a) => a + 1);
                }}
              >
                Riprova
              </button>
              {next && (
                <button className="btn btn-ghost" onClick={() => playEp(next)}>
                  Passa all'episodio {next.num}
                </button>
              )}
            </div>
          </div>
        ) : !url ? (
          <div className="player-loading" role="status">
            <div className="loader" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <strong>Episodio {ep}</strong>
            <span>Recupero il video da AnimeWorld…</span>
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
              onPause={() => {
                setPlaying(false);
                setUiVisible(true);
              }}
              onVolumeChange={(e) => {
                setVolume(e.currentTarget.volume);
                setMuted(e.currentTarget.muted);
              }}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                v.volume = volRef.current.volume;
                v.muted = volRef.current.muted;
                setDuration(v.duration || 0);
              }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                setCurTime(v.currentTime);
                if (v.duration) {
                  stateRef.current = { position: v.currentTime, duration: v.duration };
                  if (v.currentTime / v.duration >= 0.75) preloadNext();
                }
              }}
              onEnded={() => next && playEp(next)}
            />

            {/* contextual overlay: skip intro / go to next episode */}
            {overlayAction && (
              <button
                className={"overlay-action" + (overlayAction.kind === "next" ? " is-next" : "")}
                onClick={() => doOverlay(overlayAction.kind)}
              >
                <SkipForward aria-hidden="true" className="ico" />
                {overlayAction.label}
                <kbd className="kbd">S</kbd>
              </button>
            )}

            {/* custom control overlay (visible in fullscreen too) */}
            <div className="np-controls">
              <div
                className={"np-seek" + (drag != null ? " dragging" : "")}
                role="slider"
                tabIndex={0}
                aria-label="Posizione nell'episodio"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(curTime)}
                aria-valuetext={`${fmtTime(curTime)} di ${fmtTime(duration)}`}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDrag(fracAt(e));
                }}
                onPointerMove={(e) => {
                  const f = fracAt(e);
                  setHover(f);
                  if (drag != null) setDrag(f);
                }}
                onPointerUp={(e) => {
                  if (drag != null) seekTo(fracAt(e));
                  setDrag(null);
                }}
                onPointerCancel={() => setDrag(null)}
                onLostPointerCapture={() => setDrag(null)}
                onPointerLeave={() => setHover(null)}
              >
                <div className="np-seek-fill" style={{ width: `${shownFrac * 100}%` }} />
                <div className="np-seek-thumb" style={{ left: `${shownFrac * 100}%` }} />
                {tipFrac != null && duration > 0 && (
                  <div className="np-seek-tip" style={{ left: `${tipFrac * 100}%` }}>
                    {fmtTime(tipFrac * duration)}
                  </div>
                )}
              </div>
              <div className="np-bar">
                <button
                  className="np-btn"
                  onClick={togglePlay}
                  aria-label={playing ? "Pausa" : "Riproduci"}
                  title="Play / pausa (Spazio)"
                >
                  {playing ? <Pause aria-hidden="true" className="ico" /> : <Play aria-hidden="true" className="ico" />}
                </button>
                <button
                  className="np-btn"
                  disabled={!prev}
                  onClick={() => prev && playEp(prev)}
                  aria-label="Episodio precedente"
                  title="Episodio precedente (P)"
                >
                  <SkipBack aria-hidden="true" className="ico" />
                </button>
                <button
                  className="np-btn"
                  disabled={!next}
                  onClick={() => next && playEp(next)}
                  aria-label="Episodio successivo"
                  title="Episodio successivo (N)"
                >
                  <SkipForward aria-hidden="true" className="ico" />
                </button>
                <span className="np-sep" />
                <button
                  className="np-btn np-skip"
                  onClick={() => skipBy(-SKIP_SECONDS)}
                  aria-label={`−${SKIP_SECONDS}s: indietro di ${SKIP_SECONDS} secondi`}
                  title={`Indietro di ${SKIP_SECONDS} secondi`}
                >
                  −{SKIP_SECONDS}s
                </button>
                <button
                  className="np-btn np-skip"
                  onClick={() => skipBy(SKIP_SECONDS)}
                  aria-label={`+${SKIP_SECONDS}s: avanti di ${SKIP_SECONDS} secondi`}
                  title={`Avanti di ${SKIP_SECONDS} secondi, per saltare la sigla (O)`}
                >
                  +{SKIP_SECONDS}s
                </button>
                <span className="np-time">
                  {fmtTime(curTime)} / {fmtTime(duration)}
                </span>
                <span className="np-spacer" />
                <button
                  className="np-btn"
                  onClick={toggleMute}
                  aria-label={muted ? "Riattiva l'audio" : "Disattiva l'audio"}
                  title="Muto (M)"
                >
                  {muted || volume === 0 ? (
                    <VolumeX aria-hidden="true" className="ico" />
                  ) : (
                    <Volume2 aria-hidden="true" className="ico" />
                  )}
                </button>
                <input
                  className="np-vol"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  aria-label="Volume"
                />
                <button
                  className="np-btn"
                  onClick={toggleFullscreen}
                  aria-label={fs ? "Esci dallo schermo intero" : "Schermo intero"}
                  title="Schermo intero (F)"
                >
                  {fs ? <Minimize aria-hidden="true" className="ico" /> : <Maximize aria-hidden="true" className="ico" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {strip.length > 1 && (
        <nav className="ep-strip" aria-label="Episodi">
          {strip.map((e) => (
            <button
              key={e.num}
              aria-current={e.num === ep ? "true" : undefined}
              className={watched.has(e.num) && e.num !== ep ? "is-watched" : undefined}
              aria-label={`Episodio ${e.num}${watched.has(e.num) ? ", visto" : ""}`}
              onClick={() => e.num !== ep && playEp(e)}
            >
              {e.num}
            </button>
          ))}
        </nav>
      )}

      <div className="player-foot">
        <p className="shortcuts">
          <kbd className="kbd">Spazio</kbd> pausa · <kbd className="kbd">←</kbd>
          <kbd className="kbd">→</kbd> 5s · <kbd className="kbd">↑</kbd>
          <kbd className="kbd">↓</kbd> volume ·{" "}
          {singleKeysEnabled() && (
            <>
              <kbd className="kbd">O</kbd> +{SKIP_SECONDS}s · <kbd className="kbd">S</kbd> salta ·{" "}
              <kbd className="kbd">N</kbd>/<kbd className="kbd">P</kbd> episodio · <kbd className="kbd">F</kbd> schermo
              intero ·{" "}
            </>
          )}
          <kbd className="kbd">Esc</kbd> indietro
        </p>
      </div>
    </div>
  );
}
