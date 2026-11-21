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

<!-- impeccable:design-map -->
Name: Animix ITA
Colors: primary: yellow #ffd23f; secondary: sub #38c6f4; tertiary: danger #ff7a7a; neutral: ground #10142a; secondary: dub #ff6b97; tertiary: ok #6fe3aa; tertiary: paint-fallback #e4a143 (+8 more in the sidecar)
Fonts: Archivo Variable (display, headline, page-title, title, label); Atkinson Hyperlegible Next Variable (body, body-strong)
Spacing: gutter 2.25rem, gutter-narrow 1.5rem, rail 13.5rem, rail-narrow 4.75rem
Radius: sm 4px, md 6px
North Star: "Rodovetro" (the anime cel)
Rules:
- The Paint Has a Job Rule. Yellow means watch or new, cyan means Sub ITA, pink means Dub ITA.
- The Ink on Paint Rule. On a series-painted field, text and buttons are ink (`btn-ink`, `btn-ink-ghost`), and tags flip to ink fills that keep their paint as text colour, so no paint ever sits on another paint.
- The Normalised Paint Rule. Series colours are never used raw.
- The Numerals Are Archivo Rule. Episode numbers, facts (score, year, episodes), times, skip amounts and download percentages are set in Archivo 800–900 with tabular figures.
- The Uppercase Is for Tags Rule. Uppercase letter-spaced text exists only inside tags.
- The No Light Rule. No gradients, glass, backdrop blur or glow.
Elevation:
- Focus ink ring: outline: 3px solid paper; outline-offset: 2px; box-shadow: 0 0 0 2px ink
- Popover drop: 0 0.75rem 2rem rgba(0,0,0,0.5)
Don't:
- Don't use gradients, glass, backdrop blur or glow, including scrims over video; use a flat ink band.
- Don't use yellow for a non-watch action or as decoration.
- Don't put yellow, cyan or pink fills on a painted field; flip them to ink fills.
- Don't use raw series colours unnormalised.
- Don't round controls into pills; corners stay at 3–6px.
- Don't set uppercase letter-spaced text outside tags.
Do:
- Do reserve yellow for watch and new: the Play button, NEW tags, the current episode, the next-episode overlay, progress fills.
- Do mark Sub ITA in cyan and Dub ITA in pink wherever the version matters.
- Do use paper fill with an ink border for primary actions that are not watching.
- Do put only ink on series paint, and pass every series colour through `oklch(from <src> 0.8 0.125 h)`.
- Do outline painted shapes in ink (2px on controls and tags, 3px on painted fields, their posters and the player stage).
- (+3 more)
Map: src/lib/paint.ts
Full: .impeccable/design-full.md (read a section when you need its detail)
