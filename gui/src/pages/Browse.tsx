import { useState, useRef } from "react";
import { useNav } from "../App";
import { Card } from "../components/Card";
import type { SearchItem, Mode } from "../types";

export function Browse() {
  const { go } = useNav();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode | "all">("all");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const reqId = useRef(0);

  async function runSearch(q: string, m: Mode | "all") {
    if (!q.trim()) return;
    const id = ++reqId.current;
    setLoading(true);
    setSearched(true);
    const res = await window.ani.search(q.trim(), m);
    if (id === reqId.current) {
      setResults(res);
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="section-head">
        <h1 className="page-title">Cerca anime</h1>
        <div className="tabs">
          {(["all", "sub", "dub"] as const).map((m) => (
            <button
              key={m}
              className={"tab" + (mode === m ? " active" : "")}
              onClick={() => {
                setMode(m);
                if (query.trim()) runSearch(query, m);
              }}
            >
              {m === "all" ? "Tutti" : m === "sub" ? "Sub ITA" : "Dub ITA"}
            </button>
          ))}
        </div>
      </div>

      <form
        className="searchbar"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query, mode);
        }}
      >
        <input
          autoFocus
          placeholder="Cerca un anime…  (es. dandadan, one piece, naruto)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Cerca</button>
      </form>

      {loading ? (
        <div className="loading">Ricerca in corso…</div>
      ) : searched && results.length === 0 ? (
        <div className="empty">Nessun risultato.</div>
      ) : (
        <div className="grid">
          {results.map((r) => (
            <Card
              key={r.slug}
              title={r.title}
              poster={r.poster}
              badge={r.dub ? "DUB" : null}
              onClick={() =>
                go({ name: "anime", slug: r.slug, title: r.title, dub: r.dub, poster: r.poster })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
