# AniPlay ITA

Interfaccia grafica desktop per [ani-cli-it](https://github.com/nicolagalassi/ani-cli-it) — cerca e guarda anime **Sub ITA** e **Doppiaggio ITA** da AnimeWorld, con i video riprodotti **dentro l'app**.

Ispirata ad AniPlay, adattata alla sorgente italiana AnimeWorld.

## Funzioni

- **Home** — "Continua a guardare" (riprende dall'ultimo episodio, con barra di avanzamento) + ultimi episodi usciti con tab **Sub ITA / Dub ITA**.
- **Cerca** — ricerca con locandine, filtro Tutti / Sub / Dub.
- **Pagina anime** — locandina, numero episodi, link MyAnimeList, lista episodi con filtro e spunta ✓ sugli episodi già visti.
- **Player integrato** — riproduzione MP4 diretta in-app (HTML5), precedente/successivo, ripresa dalla posizione salvata, auto-avanzamento a fine episodio.
- **Cronologia** persistente su disco.
- **Impostazioni** — cambio dominio AnimeWorld (il sito ruota spesso i domini).

## Stack

- **Electron** (main process): scraping AnimeWorld senza restrizioni CORS.
- **Vite + React + TypeScript** (renderer): interfaccia.
- Nessuna dipendenza esterna per lo scraping: usa il `fetch` nativo di Node.

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
