# AniPlay ITA

Interfaccia grafica desktop per [ani-cli-it](https://github.com/nicolagalassi/ani-cli-it) — cerca e guarda anime **Sub ITA** e **Doppiaggio ITA** da AnimeWorld, con i video riprodotti **dentro l'app**.

Ispirata ad AniPlay, adattata alla sorgente italiana AnimeWorld.

## Funzioni

- **Home** — "Continua a guardare" (riprende dall'ultimo episodio, con barra di avanzamento; rimuovi una serie con la × sulla card) + ultimi episodi con tab **Sub ITA / Dub ITA**. Le sezioni sono **riordinabili** con le frecce ↑/↓ (ordine salvato).
- **Cerca** — ricerca con locandine, filtro Tutti / Sub / Dub.
- **Scopri** — classifiche da AniList (di tendenza / popolari / stagione).
- **Pagina anime** — locandina, voto e generi da AniList, sinossi, link MyAnimeList/AniList, lista episodi con filtro e spunta ✓ sugli episodi già visti.
- **Player integrato** — riproduzione MP4 in-app, precedente/successivo, ripresa dalla posizione salvata, auto-avanzamento, e tasto **"Salta intro / sigla"** (ani-skip).
- **Account AniList** *(opzionale)* — login, sezione "In visione" sulla Home, sync automatico del progresso.
- **Cronologia** persistente su disco.
- **Impostazioni** — cambio dominio AnimeWorld e login AniList.

## App installabile (consigliato)

Per avere un'app da avviare con un doppio clic (senza `npm run dev`), genera un **AppImage**:

```sh
cd gui
npm install
npm run dist        # compila e crea release/AniPlay-ITA-<versione>.AppImage
```

Poi:

```sh
chmod +x release/AniPlay-ITA-*.AppImage
./release/AniPlay-ITA-*.AppImage
```

L'AppImage è **autonomo** (contiene Electron + l'app): puoi spostarlo dove vuoi e lanciarlo con doppio clic. Per averlo nel menu applicazioni, usa [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) oppure crea una voce `.desktop` che punta al file.

> Se al primo avvio l'AppImage non parte per il sandbox di Chromium (alcuni kernel Arch/CachyOS con user namespaces ristretti), abilita gli userns:
> `sudo sysctl -w kernel.unprivileged_userns_clone=1`
> oppure lancia con `--no-sandbox`.

## Sviluppo

```sh
cd gui
npm install
npm run dev      # avvia Vite (:5173) + Electron con hot-reload
```

## Build manuale (senza packaging)

```sh
npm run build    # compila il renderer in dist/
npm start        # avvia Electron sul build di produzione
```

## Stack

- **Electron** (main process): scraping AnimeWorld + chiamate AniList/aniskip senza restrizioni CORS.
- **Vite + React + TypeScript** (renderer): interfaccia.
- **electron-builder**: packaging in AppImage.
- Nessuna dipendenza esterna per scraping/AniList: usa il `fetch` nativo di Node.

### Integrazione AniList

1. **Pubblico (senza login)** — voto, formato, generi, sinossi, copertine e classifiche, collegati ad AnimeWorld tramite l'**ID MyAnimeList** esposto nella pagina dell'anime (nessun matching per titolo).
2. **Account (con login)** — su [AniList → Settings → Developer](https://anilist.co/settings/developer) crea un client; **Redirect URL obbligatorio**: `https://anilist.co/api/v2/oauth/pin`. Incolla il **Client ID** in *Impostazioni → Account AniList* e premi Accedi. Guardando un episodio oltre il ~90%, il progresso viene inviato ad AniList.

## Note

- I video di AnimeWorld sono file MP4 diretti (`Access-Control-Allow-Origin: *`, con Range), quindi si riproducono nativamente in `<video>` con seek — stessa qualità di ani-cli, dentro l'app.
- Su AnimeWorld Sub ITA e Dub ITA sono voci separate: la distinzione avviene in ricerca e nella home.
- La cronologia è salvata in `~/.config/aniplay-it/aniplay-it.json` (Linux).
