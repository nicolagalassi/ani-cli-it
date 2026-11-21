import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useActive, useNav } from "../App";
import { Card } from "../components/Card";
import { isFinished } from "../lib/episodes";
import type { HistoryEntry } from "../types";

function when(ts: number) {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return "oggi";
  if (days === 1) return "ieri";
  if (days < 7) return `${days} giorni fa`;
  return new Date(ts).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export function History() {
  const { go } = useNav();
  const active = useActive();
  const [hist, setHist] = useState<HistoryEntry[] | null>(null);
  const [confirming, setConfirming] = useState(false);

  const reload = () => window.ani.history().then(setHist);
  useEffect(() => {
    if (active) reload();
  }, [active]);

  // the confirmation disarms itself after a while (long enough for TV navigation)
  useEffect(() => {
    if (!confirming) return;
    const t = window.setTimeout(() => setConfirming(false), 10000);
    return () => clearTimeout(t);
  }, [confirming]);

  async function clearAll() {
    await window.ani.clearHistory();
    setConfirming(false);
    reload();
  }

  async function remove(slug: string) {
    await window.ani.removeEntry(slug);
    reload();
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Cronologia</h1>
          <p className="page-sub">
            {hist && hist.length > 0
              ? `${hist.length} serie, dalla più recente.`
              : "Le serie che apri nel player compaiono qui."}
          </p>
        </div>
        {hist && hist.length > 0 && (
          <div className="btn-row">
            {confirming ? (
              <>
                <button className="btn btn-danger" onClick={clearAll}>
                  <Trash2 aria-hidden="true" className="ico" />
                  Conferma: svuota tutto
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
                  Annulla
                </button>
              </>
            ) : (
              <button className="btn btn-ghost" onClick={() => setConfirming(true)}>
                <Trash2 aria-hidden="true" className="ico" />
                Svuota cronologia
              </button>
            )}
          </div>
        )}
      </div>

      {hist && hist.length === 0 ? (
        <div className="notice">
          <strong>La cronologia è vuota.</strong>
          <span>Guarda un episodio e la serie comparirà qui, con il punto in cui ti sei fermato.</span>
          <button className="btn btn-ghost" onClick={() => go({ name: "browse" })}>
            Cerca un anime
          </button>
        </div>
      ) : (
        <div className="grid">
          {(hist ?? []).map((h) => (
            <Card
              key={h.slug}
              title={h.title}
              poster={h.poster}
              sub={h.lastEp ? `Ep ${h.lastEp}${isFinished(h) ? " · finito" : ""} · ${when(h.updatedAt)}` : when(h.updatedAt)}
              progress={h.duration ? h.position / h.duration : null}
              onClick={() => go({ name: "anime", slug: h.slug, title: h.title, poster: h.poster })}
              onRemove={() => remove(h.slug)}
              removeLabel="Togli dalla cronologia"
            />
          ))}
        </div>
      )}
    </div>
  );
}
