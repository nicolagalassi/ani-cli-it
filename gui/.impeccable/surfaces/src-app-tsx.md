---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/styles.css","src/pages/Home.tsx","src/pages/Anime.tsx","src/pages/Player.tsx"]
---

# Surface: Animix ITA app shell (all screens)

Scope: the whole renderer — shell, Home, Scopri, Cerca, Anime, Player, Cronologia, Impostazioni. Mode: Operate.
Audience/job: Italian anime viewers, desk and TV-from-sofa, keyboard; follow weekly releases and binge series. Success: next episode one action away; everything readable at distance and keyboard-reachable.
Constraints: all existing features preserved; renderer-only (shell under Tauri evaluation, no Electron-specific chrome); fonts/icons bundled; window min 940×600.

## Direction contract

THESIS: The interface is an anime cel (rodovetro): flat paint, a real ink line, no gradients; each series repaints its own page with its cel colour. Refuses the category default of a near-black streaming wall with a carousel hero and a single brand accent.

OWN-WORLD: Night-background indigo ground (#10142a), ink rail and ink lines (#05060f), flat cel paints with jobs — yellow #ffd23f = the next thing to watch (play and new episodes only; focus is a paper-white + ink double ring, active nav a paper chip), cyan #38c6f4 = Sub ITA, pink #ff6b97 = Dub ITA — cool paper-white text. Archivo (condensed, heavy) for episode numerals and headings, Atkinson Hyperlegible Next for reading. Square-ish 4–6px corners, 2–3px ink outlines, tabular figures. No blur, glass or gradient anywhere. Raises: new episode stays lit yellow until watched (boarding board); hairline density, continue-watching in one dense row (JP density); bar length is exact data (labanotation); flat unmodulated paint (zoo map); tabular numerals in columns (datamatics).

STORY: Open the app, see at once which series have something new and press one key to watch it; resume anything in one row; browse Sub/Dub releases colour-coded; open a series and its page wears that series' colour.

FIRST VIEWPORT: Left ink rail (wordmark, five nav items, active item as a paper chip, AniList account at bottom). Main: search field with "/" hint on top; "Da vedere ora" — the first series with new episodes as a wide flat cel panel painted in its AniList colour with huge condensed EP numeral and an ink "Guarda/Riprendi" button (ink on paint: yellow would not hold contrast on every series colour), followed by compact cards for the other series with new episodes, flagged by yellow tags only; "Continua a guardare" one row of compact cards with exact progress; "Ultime uscite" Sub/Dub tabs and a poster grid with cyan/pink EP badges.

FORM: Rodovetro (anime cel), candidate 6 of 7 on the ordered list. seed:cb0e8919c0bce0a5. Signature move: "ridipintura" — the series' AniList cover colour repaints the anime page header, its next-episode cell and the player progress bar as flat paint.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
