// AnimeWorld scraper — CommonJS, uses Node's global fetch (Node 18+).
// Ported from the verified ani-cli-it shell logic. Runs in the Electron main
// process (no CORS restrictions).

const AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0";

// base domain, overridable (AnimeWorld rotates domains)
let BASE = process.env.ANI_BASE || "www.animeworld.ac";
const setBase = (b) => {
  if (b) BASE = b;
};
const getBase = () => BASE;

async function get(path, { redirect = "follow" } = {}) {
  const url = path.startsWith("http") ? path : `https://${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": AGENT },
    redirect,
  });
  return { ok: res.ok, status: res.status, url: res.url, text: await res.text() };
}

// decode the handful of HTML entities AnimeWorld emits in titles
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#0*39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#0*34;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// registrable domain, e.g. www.animeworld.ac -> animeworld.ac
function regDomain(host) {
  const m = String(host).match(/(animeworld\.[a-z]{2,4})/i);
  return m ? m[1].toLowerCase() : "";
}

// --- search ---------------------------------------------------------------
// mode: "sub" (default) | "dub" | "all"
async function search(query, mode = "sub") {
  const { text } = await get(`/search?keyword=${encodeURIComponent(query)}`);
  return parseItems(text, mode);
}

// parse <div class="item"> blocks from a search/listing page
function parseItems(html, mode = "all") {
  const items = [];
  const seen = new Set();
  // split into item blocks
  const blocks = html.split('<div class="item">').slice(1);
  for (const block of blocks) {
    const nameM = block.match(
      /<a href="\/play\/([^"/]+)"[^>]*data-jtitle="([^"]*)"[^>]*class="name"[^>]*>([^<]*)<\/a>/,
    );
    if (!nameM) continue;
    const slug = nameM[1];
    const title = decodeEntities(nameM[3]);
    const dub = /<div class="dub">/.test(block);
    if (mode === "sub" && dub) continue;
    if (mode === "dub" && !dub) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    const posterM = block.match(
      /<img[^>]*src="(https:\/\/img\.animeworld\.ac\/locandine\/[^"]+)"/,
    );
    items.push({
      slug,
      title,
      dub,
      poster: posterM ? posterM[1] : null,
    });
  }
  return items;
}

// --- episodes -------------------------------------------------------------
// returns { slug, title, poster, malId, dub, episodes: [{num, token}] }
async function episodes(slug) {
  const { text } = await get(`/play/${slug}`);
  const episodes = [];
  const seen = new Set();
  const re =
    /<a[^>]*data-id="([A-Za-z0-9_-]+)"[^>]*data-episode-num="([0-9.]+)"[^>]*>/g;
  let m;
  while ((m = re.exec(text))) {
    const num = m[2];
    if (seen.has(num)) continue;
    seen.add(num);
    episodes.push({ num, token: m[1] });
  }
  episodes.sort((a, b) => parseFloat(a.num) - parseFloat(b.num));
  const titleM = text.match(/<h1[^>]*id="[^"]*"[^>]*>([^<]+)<\/h1>/);
  const posterM = text.match(
    /"image":\s*"(https:\/\/img\.animeworld\.ac\/locandine\/[^"]+)"|<meta property="og:image" content="([^"]+)"/,
  );
  const malM = text.match(/myanimelist\.net\/anime\/([0-9]+)/);
  const scoreM = text.match(/"ratingValue":\s*"?([0-9.]+)"?/);
  const votesM = text.match(/"ratingCount":\s*"?([0-9]+)"?/);
  const dub = /\(ITA\)|data-name="dub"/.test(slug) || /class="dub"/.test(text);
  return {
    slug,
    title: titleM ? decodeEntities(titleM[1].trim()) : slug,
    poster: posterM ? posterM[1] || posterM[2] : null,
    malId: malM ? malM[1] : null,
    awScore: scoreM ? parseFloat(scoreM[1]) : null,
    awVotes: votesM ? parseInt(votesM[1], 10) : null,
    episodes,
  };
}

// --- episode url (direct mp4) --------------------------------------------
async function episodeUrl(token) {
  for (const alt of ["0", "1"]) {
    const { text } = await get(
      `/api/episode/info?id=${encodeURIComponent(token)}&alt=${alt}`,
    );
    const m = text.match(/"grabber":"([^"]*)"/);
    if (m && m[1]) return m[1].replace(/\\\//g, "/");
  }
  return null;
}

// --- latest episodes (home tabs) -----------------------------------------
// mode: "sub" | "dub"; returns [{slug, title, poster, ep, token}]
async function latest(mode = "sub") {
  const tab = mode === "dub" ? "dub" : "sub";
  const { text } = await get(`/`);
  // isolate the tab's content div
  const parts = text.replace(/\n/g, " ").split('<div class="content');
  const seg = parts.find((p) => p.startsWith(`" data-name="${tab}"`) || p.startsWith(` hidden" data-name="${tab}"`) || p.includes(`data-name="${tab}"`) && p.includes('class="film-list"'));
  if (!seg) return [];
  const out = [];
  const seen = new Set();
  const blocks = seg.split('<div class="item">').slice(1);
  for (const block of blocks) {
    const hrefM = block.match(
      /<a href="\/play\/([^"/]+)\/([^"]+)"[^>]*class="poster"/,
    );
    if (!hrefM) continue;
    const slug = hrefM[1];
    const token = hrefM[2];
    const epM = block.match(/<div class="ep">\s*Ep ([0-9.]+)\s*<\/div>/);
    const nameM = block.match(/class="name"[^>]*>([^<]*)<\/a>/);
    const posterM = block.match(
      /<img[^>]*src="(https:\/\/img\.animeworld\.ac\/locandine\/[^"]+)"/,
    );
    if (!epM) continue;
    const key = `${slug}#${epM[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      slug,
      token,
      ep: epM[1],
      title: nameM ? decodeEntities(nameM[1]) : slug,
      poster: posterM ? posterM[1] : null,
    });
  }
  return out;
}

// --- resolve AnimeWorld slug from a MAL id (bridge from AniList) ----------
// searches title variants, then confirms the match by the MAL id on the play
// page; returns the full detail (episodes + rating) or null if not in catalog.
async function resolveByMal(idMal, titles = []) {
  const target = parseInt(idMal, 10);
  if (!target) return null;
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const wanted = titles.map(norm).filter(Boolean);

  // strip season/part/ordinal qualifiers: AnimeWorld's search matches the base
  // title far better than the full "... Season 2 Part 2" string
  const baseTitle = (t) =>
    String(t)
      .replace(/\s*[:\-–—].*$/, "")
      .replace(/\s+(final\s+)?(season|stagione|cour|part|parte)\s*\d*.*$/i, "")
      .replace(/\s+\d+(st|nd|rd|th)\s+season.*$/i, "")
      .replace(/\s+\b(ii|iii|iv|v|vi|vii)\b\s*$/i, "")
      .replace(/\s+\d+\s*$/, "")
      .trim();

  // build search queries: full titles + their stripped bases (deduped)
  const queries = [];
  const addQ = (q) => {
    const k = (q || "").trim();
    if (k && !queries.includes(k)) queries.push(k);
  };
  for (const t of titles) {
    addQ(t);
    addQ(baseTitle(t));
  }

  // collect unique candidate slugs from each query
  const seen = new Set();
  const candidates = [];
  for (const q of queries) {
    let items = [];
    try {
      items = await search(q, "all");
    } catch {
      items = [];
    }
    for (const it of items) {
      if (!seen.has(it.slug)) {
        seen.add(it.slug);
        candidates.push(it);
      }
    }
    if (candidates.length >= 40) break;
  }

  // rank by token overlap against BOTH the display title and the slug (the
  // slug often carries the romaji even when the title is english), so the right
  // anime is fetched first even when titles differ across sites
  const rank = (it) => {
    const slugText = norm(it.slug.replace(/\.[^.]*$/, ""));
    const hay = norm(it.title) + " " + slugText;
    let best = 0;
    for (const w of wanted) {
      if (!w) continue;
      if (hay.includes(w)) return 3;
      const words = w.split(" ").filter(Boolean);
      const hits = words.filter((x) => hay.includes(x)).length;
      if (words.length) best = Math.max(best, hits / words.length);
    }
    return best;
  };
  const cand = candidates
    .map((it) => ({ it, r: rank(it) }))
    .filter((x) => x.r > 0)
    .sort((a, b) => b.r - a.r)
    .slice(0, 8)
    .map((x) => x.it);

  // confirm by MAL id in small parallel batches (best-ranked first) so a match
  // is found fast and a miss can't hammer the site or hang the UI
  for (let i = 0; i < cand.length; i += 4) {
    const batch = cand.slice(i, i + 4);
    const details = await Promise.all(
      batch.map((it) => episodes(it.slug).catch(() => null)),
    );
    for (const d of details) {
      if (d && d.malId && parseInt(d.malId, 10) === target) return d;
    }
  }
  return null;
}

module.exports = {
  search,
  episodes,
  episodeUrl,
  latest,
  resolveByMal,
  setBase,
  getBase,
  regDomain,
  AGENT,
};
