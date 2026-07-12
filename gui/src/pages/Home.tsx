import { useEffect, useState, type ReactNode } from "react";
import { useNav } from "../App";
import { Card } from "../components/Card";
import type { HistoryEntry, LatestItem, Mode, AniListEntry, AniListViewer } from "../types";

type SectionId = "continue" | "latest" | "anilist";
const DEFAULT_ORDER: SectionId[] = ["continue", "latest", "anilist"];

export function Home() {
  const { go } = useNav();
  const [hist, setHist] = useState<HistoryEntry[]>([]);
  const [mode, setMode] = useState<Mode>("sub");
  const [latest, setLatest] = useState<LatestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<AniListViewer | null>(null);
  const [watching, setWatching] = useState<AniListEntry[]>([]);
  const [order, setOrder] = useState<SectionId[]>(DEFAULT_ORDER);

  function reloadHistory() {
    window.ani.history().then(setHist);
  }

  useEffect(() => {
    reloadHistory();
    window.ani.alViewer().then((v) => {
      setViewer(v);
      if (v) window.ani.alUserList("CURRENT").then(setWatching);
    });
    window.ani.settings().then((s) => {
      const saved = s.homeSectionOrder as SectionId[] | undefined;
      if (Array.isArray(saved) && saved.length === DEFAULT_ORDER.length) {
        setOrder(saved);
      }
    });
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    window.ani.latest(mode).then((l) => {
      if (alive) {
        setLatest(l);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [mode]);

  async function removeEntry(slug: string) {
    await window.ani.removeEntry(slug);
    reloadHistory();
  }

  // move a section up (-1) or down (+1) and persist the order
  function move(id: SectionId, dir: -1 | 1) {
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      window.ani.setSetting("homeSectionOrder", next);
      return next;
    });
  }

  // header with reorder controls
  function head(id: SectionId, title: string, extra?: ReactNode) {
    const i = order.indexOf(id);
    return (
      <div className="section-head">
        <div className="section-title-wrap">
          <h2 className="section-title">{title}</h2>
          <span className="reorder">
            <button
              className="reorder-btn"
              title="Sposta su"
              disabled={i <= 0}
              onClick={() => move(id, -1)}
            >
              ↑
            </button>
            <button
              className="reorder-btn"
              title="Sposta giù"
              disabled={i >= order.length - 1}
              onClick={() => move(id, 1)}
            >
              ↓
            </button>
          </span>
        </div>
        {extra}
      </div>
    );
  }

  const sections: Record<SectionId, () => ReactNode> = {
    continue: () =>
      hist.length > 0 ? (
        <section className="section" key="continue">
          {head("continue", "▸ Continua a guardare")}
          <div className="row">
            {hist.slice(0, 12).map((h) => (
              <Card
                key={h.slug}
                title={h.title}
                poster={h.poster}
                sub={h.lastEp ? `Episodio ${h.lastEp}` : null}
                progress={h.duration ? h.position / h.duration : null}
                onClick={() =>
                  go({ name: "anime", slug: h.slug, title: h.title, poster: h.poster })
                }
                onRemove={() => removeEntry(h.slug)}
              />
            ))}
          </div>
        </section>
      ) : null,

    anilist: () =>
      viewer && watching.length > 0 ? (
        <section className="section" key="anilist">
          {head("anilist", "▸ In visione su AniList")}
          <div className="row">
            {watching.map((e) => (
              <Card
                key={e.media.id}
                title={e.media.title.english || e.media.title.romaji}
                poster={e.media.coverImage?.large || null}
                badge={e.media.format}
                sub={`Ep ${e.progress}${e.media.episodes ? " / " + e.media.episodes : ""}`}
                onClick={() =>
                  go({
                    name: "browse",
                    query: e.media.title.romaji || e.media.title.english || "",
                  })
                }
              />
            ))}
          </div>
        </section>
      ) : null,

    latest: () => (
      <section className="section" key="latest">
        {head(
          "latest",
          "▸ Ultimi episodi",
          <div className="tabs">
            <button
              className={"tab" + (mode === "sub" ? " active" : "")}
              onClick={() => setMode("sub")}
            >
              Sub ITA
            </button>
            <button
              className={"tab" + (mode === "dub" ? " active" : "")}
              onClick={() => setMode("dub")}
            >
              Dub ITA
            </button>
          </div>,
        )}
        {loading ? (
          <div className="loading">Caricamento…</div>
        ) : (
          <div className="grid">
            {latest.map((l) => (
              <Card
                key={`${l.slug}#${l.ep}`}
                title={l.title}
                poster={l.poster}
                badge={`Ep ${l.ep}`}
                onClick={() =>
                  go({
                    name: "player",
                    slug: l.slug,
                    title: l.title,
                    token: l.token,
                    ep: l.ep,
                    poster: l.poster,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>
    ),
  };

  return (
    <div className="page">
      <div className="hero">
        <span className="hero-kicker">
          {viewer ? `ANILIST · ${viewer.name.toUpperCase()}` : "ANIMEWORLD · SUB / DUB ITA"}
        </span>
        <h1 className="hero-title">La tua dashboard anime.</h1>
        <p className="hero-sub">
          Cerca, riprendi e guarda titoli in italiano — senza il disordine.
        </p>
      </div>

      {order.map((id) => sections[id]())}
    </div>
  );
}
