// ani-skip: fetch opening/ending skip timestamps from the aniskip API by MAL id.
// Same source used by the ani-cli --skip feature.

const AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0";

// returns { op: {start, end} | null, ed: {start, end} | null } or null
async function skipTimes(malId, episode) {
  const id = parseInt(malId, 10);
  const ep = parseInt(episode, 10);
  if (!id || !ep) return null;
  try {
    const res = await fetch(
      `https://api.aniskip.com/v1/skip-times/${id}/${ep}?types=op&types=ed`,
      { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(8000) },
    );
    const json = await res.json().catch(() => ({}));
    if (!json.found || !Array.isArray(json.results)) return null;
    const out = { op: null, ed: null };
    for (const r of json.results) {
      const iv = r.interval;
      if (!iv) continue;
      if (r.skip_type === "op") out.op = { start: iv.start_time, end: iv.end_time };
      if (r.skip_type === "ed") out.ed = { start: iv.start_time, end: iv.end_time };
    }
    return out.op || out.ed ? out : null;
  } catch {
    return null;
  }
}

module.exports = { skipTimes };
