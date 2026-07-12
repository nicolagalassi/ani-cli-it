import { useEffect, useState } from "react";
import { useNav } from "../App";
import { Card } from "../components/Card";
import type { AniListMedia } from "../types";

type Tab = "trending" | "popular" | "seasonal";

const TABS: { id: Tab; label: string }[] = [
  { id: "trending", label: "Di tendenza" },
  { id: "popular", label: "Popolari" },
  { id: "seasonal", label: "Stagione" },
];

export function Discover() {
  const { go } = useNav();
  const [tab, setTab] = useState<Tab>("trending");
  const [media, setMedia] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const fn =
      tab === "trending"
        ? window.ani.alTrending
        : tab === "popular"
          ? window.ani.alPopular
          : window.ani.alSeasonal;
    fn().then((m) => {
      if (alive) {
        setMedia(m);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [tab]);

  // clicking an AniList title searches AnimeWorld for it (best-effort match)
  function open(m: AniListMedia) {
    const q = m.title.romaji || m.title.english || "";
    go({ name: "browse", query: q });
  }

  return (
    <div className="page">
      <div className="hero small">
        <span className="hero-kicker">ANILIST · SCOPRI</span>
        <h1 className="hero-title">Scopri nuovi anime.</h1>
        <p className="hero-sub">
          Classifiche da AniList — clicca un titolo per cercarlo su AnimeWorld.
        </p>
      </div>

      <div className="section-head">
        <h2 className="section-title">Classifiche</h2>
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={"tab" + (tab === t.id ? " active" : "")}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Caricamento da AniList…</div>
      ) : (
        <div className="grid">
          {media.map((m) => (
            <Card
              key={m.id}
              title={m.title.english || m.title.romaji}
              poster={m.coverImage?.extraLarge || m.coverImage?.large || null}
              badge={m.format}
              sub={m.averageScore ? `★ ${m.averageScore}%` : null}
              onClick={() => open(m)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
