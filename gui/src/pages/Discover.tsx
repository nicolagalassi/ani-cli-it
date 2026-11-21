import { useEffect, useState } from "react";
import { useNav } from "../App";
import { Card, CardSkeletons } from "../components/Card";
import type { AniListMedia } from "../types";

type Tab = "trending" | "popular" | "seasonal";

const TABS: { id: Tab; label: string }[] = [
  { id: "trending", label: "Di tendenza" },
  { id: "popular", label: "Più popolari" },
  { id: "seasonal", label: "Questa stagione" },
];

export function Discover() {
  const { go } = useNav();
  const [tab, setTab] = useState<Tab>("trending");
  const [media, setMedia] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailed(false);
    const fn = tab === "trending" ? window.ani.alTrending : tab === "popular" ? window.ani.alPopular : window.ani.alSeasonal;
    fn().then(
      (m) => {
        if (!alive) return;
        setMedia(m);
        setLoading(false);
      },
      () => {
        if (!alive) return;
        setMedia([]);
        setFailed(true);
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, [tab, attempt]);

  // open the series straight from its MAL id (AniList -> AnimeWorld bridge);
  // titles without one fall back to a text search
  function open(m: AniListMedia) {
    const title = m.title.english || m.title.romaji;
    if (m.idMal) {
      go({
        name: "anime",
        malId: m.idMal,
        titles: [m.title.english, m.title.romaji].filter((t): t is string => !!t),
        title,
        poster: m.coverImage?.extraLarge || m.coverImage?.large || null,
      });
    } else go({ name: "browse", query: m.title.romaji || title });
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Scopri</h1>
          <p className="page-sub">Le classifiche di AniList. Apri un titolo per vederne gli episodi su AnimeWorld.</p>
        </div>
        <div className="seg" role="group" aria-label="Classifica">
          {TABS.map((t) => (
            <button key={t.id} className="seg-btn" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <CardSkeletons count={18} />
      ) : failed ? (
        <div className="notice">
          <strong>AniList non risponde.</strong>
          <span>Controlla la connessione e riprova.</span>
          <button className="btn btn-ghost" onClick={() => setAttempt((a) => a + 1)}>
            Riprova
          </button>
        </div>
      ) : (
        <div className="grid">
          {media.map((m) => (
            <Card
              key={m.id}
              title={m.title.english || m.title.romaji}
              poster={m.coverImage?.extraLarge || m.coverImage?.large || null}
              badge={m.format ? { label: m.format } : null}
              sub={
                [m.averageScore ? `AniList ${m.averageScore}%` : null, m.episodes ? `${m.episodes} ep` : null]
                  .filter(Boolean)
                  .join(" · ") || null
              }
              onClick={() => open(m)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
