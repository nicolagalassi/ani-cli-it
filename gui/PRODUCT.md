# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Electron desktop app; the renderer is a React web UI. The shell choice — Electron vs Tauri — is under evaluation, so UI work stays renderer-only and shell-agnostic.)

## Users

Italian anime viewers who want Sub ITA and Dub ITA episodes without browsing ad-heavy streaming sites. Two equally weighted jobs:

- **Following the season**: open the app, see which followed series have new episodes, watch them.
- **Binging and discovery**: find a complete series (by search or from AniList rankings) and watch it episode after episode.

Two equally weighted viewing scenes: at a desk (mouse and keyboard, window or fullscreen on a monitor) and on a PC connected to a TV, from the sofa, often in the dark, driven by keyboard.

## Product Purpose

Animix ITA is the desktop GUI of ani-cli-it: it searches AnimeWorld, plays episodes inside the app, remembers where you left off, and connects to AniList for ratings, rankings and progress sync. Success: the shortest path from opening the app to the next episode you want to watch, in Italian.

## Positioning

An app for the Italian catalog of AnimeWorld (Sub ITA and Dub ITA as separate entries) with an in-app player, OP/ED skipping (aniskip), preloaded next episode, local history, downloads, and optional AniList sync. It does not host content.

## Operating Context

- Content: AnimeWorld (scraped from the Electron main process; the domain changes often and is set in Settings). Metadata, scores, rankings and user lists: AniList public API plus optional OAuth login. Skip times: aniskip.
- Video: direct MP4 played in `<video>` with custom controls that work in fullscreen; keyboard shortcuts (Space, F, M, ←/→ 5s, O +85s).
- Data: history and settings stored locally in `animix-it.json` under the app's userData; downloads saved to a downloads folder.

## Capabilities and Constraints

- Screens: Home (continue watching with "new episodes" highlights, latest episodes Sub/Dub with load more, AniList "watching" with status change, reorderable sections), Search (all/sub/dub), Discover (AniList trending/popular/season), Anime detail (scores, genres, synopsis, MAL/AniList links, episode list with watched marks, per-episode and range downloads), Player, History, Settings (AnimeWorld domain, AniList login, version).
- All features above must be preserved.
- Offline-capable UI assets: fonts and icons are bundled, no remote CDNs.
- Minimum window 940×600; default 1280×820.

## Brand Commitments

- Name: **Animix ITA** (binding). Icon, colors and visual identity are free to change.
- Interface language: Italian.

## Evidence on Hand

- Real content comes live from AnimeWorld and AniList (posters, titles, scores, synopses). No testimonials, user counts or claims exist; do not invent them.

## Product Principles

1. The next episode is always one action away.
2. Works as well from the sofa as from the desk: readable at distance, fully keyboard-operable.
3. Italian first: Sub/Dub ITA distinction is always visible where it matters.
4. Content leads, chrome recedes: posters and episodes are the interface.

## Accessibility & Inclusion

Full keyboard operability (TV use with keyboard), visible focus, readable text at TV distance, respect for reduced-motion preferences.
