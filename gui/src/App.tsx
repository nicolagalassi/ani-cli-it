import { createContext, useContext, useState, useCallback } from "react";
import { Home } from "./pages/Home";
import { Browse } from "./pages/Browse";
import { Anime } from "./pages/Anime";
import { Player } from "./pages/Player";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";

export type Route =
  | { name: "home" }
  | { name: "browse" }
  | { name: "anime"; slug: string; title?: string; dub?: boolean; poster?: string | null }
  | { name: "player"; slug: string; title: string; token: string; ep: string; poster?: string | null }
  | { name: "history" }
  | { name: "settings" };

interface Nav {
  route: Route;
  go: (r: Route) => void;
  back: () => void;
}

const NavCtx = createContext<Nav>(null!);
export const useNav = () => useContext(NavCtx);

const NAV = [
  { name: "home", label: "Home", icon: "\u2302" },
  { name: "browse", label: "Cerca", icon: "\u2315" },
  { name: "history", label: "Cronologia", icon: "\u21BB" },
  { name: "settings", label: "Impostazioni", icon: "\u2699" },
] as const;

export function App() {
  const [stack, setStack] = useState<Route[]>([{ name: "home" }]);
  const route = stack[stack.length - 1];

  const go = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const back = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  );
  const reset = useCallback((r: Route) => setStack([r]), []);

  return (
    <NavCtx.Provider value={{ route, go, back }}>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <span className="logo">AniPlay</span>
            <span className="brand-tag">ITA</span>
            <span className="brand-sub">senza il disordine</span>
          </div>
          <nav className="nav">
            {NAV.map((n) => (
              <button
                key={n.name}
                className={"nav-btn" + (route.name === n.name ? " active" : "")}
                onClick={() => reset({ name: n.name } as Route)}
              >
                <span className="nav-ico">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>
        </header>
        <main className="content">
          {route.name === "home" && <Home />}
          {route.name === "browse" && <Browse />}
          {route.name === "anime" && <Anime route={route} />}
          {route.name === "player" && <Player route={route} />}
          {route.name === "history" && <History />}
          {route.name === "settings" && <Settings />}
        </main>
      </div>
    </NavCtx.Provider>
  );
}
