<p align=center>
<br>
<a href="http://makeapullrequest.com"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a>
<a href="#installazione"><img src="https://img.shields.io/badge/os-linux-brightgreen">
<a href="#installazione"><img src="https://img.shields.io/badge/os-mac-brightgreen">
<a href="#installazione"><img src="https://img.shields.io/badge/os-android-brightgreen">
<a href="#installazione"><img src="https://img.shields.io/badge/lang-Sub%20%2F%20Dub%20ITA-blue">
<a href="https://www.gnu.org/licenses/gpl-3.0"><img src="https://img.shields.io/badge/license-GPLv3-blue">
<br>
<h1 align="center">
<a href="https://github.com/nicolagalassi/ani-cli-it"><img src="https://img.shields.io/badge/fork-ITA-blue"></a>
<a href="https://www.animeworld.ac/"><img src="https://img.shields.io/badge/source-AnimeWorld-brightgreen"></a>
<a href="https://github.com/pystardust/ani-cli"><img src="https://img.shields.io/badge/upstream-pystardust%2Fani--cli-lightgrey"></a>
<a href="https://github.com/synacktraa/ani-skip"><img src="https://img.shields.io/badge/ani--skip-integrato-orange"></a>
<br>
<br>
<a href="https://ko-fi.com/galax95"><img src="https://img.shields.io/badge/Ko--fi-Offrimi%20un%20caff%C3%A8-FF5E5B?logo=ko-fi&logoColor=white"></a>
<a href="https://www.paypal.com/donate/?hosted_button_id=826CHYWWZFYBW"><img src="https://img.shields.io/badge/PayPal-Dona-00457C?logo=paypal&logoColor=white"></a>

</p>

<h3 align="center">
A cli to browse and watch anime — <b>Italian fork</b> that scrapes <a href="https://www.animeworld.ac/">AnimeWorld</a> for <b>Sub ITA</b> and <b>Doppiaggio ITA</b>.
</h3>

<h3 align="center">
⚠️ Fork italiano di <a href="https://github.com/pystardust/ani-cli">pystardust/ani-cli</a>: usa AnimeWorld al posto di allmanga, quindi trovi anime con sottotitoli e doppiaggio in italiano.
</h3>

<h3 align="center">
✨ <b>ani-skip integrato</b>: salto automatico di sigle iniziali e finali con <code>--skip</code>, senza installare nulla a parte (basato su <a href="https://github.com/synacktraa/ani-skip">synacktraa/ani-skip</a>).
</h3>

## Table of Contents

- [Risoluzione problemi](#risoluzione-problemi)
- [Installazione](#installazione)
- [Disinstallazione](#disinstallazione)
- [Dipendenze](#dipendenze)
  - [Salto sigle](#salto-sigle-ani-skip-integrato)
- [FAQ](#faq)
- [Progetti simili](#homies)
- [Crediti](#crediti)
- [Supporta il progetto](#supporta-il-progetto)
- [Disclaimer](./disclaimer.md)

## Quickstart (Arch)

Questo fork è uno **script shell singolo** (`ani-cli`). Dipendenze: `curl`, `sed`, `grep`, `fzf`, `mpv` (player) e `aria2c` (per il download). Su Arch:

```sh
sudo pacman -S --needed curl sed grep fzf mpv aria2
```

Poi installa lo script dal repo:

```sh
git clone https://github.com/nicolagalassi/ani-cli-it.git
cd ani-cli-it
sudo install -Dm755 ani-cli /usr/local/bin/ani-cli-it
```

Viene installato come **`ani-cli-it`**, così convive con l'`ani-cli` originale (inglese) eventualmente già presente. Aggiornamenti futuri: `git pull` + di nuovo `sudo install ...`, oppure `ani-cli-it -U`.

### Uso

```sh
ani-cli-it <nome anime>        # ricerca interattiva, Sub ITA
ani-cli-it --dub <nome anime>  # Doppiaggio ITA
ani-cli-it -e 1-12 <nome>      # intervallo di episodi
ani-cli-it -c                  # riprendi dalla cronologia
ani-cli-it --last             # ultimi episodi usciti (Sub ITA)
ani-cli-it --last --dub       # ultimi episodi usciti (Doppiaggio ITA)
ani-cli-it -d -e 1 <nome>     # scarica invece di riprodurre
ani-cli-it -v <nome>           # usa VLC al posto di mpv
```

Sub ITA di default (voci senza badge DUB su AnimeWorld); con `--dub` solo i titoli doppiati in italiano.

Con `--last` sfogli gli **ultimi episodi usciti** dalla home di AnimeWorld (come i tab "Ultimi Episodi" del sito): la modalità segue sempre la distinzione sub/dub, quindi `--last` mostra il tab Sub-ITA e `--last --dub` il tab Dub-ITA. Selezioni l'episodio e parte direttamente.

### Cambio di dominio di AnimeWorld

AnimeWorld cambia dominio abbastanza spesso. Se ani-cli-it smette di trovare risultati, di solito è perché il dominio è cambiato: aggiorna la riga `animeworld_base="www.animeworld.ac"` in cima allo script col nuovo dominio e reinstalla.

Per accorgersene in anticipo, il repo ha un controllo automatico ([`.github/workflows/domain-check.yml`](.github/workflows/domain-check.yml)) che ogni 3 giorni verifica che il dominio risponda, non rediriga verso un dominio diverso e sia ancora funzionale. In caso di problema:

- apre una **issue** con i dettagli (e la richiude da solo quando torna tutto ok);
- se trova un dominio sostitutivo **funzionante** (dalla lista ufficiale o dal redirect), apre anche una **Pull Request** che aggiorna `animeworld_base` col nuovo dominio — così basta un merge per sistemarlo.

Puoi lanciare il controllo anche a mano:

```sh
.github/scripts/check-domain.sh          # usa il dominio corrente dello script
ANI_BASE=www.animeworld.tv .github/scripts/check-domain.sh   # prova un altro dominio
```


## Risoluzione problemi

### Aggiornamenti

All'avvio, ani-cli-it controlla in background (max una volta al giorno, senza rallentare la partenza) se sul repo è disponibile una versione più recente e, in tal caso, mostra un avviso tipo `Aggiornamento disponibile: 4.15.0 -> 4.16.0`. Per aggiornare:

```sh
ani-cli-it -U        # usa 'sudo ani-cli-it -U' se installato in /usr/local/bin
```

Per disattivare il controllo: `export ANI_CLI_UPDATE_CHECK=0`.

Se ottieni `No results found` (e sei sicuro che il nome fosse corretto) o un altro errore, assicurati prima di essere all'ultima versione con `ani-cli-it -U`.
Se il problema persiste, apri una issue sul [repository del fork](https://github.com/nicolagalassi/ani-cli-it/issues).

Se AnimeWorld ha cambiato dominio (già successo in passato), aggiorna la riga `animeworld_base="www.animeworld.ac"` in cima allo script e reinstalla.

## Installazione

Questo fork **non è distribuito tramite package manager** (apt/dnf/AUR/scoop/brew/pkg installerebbero l'originale inglese). Si installa **da sorgente**: è un singolo script shell.

### Da sorgente (qualsiasi sistema unix-like)

Installa prima le dipendenze [(vedi sotto)](#dipendenze), poi:

```sh
git clone "https://github.com/nicolagalassi/ani-cli-it.git"
sudo cp ani-cli-it/ani-cli /usr/local/bin/ani-cli-it
sudo chmod +x /usr/local/bin/ani-cli-it
rm -rf ani-cli-it
```

Installandolo come **`ani-cli-it`** convive con l'`ani-cli` originale eventualmente già presente. Se preferisci sostituirlo, copia in `/usr/local/bin/ani-cli`.

### Dipendenze per piattaforma

<details><summary><b>Linux</b></summary>

- **Arch:** `sudo pacman -S --needed curl sed grep fzf mpv aria2`
- **Debian/Ubuntu:** `sudo apt install curl sed grep fzf mpv aria2`
- **Fedora:** `sudo dnf install curl sed grep fzf mpv aria2` (per mpv serve *RPM Fusion free*: https://rpmfusion.org/Configuration)

Poi installa lo script da sorgente come sopra.

</details><details><summary><b>MacOS</b></summary>

Installa [HomeBrew](https://docs.brew.sh/Installation), poi le dipendenze:

```sh
brew install curl grep aria2 git fzf && brew install --cask iina
```
*iina è un player per MacOS compatibile con mpv.* Poi installa lo script da sorgente (puoi usare `$(brew --prefix)/bin` come destinazione).

</details><details><summary><b>Android (Termux)</b></summary>

Installa [Termux](https://termux.com/), poi:

```sh
pkg up -y
pkg install curl sed grep fzf aria2 git
```

Come player usa la app mpv o vlc (Play Store / F-Droid). Su Android 14 installa anche `termux-am`. Poi installa lo script da sorgente.

</details><details><summary><b>Windows / WSL / iOS / Steam Deck / FreeBSD</b></summary>

⚠️ **Non testato con questo fork.** È lo stesso script POSIX dell'originale, quindi *in teoria* funziona se sono presenti le dipendenze (`curl sed grep fzf mpv aria2 git`), ma non posso garantirlo. Per la configurazione dell'ambiente (es. Windows Terminal + Git Bash, iSH su iOS, Konsole su Steam Deck) puoi seguire la [guida dell'originale](https://github.com/pystardust/ani-cli#tier-2-support-windows-wsl-ios-steam-deck-freebsd), ma **clona da questo fork** (non da pystardust). Se lo provi, apri una [issue](https://github.com/nicolagalassi/ani-cli-it/issues) col risultato: aggiorno la doc di conseguenza.

</details>

## Disinstallazione

```sh
sudo rm /usr/local/bin/ani-cli-it
```

La cronologia è salvata in `~/.local/state/ani-cli`; per rimuoverla: `rm -rf ~/.local/state/ani-cli`.

## Dipendenze

- grep
- sed
- curl
- mpv - Video Player
- iina - sostituto di mpv per MacOS
- aria2c - Download manager (per `-d`)
- fzf - Interfaccia utente
- ani-skip **integrato** (nessuna installazione separata; salta sigle OP/ED su mpv)
- patch - Auto-aggiornamento (`-U`)

*Nota: rispetto all'originale, questo fork **non** usa `openssl`, `yt-dlp` o `ffmpeg`: AnimeWorld serve file mp4 diretti, quindi il download passa solo da `aria2c`.*

### Salto sigle (ani-skip integrato)

A differenza dell'originale, **ani-skip è già integrato** in questo fork: non devi installare nulla a parte. Usa `--skip` per saltare automaticamente sigla iniziale (OP) e finale (ED):

```sh
ani-cli-it --skip <nome anime>
```

Come funziona:
- L'ID MyAnimeList viene letto **direttamente dalla pagina di AnimeWorld** (più affidabile della ricerca per titolo, che fallirebbe sui titoli italiani).
- I tempi di salto arrivano dall'[API di aniskip](https://api.aniskip.com).
- Al primo uso viene installato in automatico un piccolo plugin lua di mpv in `~/.config/mpv/scripts/anicli-skip.lua`.

Note:
- Funziona **solo con mpv** (usa lo scripting lua di mpv).
- Se l'anime non è riconosciuto o non ha tempi di salto, la riproduzione continua normale (nessun errore).
- Puoi forzare l'anime con `--skip-title <mal_id>` (un numero = ID MyAnimeList) oppure `--skip-title "<titolo>"` (ricerca su MyAnimeList via Jikan).

## FAQ
<details>

* Posso cambiare la lingua dei sottotitoli o disattivarli? - No, i sottotitoli sono incorporati nel video (hardsub).
* Posso guardare il doppiaggio? - Sì, usa `--dub` (se il titolo è disponibile doppiato in italiano su AnimeWorld).
* Posso cambiare la sorgente? - No, questo fork usa esclusivamente AnimeWorld.
* Posso usare VLC? - Sì, usa `--vlc` oppure `export ANI_CLI_PLAYER=vlc`.
* Posso scegliere la risoluzione? - No, AnimeWorld fornisce un unico file per episodio, quindi `-q` non ha effetto.
* Come scarico un episodio? - Usa `-d`, scarica nella cartella corrente.
* Posso cambiare la cartella di download? - Sì, imposta `ANI_CLI_DOWNLOAD_DIR`.
* Come scarico in blocco? - Usa `-d -e primo-ultimo`, es. `ani-cli-it naruto -d -e 1-24`.

**Nota:** tutte le opzioni sono documentate in `ani-cli-it --help`.

</details>

## Homies

* [animdl](https://github.com/justfoolingaround/animdl): Ridiculously efficient, fast and light-weight (supports most sources: allmanga, zoro ... (Python)
* [jerry](https://github.com/justchokingaround/jerry): stream anime with anilist tracking and syncing, with discord presence (Shell)
* [anipy-cli](https://github.com/sdaqo/anipy-cli): ani-cli rewritten in python (Python)
* [mangal](https://github.com/metafates/mangal): Download & read manga from any source with anilist sync (Go)
* [lobster](https://github.com/justchokingaround/lobster): Watch movies and series from the terminal (Shell)
* [mov-cli](https://github.com/mov-cli/mov-cli): Watch everything from your terminal. (Python)
* [dra-cla](https://github.com/CoolnsX/dra-cla): ani-cli equivalent for korean dramas (Shell)
* [redqu](https://github.com/port19x/redqu):  A media centric reddit client (Clojure)
* [doccli](https://github.com/TowarzyszFatCat/doccli):  A cli to watch anime with POLISH subtitles (Python)
* [GoAnime](https://github.com/alvarorichard/GoAnime): A TUI tool to browse, play, and download anime in Portuguese and English, with Discord RPC, AniList integration, and intro skipping. (Go)
* [Curd](https://github.com/Wraient/curd): A CLI tool to watch anime with Anilist, Discord RPC, Skip Intro/Outro/Filler/Recap (Go)
* [FastAnime](https://github.com/Benex254/FastAnime): browser anime experience from the terminal (Python)
* [ani-skip](https://github.com/KilDesu/ani-skip): Automatically skip opening and ending sequences for IINA on MacOS (Typescript, official IINA plugin API)

## Supporta il progetto

Se questo fork ti è utile, puoi offrirmi un caffè: aiuta a tenerlo aggiornato quando AnimeWorld cambia dominio o struttura. Grazie! ❤️

<p align="center">
<a href="https://ko-fi.com/galax95"><img src="https://img.shields.io/badge/Ko--fi-Offrimi%20un%20caff%C3%A8-FF5E5B?logo=ko-fi&logoColor=white" height="32"></a>
&nbsp;&nbsp;
<a href="https://www.paypal.com/donate/?hosted_button_id=826CHYWWZFYBW"><img src="https://img.shields.io/badge/PayPal-Dona-00457C?logo=paypal&logoColor=white" height="32"></a>
</p>

- Ko-fi: https://ko-fi.com/galax95
- PayPal: https://www.paypal.com/donate/?hosted_button_id=826CHYWWZFYBW

## Crediti

- [pystardust/ani-cli](https://github.com/pystardust/ani-cli) — progetto originale da cui deriva questo fork
- [synacktraa/ani-skip](https://github.com/synacktraa/ani-skip) — logica di salto sigle e plugin lua di mpv, qui reimplementati e integrati
- [AnimeWorld](https://www.animeworld.ac/) — sorgente dei contenuti (Sub ITA / Doppiaggio ITA)
- [aniskip API](https://api.aniskip.com) — tempi di OP/ED
