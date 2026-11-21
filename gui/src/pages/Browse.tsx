import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useNav } from "../App";
import { Card, CardSkeletons } from "../components/Card";
import type { Mode, SearchItem } from "../types";

const MODES: { id: Mode | "all"; label: string; cls: string }[] = [
  { id: "all", label: "Tutti", cls: "" },
  { id: "sub", label: "Sub ITA", cls: " seg-sub" },
  { id: "dub", label: "Dub ITA", cls: " seg-dub" },
];

export function Browse({ initialQuery }: { initialQuery?: string }) {
  const { go } = useNav();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [mode, setMode] = useState<Mode | "all">("all");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [searched, setSearched] = useState<string | null>(null);
  const reqId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" pressed while already on this screen
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    window.addEventListener("animix:focus-search", focus);
    return () => window.removeEventListener("animix:focus-search", focus);
  }, []);

  async function runSearch(q: string, m: Mode | "all") {
    const text = q.trim();
    if (!text) return;
    const id = ++reqId.current;
    setLoading(true);
    setFailed(false);
    try {
      const res = await window.ani.search(text, m);
      if (id !== reqId.current) return;
      setResults(res);
    } catch {
      if (id !== reqId.current) return;
      setResults([]);
      setFailed(true);
    }
    setSearched(text);
    setLoading(false);
  }

  // results arrive while typing (after a short pause)
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) return;
    const t = window.setTimeout(() => runSearch(text, mode), text === initialQuery?.trim() ? 0 : 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mode]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Cerca</h1>
          <p className="page-sub">Tutto il catalogo AnimeWorld, Sub ITA e doppiato in italiano.</p>
        </div>
        <div className="seg" role="group" aria-label="Lingua">
          {MODES.map((m) => (
            <button key={m.id} className={"seg-btn" + m.cls} aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <form
        className="searchbar big"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query, mode);
        }}
      >
        <Search aria-hidden="true" className="ico searchbar-ico" />
        <input
          ref={inputRef}
          className="field"
          autoFocus
          aria-label="Titolo dell'anime"
          placeholder="Titolo dell'anime, es. dandadan, one piece, frieren…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {loading ? (
        <>
          <p className="result-count" role="status">
            Cerco “{query.trim()}”…
          </p>
          <CardSkeletons count={12} />
        </>
      ) : failed ? (
        <div className="notice" style={{ marginTop: "1.25rem" }}>
          <strong>La ricerca non è andata a buon fine.</strong>
          <span>AnimeWorld potrebbe aver cambiato dominio: controlla in Impostazioni, poi riprova.</span>
          <button className="btn btn-ghost" onClick={() => runSearch(query, mode)}>
            Riprova
          </button>
        </div>
      ) : searched == null ? (
        <p className="result-count">I risultati compaiono mentre scrivi.</p>
      ) : results.length === 0 ? (
        <div className="notice" style={{ marginTop: "1.25rem" }}>
          <strong>Nessun risultato per “{searched}”.</strong>
          <span>Prova con il titolo originale in romaji o con quello inglese, oppure togli il filtro Sub/Dub.</span>
        </div>
      ) : (
        <>
          <p className="result-count" role="status">
            {results.length === 1 ? "1 risultato" : `${results.length} risultati`} per “{searched}”
          </p>
          <div className="grid">
            {results.map((r) => (
              <Card
                key={r.slug}
                title={r.title}
                poster={r.poster}
                badge={r.dub ? { label: "Dub ITA", tone: "dub" } : { label: "Sub ITA", tone: "sub" }}
                onClick={() => go({ name: "anime", slug: r.slug, title: r.title, dub: r.dub, poster: r.poster })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
