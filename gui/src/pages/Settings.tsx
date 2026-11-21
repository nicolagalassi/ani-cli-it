import { useEffect, useState } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { useNav } from "../App";
import { loadSingleKeys, setSingleKeys } from "../lib/shortcuts";

const KEYS: [string, string][] = [
  ["/", "Cerca da qualunque schermata"],
  ["← ↑ → ↓", "Spostati tra card e pulsanti"],
  ["Invio", "Apri o riproduci"],
  ["Esc", "Torna indietro (o chiude un campo di testo)"],
  ["Canc", "Togli dalla cronologia la card selezionata"],
  ["Spazio", "Pausa e riproduci (player)"],
  ["S", "Salta la sigla o passa all'episodio dopo (player)"],
  ["O", "Avanti di 85 secondi (player)"],
  ["N / P", "Episodio successivo o precedente (player)"],
  ["F · M", "Schermo intero · muto (player)"],
];

export function Settings() {
  const { viewer, setViewer } = useNav();
  const [base, setBase] = useState("");
  const [saved, setSaved] = useState(false);
  const [clientId, setClientId] = useState("");
  const [alError, setAlError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState("");
  const [singleKeys, setSingleKeysState] = useState(true);
  const electronVersion = navigator.userAgent.match(/Electron\/([\d.]+)/)?.[1] ?? null;

  useEffect(() => {
    window.ani.version().then(setVersion);
    loadSingleKeys().then(setSingleKeysState).catch(() => {});
    window.ani.getBase().then(setBase);
    window.ani.settings().then((s) => setClientId((s.anilistClientId as string) || ""));
  }, []);

  async function login() {
    setAlError(null);
    setBusy(true);
    try {
      await window.ani.setSetting("anilistClientId", clientId.trim());
      const v = await window.ani.alLogin();
      setViewer(v);
      if (!v) setAlError("Accesso non riuscito: AniList non ha restituito il profilo. Riprova.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAlError(
        msg.includes("NO_CLIENT_ID")
          ? "Inserisci prima il Client ID."
          : msg.includes("LOGIN_CANCELLED")
            ? "Accesso annullato."
            : "Accesso non riuscito: " + msg,
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
      <div className="page-head">
        <h1 className="page-title">Impostazioni</h1>
      </div>

      <div className="settings">
        <section className="panel" aria-labelledby="h-domain">
          <h2 id="h-domain">Dominio AnimeWorld</h2>
          <p>
            AnimeWorld cambia spesso indirizzo. Se ricerche e ultime uscite smettono di caricarsi, scrivi qui il dominio
            attuale (per esempio <code>www.animeworld.ac</code>).
          </p>
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const b = await window.ani.setBase(base.trim());
              setBase(b);
              setSaved(true);
            }}
          >
            <input
              className="field"
              aria-label="Dominio AnimeWorld"
              value={base}
              onChange={(e) => {
                setBase(e.target.value);
                setSaved(false);
              }}
              placeholder="www.animeworld.ac"
            />
            <button className="btn btn-primary" type="submit">
              Salva dominio
            </button>
          </form>
          {saved && (
            <p className="status-ok" role="status">
              Dominio aggiornato.
            </p>
          )}
        </section>

        <section className="panel" aria-labelledby="h-anilist">
          <h2 id="h-anilist">Account AniList</h2>
          {viewer ? (
            <div className="account">
              {viewer.avatar?.medium && <img src={viewer.avatar.medium} alt="" />}
              <div>
                <div className="muted">Collegato come</div>
                <div className="account-name">{viewer.name}</div>
              </div>
              <button className="btn btn-ghost" onClick={logout}>
                <LogOut aria-hidden="true" className="ico" />
                Scollega
              </button>
            </div>
          ) : (
            <>
              <p>
                Collega AniList per vedere in Home le serie che segui e aggiornare il progresso da solo, quando finisci un
                episodio.
              </p>
              <ol className="muted" style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.7 }}>
                <li>
                  Su AniList apri{" "}
                  <button
                    className="link-btn"
                    onClick={() => window.ani.openExternal("https://anilist.co/settings/developer")}
                  >
                    Settings → Developer
                  </button>{" "}
                  e crea un client.
                </li>
                <li>
                  Come Redirect URL scrivi <code>https://anilist.co/api/v2/oauth/pin</code>.
                </li>
                <li>Incolla qui sotto il Client ID (è un numero) e premi Accedi.</li>
              </ol>
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  login();
                }}
              >
                <input
                  className="field"
                  inputMode="numeric"
                  aria-label="Client ID di AniList"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Client ID, es. 12345"
                />
                <button className="btn btn-primary" type="submit" disabled={busy || !clientId.trim()} aria-busy={busy || undefined}>
                  {busy ? "Accesso…" : "Accedi con AniList"}
                </button>
              </form>
              {alError && (
                <p className="status-err" role="alert">
                  {alError}
                </p>
              )}
            </>
          )}
        </section>

        <section className="panel" aria-labelledby="h-keys">
          <h2 id="h-keys">Tastiera</h2>
          <p>Animix si usa tutto da tastiera, anche dal divano con il PC collegato alla TV.</p>
          <dl className="keys">
            {KEYS.map(([k, d]) => (
              <div key={k} style={{ display: "contents" }}>
                <dt>
                  <kbd className="kbd">{k}</kbd>
                </dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
          <label className="check">
            <input
              type="checkbox"
              checked={singleKeys}
              onChange={(e) => {
                setSingleKeysState(e.target.checked);
                setSingleKeys(e.target.checked);
              }}
            />
            <span>
              Scorciatoie a un tasto
              <small>
                / per cercare e le lettere del player (S, O, N, P, K, F, M). Spegnile se usi la dettatura vocale o se
                un telecomando manda tasti per sbaglio; frecce, Invio, Spazio, Esc e Canc restano attivi.
              </small>
            </span>
          </label>
        </section>

        <section className="panel" aria-labelledby="h-info">
          <h2 id="h-info">Informazioni</h2>
          {version && (
            <p>
              Versione {version}
              {electronVersion ? ` · Electron ${electronVersion}` : ""}
            </p>
          )}
          <p>
            Animix ITA è l'interfaccia di ani-cli-it: gli episodi arrivano da AnimeWorld (Sub e Dub ITA) e si guardano
            dentro l'app.
          </p>
          <div>
            <button
              className="btn btn-ghost"
              onClick={() => window.ani.openExternal("https://github.com/nicolagalassi/ani-cli-it")}
            >
              Repository del progetto
              <ExternalLink aria-hidden="true" className="ico" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
