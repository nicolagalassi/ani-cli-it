import { useEffect, useState } from "react";
import { useNav } from "../App";
import { Card } from "../components/Card";
import type { HistoryEntry } from "../types";

export function History() {
  const { go } = useNav();
  const [hist, setHist] = useState<HistoryEntry[]>([]);

  const reload = () => window.ani.history().then(setHist);
  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="page">
      <div className="section-head">
        <h1 className="page-title">Cronologia</h1>
        {hist.length > 0 && (
          <button
            className="tab"
            onClick={async () => {
              await window.ani.clearHistory();
              reload();
            }}
          >
            Svuota
          </button>
        )}
      </div>

      {hist.length === 0 ? (
        <div className="empty">Nessun anime nella cronologia.</div>
      ) : (
        <div className="grid">
          {hist.map((h) => (
            <Card
              key={h.slug}
              title={h.title}
              poster={h.poster}
              sub={h.lastEp ? `Episodio ${h.lastEp}` : null}
              progress={h.duration ? h.position / h.duration : null}
              onClick={() => go({ name: "anime", slug: h.slug, title: h.title })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
