# AniPlay ITA

Interfaccia grafica desktop per [ani-cli-it](https://github.com/nicolagalassi/ani-cli-it) — cerca e guarda anime **Sub ITA** e **Doppiaggio ITA** da AnimeWorld, con i video riprodotti **dentro l'app**.

Ispirata ad AniPlay, adattata alla sorgente italiana AnimeWorld.

## Funzioni

- **Home** — "Continua a guardare" (riprende dall'ultimo episodio, con barra di avanzamento) + ultimi episodi usciti con tab **Sub ITA / Dub ITA**.
- **Cerca** — ricerca con locandine, filtro Tutti / Sub / Dub.
- **Scopri** — classifiche da AniList (di tendenza / popolari / stagione); clicca un titolo per cercarlo su AnimeWorld.
- **Pagina anime** — locandina, voto e generi da AniList, sinossi, link MyAnimeList/AniList, lista episodi con filtro e spunta ✓ sugli episodi già visti.
- **Player integrato** — riproduzione MP4 diretta in-app (HTML5), precedente/successivo, ripresa dalla posizione salvata, auto-avanzamento a fine episodio.
- **Account AniList** *(opzionale)* — login, sezione "In visione" sulla Home, e sincronizzazione automatica del progresso (l'episodio guardato aggiorna la tua lista AniList).
- **Cronologia** persistente su disco.
- **Impostazioni** — cambio dominio AnimeWorld (il sito ruota spesso i domini) e login AniList.

### Integrazione AniList

AniList è usato su due livelli:

1. **Pubblico (senza login)** — metadati e classifiche. Il collegamento AnimeWorld → AniList avviene tramite l'**ID MyAnimeList** che AnimeWorld espone nella pagina dell'anime (nessun matching per titolo, quindi affidabile): voto, formato, generi, sinossi, copertine in alta risoluzione, pagine "Scopri".
2. **Account (con login)** — per sincronizzare progresso e liste. Serve un **Client ID** AniList:
   - Vai su [AniList → Settings → Developer](https://anilist.co/settings/developer), crea un client (tipo *implicit / token*).
   - Incolla il Client ID in *Impostazioni → Account AniList* e premi **Accedi**: si apre la finestra di login AniList; il token viene salvato localmente.
   - Da quel momento, guardando un episodio (oltre il ~90%) il progresso viene inviato ad AniList, e la Home mostra la sezione "In visione".

## Stack

- **Electron** (main process): scraping AnimeWorld + chiamate AniList GraphQL senza restrizioni CORS.
- **Vite + React + TypeScript** (renderer): interfaccia.
- Nessuna dipendenza esterna per scraping/AniList: usa il `fetch` nativo di Node.

Lo scraping riusa la stessa logica verificata dello script `ani-cli` (ricerca, lista episodi, `api/episode/info` per il link MP4 diretto, ultimi episodi dalla home).

## Sviluppo

```sh
cd gui
npm install
npm run dev      # avvia Vite (:5173) + Electron
```

> Nota Linux: se Electron non parte per il sandbox (`chrome-sandbox`), avvia con
> `electron . --no-sandbox` (già gestito in ambienti senza setuid).

## Build

```sh
npm run build    # compila il renderer in dist/
npm start        # avvia Electron sul build di produzione
```

## Note

- I video di AnimeWorld sono file MP4 diretti (`Access-Control-Allow-Origin: *`, con supporto Range), quindi si riproducono nativamente in `<video>` con seek — stessa qualità di ani-cli, dentro l'app.
- Su AnimeWorld Sub ITA e Dub ITA sono voci separate: la distinzione avviene in ricerca e nella home (tab Sub/Dub), non come toggle sulla stessa pagina.
- La cronologia è salvata in `~/.config/aniplay-it/aniplay-it.json` (Linux).
