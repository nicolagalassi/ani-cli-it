---
name: Animix ITA
description: The desktop player for Italian Sub and Dub anime, drawn as an anime cel.
colors:
  ground: "#10142a"
  ground-2: "#161b38"
  ground-3: "#1e2550"
  line: "#343e7a"
  line-strong: "#4a5596"
  field-border: "#6a76b8"
  ink: "#05060f"
  paper: "#eef0ff"
  muted: "#a7afd6"
  yellow: "#ffd23f"
  sub: "#38c6f4"
  dub: "#ff6b97"
  danger: "#ff7a7a"
  ok: "#6fe3aa"
  paint-fallback: "#e4a143"
typography:
  display:
    fontFamily: "Archivo Variable, Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "5.5rem"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 78"
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "Archivo Variable, Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 104"
  page-title:
    fontFamily: "Archivo Variable, Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 850
    lineHeight: 1.05
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 108"
  title:
    fontFamily: "Archivo Variable, Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 110"
  body:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  body-strong:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
    lineHeight: 1.25
  label:
    fontFamily: "Archivo Variable, Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
    fontFeature: "'tnum' 1"
rounded:
  sm: "4px"
  md: "6px"
spacing:
  gutter: "2.25rem"
  gutter-narrow: "1.5rem"
  rail: "13.5rem"
  rail-narrow: "4.75rem"
components:
  button-play:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 1.15rem"
    height: "2.75rem"
  button-play-hover:
    backgroundColor: "#ffe073"
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 1.15rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "#ffffff"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 1.15rem"
    height: "2.75rem"
  button-ghost-hover:
    backgroundColor: "{colors.ground-3}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 1.15rem"
    height: "2.75rem"
  button-ink-hover:
    backgroundColor: "#1b1f33"
  button-ink-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 1.15rem"
    height: "2.75rem"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "0 1.15rem"
    height: "2.75rem"
  button-danger-hover:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ink}"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    size: "2.25rem"
  tag-new:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "3px"
    padding: "0.3rem 0.45rem"
  tag-sub:
    backgroundColor: "{colors.sub}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "3px"
    padding: "0.3rem 0.45rem"
  tag-dub:
    backgroundColor: "{colors.dub}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "3px"
    padding: "0.3rem 0.45rem"
  tag-neutral:
    backgroundColor: "{colors.ground-3}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "3px"
    padding: "0.3rem 0.45rem"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "0.5rem 0.95rem"
  segmented-option-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  segmented-option-sub-selected:
    backgroundColor: "{colors.sub}"
    textColor: "{colors.ink}"
  segmented-option-dub-selected:
    backgroundColor: "{colors.dub}"
    textColor: "{colors.ink}"
  field:
    backgroundColor: "{colors.ground-2}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 0.9rem"
    height: "2.75rem"
  rail:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.muted}"
    width: "{spacing.rail}"
  rail-item-current:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 0.8rem"
  panel:
    backgroundColor: "{colors.ground-2}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "1.35rem 1.5rem"
  poster-card:
    backgroundColor: "{colors.ground-2}"
    rounded: "{rounded.md}"
  lead-panel:
    backgroundColor: "{colors.paint-fallback}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "1.25rem"
  player-control:
    backgroundColor: "transparent"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    size: "2.5rem"
---

# Design System: Animix ITA

## Overview

**Creative North Star: "Rodovetro" (the anime cel)**

The interface is painted like an animation cel: a night-indigo background painting, flat unmodulated paint laid on top, and a real ink line (2–3px, near-black) around every painted shape. There are no gradients, no glass, no backdrop blur. Depth comes from cel layers (three indigo grounds stepping lighter) and from ink outlines, not from light.

Paint colours have jobs, and the jobs are the system. Yellow marks the next thing to watch and nothing else; cyan is Sub ITA; pink is Dub ITA; paper-white carries every primary action that is not "watch". Each series additionally repaints its own surfaces (lead panel on Home, the band on the series page, its next-episode cell, the player's seek fill) with its AniList cover colour, normalised in OKLCH so ink always reads on it ("ridipintura").

Density is high and calm: one dense row of continue-watching cards, tabular figures everywhere numbers appear, hairline gaps. The UI is built for two distances at once, desk and sofa: type is large, the root size steps up on big windows, and every control has a visible paper-and-ink focus ring.

**Key Characteristics:**
- Flat paint on a night-indigo ground, outlined in ink; no gradients, glass or blur.
- Colour by job: yellow = watch/new, cyan = Sub ITA, pink = Dub ITA, paper = other primary actions, ink = actions on painted fields.
- Per-series paint, normalised to one lightness/chroma band (`oklch(from <src> 0.8 0.125 h)`).
- Archivo with the width axis for numerals and headings; Atkinson Hyperlegible Next for everything read.
- Square-ish corners (3–6px), 2–3px borders, tabular numerals.
- Root size steps (16 → 18 → 21px) for TV-distance viewing.

## Colors

A cool night-indigo cel ground with a small set of saturated flat paints, each assigned one job.

### Primary
- **Next-Episode Yellow** (yellow): the only colour for "watch this now": the Play button, NEW tags, the current episode in the player strip, the "next episode" overlay action, the progress fill on poster cards, active downloads, the text caret, selection and native `accent-color`. A yellow thing on screen is always something to watch.

### Secondary
- **Sub Cyan** (sub): Sub ITA identity: Sub tags, the selected Sub option in the segmented control, genre lines in hover popovers, inline code in Settings.
- **Dub Pink** (dub): Dub ITA identity: Dub tags and the selected Dub option.

### Tertiary
- **Series Paint** (computed, default paint-fallback): every series paints its own fields. Source is the AniList cover colour (or a stable fallback picked from eight hues by slug hash, in `src/lib/paint.ts`), passed as `--paint-src` and normalised to `oklch(from var(--paint-src) 0.8 0.125 h)`. The player seek fill uses the same normalisation at chroma 0.13, falling back to yellow.
- **Danger Coral** (danger): destructive buttons, remove-card hover, error states and failed downloads.
- **Watched Mint** (ok): watched-episode marks, completed downloads, success status lines.

### Neutral
- **Night Ground** (ground): the app background.
- **Cel Layer** (ground-2): panels, fields, cards, episode cells, skeletons.
- **Raised Cel** (ground-3): hover state of cel surfaces, neutral tags, the hover popover, poster fallbacks.
- **Line** (line) and **Strong Line** (line-strong): borders of cel surfaces at rest and on hover; poster outlines; scrollbar thumb.
- **Field Border** (field-border): the input outline, chosen to hold 3:1 against the ground.
- **Ink** (ink): the rail, ink outlines around painted shapes, text and buttons on painted fields, the inner ring of focus.
- **Paper** (paper): primary text, the active rail chip, primary non-watch buttons, the outer focus ring.
- **Muted Lavender** (muted): secondary text, inactive nav, counts, metadata.

### Named Rules
**The Paint Has a Job Rule.** Yellow means watch or new, cyan means Sub ITA, pink means Dub ITA. Never use one of these paints decoratively or for a different meaning; a non-watch primary action is paper, not yellow.

**The Ink on Paint Rule.** On a series-painted field, text and buttons are ink (`btn-ink`, `btn-ink-ghost`), and tags flip to ink fills that keep their paint as text colour, so no paint ever sits on another paint. Yellow is not used on paint because it cannot hold contrast against every series colour.

**The Normalised Paint Rule.** Series colours are never used raw. They always pass through the OKLCH normalisation (L 0.8, C 0.125, source hue) so ink text reads on any series.

## Typography

**Display Font:** Archivo Variable, with the `wdth` axis (fallback Atkinson Hyperlegible Next, system-ui)
**Body Font:** Atkinson Hyperlegible Next Variable (fallback system-ui, sans-serif)

**Character:** Heavy Archivo, squeezed narrow for episode numerals and widened for headings, gives the episode number the weight of a title card; Atkinson carries everything that is read at a distance. Both are bundled via Fontsource.

### Hierarchy
- **Display** (Archivo 900, 5.5rem, line-height 0.82, width 78%, tabular): the huge EP numeral on the Home lead panel. The player's yellow EP numeral uses the same face condensed to 82% at 1.5rem.
- **Headline** (Archivo 900, 2.6rem, line-height 1, width 104%): the series title on the series page. The lead panel title is 850 at 1.75rem, width 104%.
- **Page Title** (Archivo 850, 2rem, line-height 1.05, width 108%): screen titles.
- **Title** (Archivo 800, 1.3rem, line-height 1.1, width 110%): section titles; panel headings are 800 at 1.2rem, width 108%. Section counts beside a title switch to Atkinson 700 at 0.95rem in muted.
- **Body** (Atkinson 400, 1rem, line-height 1.45): running text; synopses at line-height 1.6 within 75ch; panel copy within 68ch.
- **Body Strong** (Atkinson 700, 0.875–1rem): buttons, nav items, card titles, notes.
- **Label** (Archivo 800, 0.8rem, letter-spacing 0.04em, uppercase, tabular): tags only. Keyboard hints and the seek tooltip use Archivo 800 at 0.8rem without uppercase.

### Named Rules
**The Numerals Are Archivo Rule.** Episode numbers, facts (score, year, episodes), times, skip amounts and download percentages are set in Archivo 800–900 with tabular figures. Columns of numbers never jitter.

**The Uppercase Is for Tags Rule.** Uppercase letter-spaced text exists only inside tags. Headings and labels stay sentence case.

## Layout

A two-column shell: a fixed ink rail (13.5rem) and a scrolling stage. Pages cap at 96rem (120rem in the player) and pad `1.5rem var(--gutter) 3.5rem`, with a 2.25rem gutter. Sections are spaced 2.25rem apart; section heads hold a title on the left and tools (segmented control, reorder arrows) on the right at a 2.5rem minimum height.

At 1180px and below the rail collapses to a 4.75rem icon rail (labels hidden, wordmark reduced to an "A"), the gutter drops to 1.5rem, and the Home "next" grid stacks to one column with the side cards in two columns.

Root font size steps for distance viewing: 16px by default, 18px from 1700px wide, 21px from 2300px. Everything is in rem, so the whole interface scales with it. Minimum supported window is 940×600.

Poster grids use `repeat(auto-fill, minmax(10rem, 1fr))` with 1.5rem × 1.1rem gaps; episode lists the same column minimum with 0.6rem gaps. Continue-watching is a single horizontally scrolling row of 17rem-minimum cards with proximity scroll-snap.

## Elevation & Depth

The system is flat. Depth is cel layering: ground → ground-2 → ground-3, with borders stepping line → line-strong on hover, and ink outlines separating painted shapes. Hover lifts are physical but small (poster cards rise 3px, the overlay action 1px, buttons press down 1px on active).

### Shadow Vocabulary
- **Focus ink ring** (`outline: 3px solid paper; outline-offset: 2px; box-shadow: 0 0 0 2px ink`): the only systemic box-shadow; it is part of the focus ring, not elevation.
- **Popover drop** (`box-shadow: 0 0.75rem 2rem rgba(0,0,0,0.5)`): used once, on the hover info popover, which floats over the next row of posters.

### Named Rules
**The No Light Rule.** No gradients, glass, backdrop blur or glow. Overlays that must sit over video use a flat translucent ink band (`rgba(5,6,15,0.82)`) with an ink top line, never a scrim gradient.

## Shapes

Square-ish corners: 4px (sm) for buttons, fields, nav items, icon buttons and small posters' frames; 6px (md) for cards, panels, painted fields and the player stage; 3px literal for the smallest pieces (tags, key hints, tiny posters, inline code, the seek tooltip). Borders are 2px on cel surfaces and controls, 3px ink on painted fields, their posters and the player stage. Posters are always 2:3, cropped with `object-fit: cover`. The only circle is the seek thumb.

## Components

### Buttons
Tactile, outlined, never rounded into pills.
- **Shape:** 4px corners, 2px border, 2.75rem minimum height, 1.15rem side padding, Atkinson 700 at 1rem, icon gap 0.55rem.
- **Play:** yellow fill, ink text and ink border; hover lightens to `#ffe073`. Only for watching.
- **Primary:** paper fill, ink text and border; hover goes pure white. For every primary action that is not watching.
- **Ghost:** transparent with a strong-line border and paper text; hover fills ground-3 and lightens the border to muted.
- **Ink / Ink ghost:** for painted fields. Ink fill with paper text (hover `#1b1f33`), or transparent with ink border and text (hover 12% ink). On the unpainted series band these fall back to yellow play and a strong-line ghost.
- **Danger:** coral outline and text; hover fills coral with ink text.
- **States:** 150ms transitions on colour, border and transform with the shared ease; `:active` presses 1px down; disabled at 50% opacity; busy uses the progress cursor.
- **Icon button:** 2.25rem square, muted icon, hover paper on ground-3; disabled at 35%.

### Tags
- **Style:** Archivo 800 uppercase at 0.8rem, 0.04em tracking, tabular, 3px corners, 2px ink border. NEW is yellow, SUB ITA cyan, DUB ITA pink (all with ink text); neutral is ground-3 with a strong-line border and paper text.
- **On paint:** tags invert to ink fill with ink border, and their paint becomes the text colour (yellow, cyan, pink, or paper).

### Segmented control
- **Style:** a 2px line-bordered group with 4px corners, internal 2px dividers; options in Archivo 800 at 0.85rem, muted.
- **Selected:** paper fill with ink text by default; the Sub option selects to cyan, the Dub option to pink. Focus draws an inset ring (offset −5px) in ink on selected options and paper on unselected ones.

### Cards / Containers
- **Poster card:** a 2:3 poster with 6px corners and a 2px strong-line border; on hover the border turns paper and the poster rises 3px; on focus the poster takes the paper outline with an ink border. A yellow 5px progress meter sits flush on the poster's bottom over a 70% ink track; an EP tag sits top-left; a remove button appears on hover/focus and turns coral.
- **Continue card:** a horizontal ground-2 card (2px line border, 6px corners) with a 3rem poster, title, and a tabular progress line; hovering the poster reveals a yellow play glyph over an ink veil. A card whose next episode is ready lights its line yellow.
- **New-episode card:** compact ground-2 row with a 2.75rem poster and a yellow NEW tag.
- **Panel / Notice / Welcome:** ground-2, 2px line border, 6px corners, 1.1–1.5rem padding.
- **Meter:** exact-length bar, 4px, paper on a 22% paper track; the fill length is the data.
- **Skeletons:** flat ground-2 blocks that breathe in opacity (0.55 → 1, 1.4s alternate).

### Inputs / Fields
- **Style:** ground-2 fill, 2px field-border outline, 4px corners, 2.75rem tall, muted placeholder.
- **Hover / Focus:** border goes muted on hover and paper on focus; fields replace the global ring with the paper border.
- **Search:** 3rem tall (3.5rem in the big variant) with a leading muted icon and a trailing `/` key hint.

### Navigation
- **Rail:** solid ink column with the wordmark (Archivo 900, width 112%, plus a yellow "ITA" chip), five items in Atkinson 700 at 1rem with 1.3rem icons, and the AniList account pinned at the bottom.
- **States:** muted at rest; paper text on `#141936` on hover; the current item is a paper chip with ink text.
- **Narrow:** at 1180px and below, icons only, centred.

### Signature: Painted field ("ridipintura")
The Home lead panel and the series band take the series' normalised paint as their fill, with a 3px ink border, 6px corners, an ink-framed poster, ink text and ink buttons. The next episode in the series' episode list wears the same paint with an ink border; its progress bar turns ink. Without a series colour, the band falls back to an unpainted ground-2 surface.

### Signature: Player
- **Stage:** black, 16:9, 3px ink border and 6px corners (borderless in fullscreen); the cursor hides when controls are hidden.
- **Controls:** a flat ink band (82% ink, 2px ink top line) that fades and rises in over 200ms; buttons are 2.5rem white glyphs on a 16% white hover; time and skip labels are Archivo, tabular.
- **Seek:** 5px track (7px on hover) with the series-paint fill, a paper thumb with ink border that scales in, and an ink tooltip.
- **Overlay action:** paper (yellow when it means "next episode") with a 3px ink border and an inline key hint.
- **Episode strip:** 2.6rem Archivo numeral buttons; the current one is yellow with an ink border; watched ones are muted.
- **Loader:** three small yellow squares hopping in sequence.

### Hover info popover
Appears on latest-episode posters: ground-3 fill, 2px paper border, 6px corners, 18.75rem wide, holding title, tags, cyan genres and a muted synopsis. It is deliberately not hoverable (`pointer-events: none`): it overlaps the next row of cards and must not block clicks on them; Esc dismisses it. It flips to left- or right-aligned at the grid edges.

### Focus
Every focusable element gets a paper outline (3px, offset 2px) around an ink ring (2px), which reads on the ground and on any paint. Controls inside clipped or painted containers (segmented options, episode cells, seek bar) draw the ring inset instead, switching to ink on paint.

### Motion
One ease for everything (`cubic-bezier(0.16, 1, 0.3, 1)`), 150ms for colour and border, 200ms for poster lift and player controls. Under `prefers-reduced-motion: reduce` all animation and transition durations collapse to 1ms, iteration counts to one, and the poster lift is removed.

## Do's and Don'ts

### Do:
- **Do** reserve yellow for watch and new: the Play button, NEW tags, the current episode, the next-episode overlay, progress fills.
- **Do** mark Sub ITA in cyan and Dub ITA in pink wherever the version matters.
- **Do** use paper fill with an ink border for primary actions that are not watching.
- **Do** put only ink on series paint, and pass every series colour through `oklch(from <src> 0.8 0.125 h)`.
- **Do** outline painted shapes in ink (2px on controls and tags, 3px on painted fields, their posters and the player stage).
- **Do** set every number in Archivo with tabular figures.
- **Do** size everything in rem so the 16/18/21px root steps scale the whole UI for TV distance.
- **Do** keep the paper-and-ink focus ring visible on every focusable control.

### Don't:
- **Don't** use gradients, glass, backdrop blur or glow, including scrims over video; use a flat ink band.
- **Don't** use yellow for a non-watch action or as decoration.
- **Don't** put yellow, cyan or pink fills on a painted field; flip them to ink fills.
- **Don't** use raw series colours unnormalised.
- **Don't** round controls into pills; corners stay at 3–6px.
- **Don't** set uppercase letter-spaced text outside tags.
