import { useEffect, useState } from "react";
import type { AniListViewer } from "../types";

export function Settings() {
  const [base, setBase] = useState("");
  const [saved, setSaved] = useState(false);
  const [clientId, setClientId] = useState("");
  const [viewer, setViewer] = useState<AniListViewer | null>(null);
  const [alError, setAlError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.ani.getBase().then(setBase);
    window.ani.settings().then((s) => setClientId((s.anilistClientId as string) || ""));
    window.ani.alViewer().then(setViewer);
  }, []);

  async function login() {
    setAlError(null);
    setBusy(true);
    try {
      await window.ani.setSetting("anilistClientId", clientId.trim());
      const v = await window.ani.alLogin();
      setViewer(v);
      if (!v) setAlError("Login non riuscito.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAlError(
        msg === "NO_CLIENT_ID"
          ? "Inserisci prima il Client ID."
          : msg === "LOGIN_CANCELLED"
            ? "Login annullato."
            : "Errore: " + msg,
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await window.ani.alLogout();
    setViewer(null);
  }

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
        <h2 className="section-title">Account AniList</h2>
        {viewer ? (
          <div className="al-account">
            {viewer.avatar?.medium && (
              <img className="al-avatar" src={viewer.avatar.medium} alt="" />
            )}
            <div>
              <div className="dim">Connesso come</div>
              <div className="al-name">{viewer.name}</div>
            </div>
            <button className="tab" onClick={logout}>
              Disconnetti
            </button>
          </div>
        ) : (
          <>
            <p className="dim">
              Collega il tuo account AniList per sincronizzare il progresso e
              vedere le tue liste. Crea un client su AniList in{" "}
              <button
                className="pill link"
                onClick={() =>
                  window.ani.openExternal("https://anilist.co/settings/developer")
                }
              >
                Settings → Developer ↗
              </button>
              , impostando come <b>Redirect URL</b> (obbligatorio):{" "}
              <code>https://anilist.co/api/v2/oauth/pin</code>. Poi incolla qui il{" "}
              <b>Client ID</b> (il numero) e premi Accedi.
            </p>
            <div className="searchbar">
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="AniList Client ID (es. 12345)"
              />
              <button onClick={login} disabled={busy || !clientId.trim()}>
                {busy ? "…" : "Accedi"}
              </button>
            </div>
            {alError && <div className="al-err">{alError}</div>}
          </>
        )}
      </section>

      <section className="setting">
        <h2 className="section-title">Info</h2>
        <p className="dim">
          Animix ITA — interfaccia per ani-cli-it. Contenuti da AnimeWorld
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
