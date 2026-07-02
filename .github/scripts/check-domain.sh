#!/bin/sh
# check-domain.sh — verifica che il dominio di AnimeWorld usato da ani-cli-it sia
# ancora vivo, non rediriga verso un dominio diverso, e sia ancora funzionale.
#
# Uso:
#   .github/scripts/check-domain.sh            # legge il dominio da ./ani-cli
#   ANI_BASE=www.animeworld.ac .github/scripts/check-domain.sh
#
# Exit code:
#   0 = tutto ok
#   1 = problema rilevato (down, redirect a nuovo dominio, o pagina non funzionale)
#
# Stampa un report leggibile su stdout (usato dal workflow per il corpo della issue).

set -eu

agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0"
script="${ANI_CLI_SCRIPT:-ani-cli}"
official="https://www.animeworlditalia.com"

# dominio atteso: da $ANI_BASE oppure estratto dallo script
if [ -n "${ANI_BASE:-}" ]; then
    base="$ANI_BASE"
else
    base="$(sed -n 's/^animeworld_base="\([^"]*\)".*/\1/p' "$script" | head -1)"
fi
[ -n "$base" ] && [ "${base#*animeworld}" != "$base" ] || {
    printf 'ERRORE: impossibile determinare il dominio atteso (animeworld_base) da %s\n' "$script"
    exit 1
}

# registrable domain, es. www.animeworld.ac -> animeworld.ac
reg_domain() { printf '%s\n' "$1" | sed -nE 's/.*(animeworld\.[a-z]{2,4}).*/\1/p'; }

expected_reg="$(reg_domain "$base")"
status=0

printf '# AnimeWorld domain check\n\n'
printf 'Dominio atteso (da %s): **%s** (registrable: `%s`)\n\n' "$script" "$base" "$expected_reg"

# --- 1) reachability + redirect ---
resp="$(curl -sS -A "$agent" -L --connect-timeout 15 --max-time 45 \
    -o /dev/null -w '%{http_code} %{url_effective} %{num_redirects}' \
    "https://${base}/" 2>/dev/null || true)"
code="$(printf '%s' "$resp" | cut -d' ' -f1)"
final="$(printf '%s' "$resp" | cut -d' ' -f2)"
redirs="$(printf '%s' "$resp" | cut -d' ' -f3)"
final_reg="$(reg_domain "$final")"

printf '## 1. Raggiungibilità\n\n'
printf -- '- HTTP: `%s`\n- URL finale: `%s`\n- Redirect: `%s`\n\n' "$code" "$final" "$redirs"

case "$code" in
    2*|3*) ;;
    *)
        printf ':x: **Il dominio non risponde correttamente** (HTTP %s).\n\n' "$code"
        status=1
        ;;
esac

if [ -n "$final_reg" ] && [ "$final_reg" != "$expected_reg" ]; then
    printf ':warning: **Redirect verso un dominio diverso:** `%s` -> `%s`. Probabile cambio di dominio.\n\n' "$expected_reg" "$final_reg"
    status=1
fi

# --- 2) functional check: /search restituisce link /play/ ---
play_links="$(curl -sS -A "$agent" -L --connect-timeout 15 --max-time 45 \
    "https://${base}/search?keyword=naruto" 2>/dev/null | grep -c 'href="/play/' || true)"
printf '## 2. Funzionale (ricerca)\n\n'
printf -- '- link `/play/` trovati per "naruto": `%s`\n\n' "$play_links"
if [ "${play_links:-0}" -lt 1 ]; then
    printf ':x: **La ricerca non restituisce risultati** — la pagina potrebbe essere cambiata o non essere piu AnimeWorld.\n\n'
    status=1
fi

# --- 3) lista domini ufficiali ---
printf '## 3. Domini ufficiali (%s)\n\n' "$official"
domains="$(curl -sS -A "$agent" -L --connect-timeout 15 --max-time 45 "$official" 2>/dev/null |
    grep -oiE 'animeworld\.[a-z]{2,4}' | tr 'A-Z' 'a-z' | sort -u || true)"
if [ -n "$domains" ]; then
    printf 'Domini elencati:\n\n'
    printf '%s\n' "$domains" | sed 's/^/- `/; s/$/`/'
    printf '\n'
    if printf '%s\n' "$domains" | grep -qx "$expected_reg"; then
        printf ':white_check_mark: Il dominio atteso `%s` e ancora nella lista ufficiale.\n\n' "$expected_reg"
    else
        printf ':warning: Il dominio atteso `%s` **non** e piu nella lista ufficiale. Candidati: %s\n\n' \
            "$expected_reg" "$(printf '%s ' $domains)"
        status=1
    fi
else
    printf '(impossibile leggere la lista ufficiale — check saltato)\n\n'
fi

# --- esito ---
printf '## Esito\n\n'
if [ "$status" -eq 0 ]; then
    printf ':white_check_mark: **Nessun problema rilevato.** Il dominio `%s` e vivo e funzionante.\n' "$base"
else
    printf ':rotating_light: **Rilevato un problema.** Potrebbe servire aggiornare `animeworld_base` in `ani-cli`.\n'
fi

exit "$status"
