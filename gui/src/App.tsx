import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Compass, History as HistoryIcon, House, Search, Settings as SettingsIcon, UserRound } from "lucide-react";
import { Home } from "./pages/Home";
import { Browse } from "./pages/Browse";
import { Discover } from "./pages/Discover";
import { Anime } from "./pages/Anime";
import { Player } from "./pages/Player";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { nextEpisode } from "./lib/episodes";
import { loadSingleKeys, singleKeysEnabled } from "./lib/shortcuts";
import type { AniListViewer } from "./types";

export type Route =
  | { name: "home" }
  | { name: "browse"; query?: string }
  | { name: "discover" }
  | { name: "anime"; slug?: string; malId?: number | null; titles?: string[]; title?: string; dub?: boolean; poster?: string | null }
  | { name: "player"; slug: string; title: string; token: string; ep: string; poster?: string | null }
  | { name: "history" }
  | { name: "settings" };

interface Nav {
  route: Route;
  go: (r: Route) => void;
  back: () => void;
  // swap the top screen's route in place (no remount): the player records the
  // episode it moved to, so Back from another screen reopens the right one
  replaceRoute: (r: Route) => void;
  canGoBack: boolean;
  viewer: AniListViewer | null;
  setViewer: (v: AniListViewer | null) => void;
}

const NavCtx = createContext<Nav>(null!);
export const useNav = () => useContext(NavCtx);

// true while this screen is the visible one; screens below the top stay mounted
// (scroll and data survive "Indietro") and refresh what may have changed when
// they come back
const ActiveCtx = createContext(true);
export const useActive = () => useContext(ActiveCtx);

// play the right episode of a series in one action: resume, next, or first.
// Falls back to the series page when there is nothing new to play.
export function usePlaySeries() {
  const { go } = useNav();
  return useCallback(
    async (slug: string, title: string, poster: string | null) => {
      const [detail, entry] = await Promise.all([
        window.ani.episodes(slug),
        window.ani.getEntry(slug),
      ]);
      const next = nextEpisode(entry, detail.episodes);
      if (!next || next.kind === "rewatch") {
        go({ name: "anime", slug, title, poster });
        return;
      }
      go({
        name: "player",
        slug,
        title: detail.title || title,
        token: next.ep.token,
        ep: next.ep.num,
        poster: detail.poster || poster,
      });
    },
    [go],
  );
}

const NAV = [
  { name: "home", label: "Home", Icon: House },
  { name: "discover", label: "Scopri", Icon: Compass },
  { name: "browse", label: "Cerca", Icon: Search },
  { name: "history", label: "Cronologia", Icon: HistoryIcon },
  { name: "settings", label: "Impostazioni", Icon: SettingsIcon },
] as const;

interface Entry {
  id: number;
  route: Route;
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]';

function isTyping(t: EventTarget | null) {
  return (
    t instanceof HTMLElement &&
    !!t.closest('input, textarea, select, [contenteditable="true"]')
  );
}

// where focus last was, so arrows continue from there when the focused control
// disappears (removed card, disabled button) instead of jumping to the top
let lastFocusRect: DOMRect | null = null;

// arrow-key focus movement for keyboard/TV use: pick the nearest focusable
// element in the pressed direction, preferring ones aligned on the other axis
function moveFocus(dir: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight") {
  const scope = Array.from(
    document.querySelectorAll<HTMLElement>(".rail, .screen:not([hidden])"),
  );
  const all = scope.flatMap((s) => Array.from(s.querySelectorAll<HTMLElement>(FOCUSABLE)));
  const visible = all.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  const from = document.activeElement as HTMLElement | null;
  const lost = !from || from === document.body || !visible.includes(from);
  if (lost && !lastFocusRect) {
    // start on the screen's main action (or its first button), not on a text field
    const first =
      visible.find((el) => el.matches("[data-primary]")) ??
      visible.find((el) => el.tagName === "BUTTON" && el.closest(".screen")) ??
      visible.find((el) => el.closest(".screen")) ??
      visible[0];
    first?.focus();
    return;
  }
  const a = lost ? lastFocusRect! : from!.getBoundingClientRect();
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of visible) {
    if (el === from) continue;
    const b = el.getBoundingClientRect();
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    let main: number;
    let cross: number;
    let overlap: boolean;
    if (dir === "ArrowRight" || dir === "ArrowLeft") {
      main = dir === "ArrowRight" ? b.left - a.right : a.left - b.right;
      if (main < -4) continue;
      overlap = b.bottom > a.top && b.top < a.bottom;
      cross = Math.abs(by - ay);
    } else {
      main = dir === "ArrowDown" ? b.top - a.bottom : a.top - b.bottom;
      if (main < -4) continue;
      overlap = b.right > a.left && b.left < a.right;
      cross = Math.abs(bx - ax);
    }
    const score = Math.max(main, 0) + (overlap ? 0 : 1000) + cross * 0.6;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  if (!best && lost) best = visible.find((el) => el.matches("[data-primary]")) ?? visible[0] ?? null;
  if (best) {
    best.focus({ preventScroll: true });
    best.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

function Screen({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useRef(0);
  const focused = useRef<HTMLElement | null>(null);
  // display:none drops the scroll offset and focus; restore both when the screen returns
  useLayoutEffect(() => {
    if (!active || !ref.current) return;
    ref.current.scrollTop = scroll.current;
    if (focused.current?.isConnected) focused.current.focus({ preventScroll: true });
  }, [active]);
  return (
    <div
      ref={ref}
      className="screen"
      hidden={!active}
      onScroll={(e) => {
        if (active) scroll.current = e.currentTarget.scrollTop;
      }}
      onFocus={(e) => {
        if (active) focused.current = e.target as HTMLElement;
      }}
    >
      <ActiveCtx.Provider value={active}>{children}</ActiveCtx.Provider>
    </div>
  );
}

function renderRoute(route: Route) {
  switch (route.name) {
    case "home":
      return <Home />;
    case "discover":
      return <Discover />;
    case "browse":
      return <Browse initialQuery={route.query} />;
    case "anime":
      return <Anime route={route} />;
    case "player":
      return <Player route={route} />;
    case "history":
      return <History />;
    case "settings":
      return <Settings />;
  }
}

export function App() {
  const nextId = useRef(1);
  const [stack, setStack] = useState<Entry[]>([{ id: 0, route: { name: "home" } }]);
  const [viewer, setViewer] = useState<AniListViewer | null>(null);
  const route = stack[stack.length - 1].route;
  const rootName = stack[0].route.name;

  const go = useCallback(
    (r: Route) => setStack((s) => [...s, { id: nextId.current++, route: r }]),
    [],
  );
  const back = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  );
  const replaceRoute = useCallback(
    (r: Route) => setStack((s) => [...s.slice(0, -1), { id: s[s.length - 1].id, route: r }]),
    [],
  );
  const reset = useCallback(
    (r: Route) => setStack([{ id: nextId.current++, route: r }]),
    [],
  );

  useEffect(() => {
    window.ani.alViewer().then(setViewer).catch(() => setViewer(null));
    loadSingleKeys().catch(() => {});
    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement) lastFocusRect = e.target.getBoundingClientRect();
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  // window title names the screen (and the series or episode when there is one)
  useEffect(() => {
    const label =
      route.name === "player"
        ? `${route.title} · Ep ${route.ep}`
        : route.name === "anime"
          ? route.title ?? "Scheda"
          : NAV.find((n) => n.name === route.name)?.label ?? "";
    document.title = label ? `${label} · Animix ITA` : "Animix ITA";
  }, [route]);

  // app-wide keys; the player owns its own keys, text fields keep theirs
  const stateRef = useRef({ route, depth: stack.length });
  stateRef.current = { route, depth: stack.length };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const { route: r, depth } = stateRef.current;
      const inPlayer = r.name === "player";
      const typing = isTyping(e.target);
      if (e.key === "Escape") {
        // first Esc leaves a text field, the next one goes back
        if (typing) {
          (e.target as HTMLElement).blur();
          return;
        }
        if (inPlayer && document.fullscreenElement) return;
        if (depth > 1) {
          e.preventDefault();
          back();
        }
        return;
      }
      const isArrow = e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight";
      if (inPlayer) {
        // in the player, arrows seek/change volume on the video; elsewhere
        // (Indietro, episode strip, error buttons) they move focus
        const outside =
          e.target instanceof HTMLElement && e.target !== document.body && !e.target.closest(".player-stage");
        if (!(isArrow && outside)) return;
      }
      if (e.key === "/" && !typing && singleKeysEnabled()) {
        e.preventDefault();
        if (r.name === "browse") window.dispatchEvent(new Event("animix:focus-search"));
        else go({ name: "browse" }); // stacked, so Esc returns where you were
        return;
      }
      if (isArrow) {
        if (typing) {
          // up/down leave single-line text fields (left/right stay with the caret);
          // a closed select must not change value on arrows (Alt+Down, Enter or
          // Space open it); number fields and sliders keep their arrows
          const el = e.target as HTMLElement;
          const isSelect = el instanceof HTMLSelectElement;
          const textLine = el instanceof HTMLInputElement && !["number", "range"].includes(el.type);
          if (!isSelect && (!textLine || e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
        }
        e.preventDefault();
        moveFocus(e.key);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [back, go]);

  return (
    <NavCtx.Provider value={{ route, go, back, replaceRoute, canGoBack: stack.length > 1, viewer, setViewer }}>
      <div className={"app" + (route.name === "player" ? " app--player" : "")}>
        <nav className="rail" aria-label="Sezioni">
          <div className="wordmark">
            <span className="wordmark-name">Animix</span>
            <span className="wordmark-ita">ITA</span>
          </div>
          <ul className="rail-list">
            {NAV.map(({ name, label, Icon }) => {
              const current = rootName === name;
              return (
                <li key={name}>
                  <button
                    className={"rail-item" + (current ? " is-current" : "")}
                    aria-current={current ? "page" : undefined}
                    aria-label={label}
                    title={label}
                    onClick={() => reset({ name } as Route)}
                  >
                    <Icon aria-hidden="true" className="ico" />
                    <span className="rail-label">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            className="rail-account"
            title={viewer ? `AniList: ${viewer.name}` : "Collega AniList"}
            onClick={() => reset({ name: "settings" })}
          >
            {viewer?.avatar?.medium ? (
              <img src={viewer.avatar.medium} alt="" />
            ) : (
              <span className="rail-account-ico">
                <UserRound aria-hidden="true" className="ico" />
              </span>
            )}
            <span className="rail-label">
              <span className="rail-account-name">{viewer ? viewer.name : "Collega AniList"}</span>
              <span className="rail-account-sub">{viewer ? "AniList" : "Non collegato"}</span>
            </span>
          </button>
        </nav>
        <main className="stage">
          {stack.map((e, i) => {
            const top = i === stack.length - 1;
            // the player saves progress on unmount and owns document keys:
            // it never stays mounted beneath another screen
            if (!top && e.route.name === "player") return null;
            return (
              <Screen key={e.id} active={top}>
                {renderRoute(e.route)}
              </Screen>
            );
          })}
        </main>
      </div>
    </NavCtx.Provider>
  );
}
