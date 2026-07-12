import { useEffect, useState } from "react";

export function Settings() {
  const [base, setBase] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.ani.getBase().then(setBase);
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Impostazioni</h1>

      <section className="setting">
        <h2 className="section-title">Dominio AnimeWorld</h2>
        <p className="dim">
          AnimeWorld cambia spesso dominio. Se le ricerche smettono di funzionare,
          aggiorna qui il dominio (es. <code>www.animeworld.tv</code>).
        </p>
        <div className="searchbar">
          <input
            value={base}
            onChange={(e) => {
              setBase(e.target.value);
              setSaved(false);
            }}
            placeholder="www.animeworld.ac"
          />
          <button
            onClick={async () => {
              const b = await window.ani.setBase(base.trim());
              setBase(b);
              setSaved(true);
            }}
          >
            Salva
          </button>
        </div>
        {saved && <div className="ok">✓ Dominio aggiornato.</div>}
      </section>

      <section className="setting">
        <h2 className="section-title">Info</h2>
        <p className="dim">
          AniPlay ITA — interfaccia per ani-cli-it. Contenuti da AnimeWorld
          (Sub/Dub ITA). I video vengono riprodotti direttamente nell'app.
        </p>
        <button
          className="tab"
          onClick={() =>
            window.ani.openExternal(
              "https://github.com/nicolagalassi/ani-cli-it",
            )
          }
        >
          Repository del progetto ↗
        </button>
      </section>
    </div>
  );
}
