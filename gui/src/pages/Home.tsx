import { useEffect, useState } from "react";
import { useNav } from "../App";
import { Card } from "../components/Card";
import type { HistoryEntry, LatestItem, Mode } from "../types";

export function Home() {
  const { go } = useNav();
  const [hist, setHist] = useState<HistoryEntry[]>([]);
  const [mode, setMode] = useState<Mode>("sub");
  const [latest, setLatest] = useState<LatestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.ani.history().then(setHist);
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

  return (
    <div className="page">
      <div className="hero">
        <span className="hero-kicker">ANIMEWORLD · SUB / DUB ITA</span>
        <h1 className="hero-title">La tua dashboard anime.</h1>
        <p className="hero-sub">
          Cerca, riprendi e guarda titoli in italiano — senza il disordine.
        </p>
      </div>

      {hist.length > 0 && (
        <section className="section">
          <h2 className="section-title">▸ Continua a guardare</h2>
          <div className="row">
            {hist.slice(0, 8).map((h) => (
              <Card
                key={h.slug}
                title={h.title}
                poster={h.poster}
                sub={h.lastEp ? `Episodio ${h.lastEp}` : null}
                progress={h.duration ? h.position / h.duration : null}
                onClick={() =>
                  go({ name: "anime", slug: h.slug, title: h.title, poster: h.poster })
                }
              />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">▸ Ultimi episodi</h2>
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
          </div>
        </div>
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
    </div>
  );
}
