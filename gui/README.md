# Animix ITA

Interfaccia grafica desktop per [ani-cli-it](https://github.com/nicolagalassi/ani-cli-it) — cerca e guarda anime **Sub ITA** e **Doppiaggio ITA** da AnimeWorld, con i video riprodotti **dentro l'app**.

Ispirata ad AniPlay, adattata alla sorgente italiana AnimeWorld.

## Download (consigliato)

Scarica l'app pronta dall'ultima [**release**](https://github.com/nicolagalassi/ani-cli-it/releases/latest):

| Sistema | File |
|---|---|
| **Linux** | `Animix-ITA-*.AppImage` |
| **Windows** | `Animix-ITA-Setup-*.exe` (installer) o `Animix-ITA-*-x64.exe` (portable) |
| **macOS (Apple Silicon)** | `Animix-ITA-*-arm64.dmg` |
| **macOS (Intel)** | `Animix-ITA-*-x64.dmg` |

Note d'avvio:
- **Linux**: `chmod +x Animix-ITA-*.AppImage && ./Animix-ITA-*.AppImage`. Se non parte per il sandbox di Chromium (alcuni kernel Arch/CachyOS): `sudo sysctl -w kernel.unprivileged_userns_clone=1` oppure lancia con `--no-sandbox`.
- **Windows**: l'app non è firmata, quindi SmartScreen può avvisare → *Ulteriori informazioni → Esegui comunque*.
- **macOS**: l'app non è firmata → tasto destro sull'app → *Apri* (una volta sola) per superare Gatekeeper.

## Funzioni

- **Home** — in cima **Da vedere ora**: le serie con episodi usciti e non ancora visti, la prima dipinta nel colore della serie con un pulsante che fa partire subito l'episodio giusto. Sotto, **Continua a guardare** in una sola riga: la card riprende da dove eri rimasto o passa all'episodio dopo; (i) apre la scheda, × la toglie dalla cronologia. Poi **Ultime uscite** con Sub ITA / Dub ITA e **Carica episodi più vecchi**. Le sezioni si riordinano con le frecce e l'ordine viene salvato.
- **Cerca** — risultati mentre scrivi, con locandine ed etichetta Sub ITA / Dub ITA; filtro Tutti / Sub / Dub.
- **Scopri** — classifiche da AniList (di tendenza / più popolari / questa stagione); un titolo apre direttamente la sua scheda su AnimeWorld.
- **Scheda della serie** — testata nel colore della serie, voto **AnimeWorld** e **AniList**, generi, trama, link MyAnimeList/AniList e pulsante Guarda / Riprendi sempre presente. Episodi visti segnati, il prossimo evidenziato; le serie lunghe sono divise in blocchi da 100. Download per episodio o per intervallo.
- **Player integrato** — riproduzione MP4 in-app con controlli propri (anche a schermo intero): barra trascinabile con anteprima del tempo, precedente/successivo con **preload**, ripresa dalla posizione salvata, auto-avanzamento, **"Salta la sigla"** (ani-skip) che a fine episodio diventa **episodio successivo**, ±85 s, volume ricordato, striscia degli episodi sotto il video.
- **Tastiera e TV** — tutta l'app si usa da tastiera: frecce per spostarsi tra card e pulsanti, `/` per cercare, `Esc` per tornare indietro; nel player Spazio, F, M, O, S, N/P e frecce. Le scorciatoie a un tasto (`/` e le lettere) si possono spegnere dalle Impostazioni. L'interfaccia si ingrandisce sulle finestre grandi, per la visione da divano.
- **Account AniList** *(opzionale)* — login, sezione "In visione su AniList" in Home (con menu per cambiare lo stato), sync automatico del progresso.
- **Cronologia** persistente su disco, con conferma prima di svuotarla.
- **Impostazioni** — dominio AnimeWorld, login AniList, elenco delle scorciatoie e interruttore per quelle a un tasto.

## Compilare da sorgente

Dipendenze: Node 18+ e npm. Poi, dentro `gui/`:

```sh
npm install
npm run dist        # Linux  → release/Animix-ITA-*.AppImage
npm run dist:win    # Windows → installer + portable (richiede Wine su Linux)
npm run dist:mac    # macOS   → dmg + zip (solo su macOS)
```

> **Cross-build**: l'AppImage Linux e (con Wine) gli eseguibili Windows si generano da Linux; il pacchetto **macOS va compilato su macOS**. La release ufficiale è costruita in automatico dalla GitHub Action [`gui-release.yml`](../.github/workflows/gui-release.yml) su runner nativi Linux/Windows/macOS: basta pushare un tag `gui-vX.Y.Z`.

## Sviluppo

```sh
npm install
npm run dev      # avvia Vite (:5173) + Electron con hot-reload
```

## Stack

- **Electron** (main): scraping AnimeWorld + chiamate AniList/aniskip senza restrizioni CORS.
- **Vite + React + TypeScript** (renderer): interfaccia.
- **electron-builder**: packaging AppImage / exe / dmg.
- Nessuna dipendenza esterna per scraping/AniList: usa il `fetch` nativo di Node.

### Integrazione AniList

1. **Pubblico (senza login)** — voto, formato, generi, sinossi, copertine e classifiche, collegati ad AnimeWorld tramite l'**ID MyAnimeList** esposto nella pagina dell'anime (nessun matching per titolo).
2. **Account (con login)** — su [AniList → Settings → Developer](https://anilist.co/settings/developer) crea un client; **Redirect URL obbligatorio**: `https://anilist.co/api/v2/oauth/pin`. Incolla il **Client ID** in *Impostazioni → Account AniList* e premi Accedi. Guardando un episodio oltre il ~90%, il progresso viene inviato ad AniList.

## Note

- I video di AnimeWorld sono file MP4 diretti (`Access-Control-Allow-Origin: *`, con Range), quindi si riproducono nativamente in `<video>` con seek — stessa qualità di ani-cli, dentro l'app.
- Su AnimeWorld Sub ITA e Dub ITA sono voci separate: la distinzione avviene in ricerca e nella home.
- La cronologia è salvata in `~/.config/animix-it/animix-it.json` (Linux), percorso analogo su Windows/macOS (`app.getPath('userData')`). Al primo avvio dopo la rinomina la cronologia del vecchio AniPlay viene migrata automaticamente.
