// AniList GraphQL client — CommonJS, Node global fetch.
// Public queries (no auth): metadata by MAL id, trending/popular/seasonal, search.
// Authenticated queries (viewer, lists, progress mutation) take an access token.

const ENDPOINT = "https://graphql.anilist.co";
const store = require("./store.cjs");

// simple in-memory cache for MAL-id lookups (cleared on restart)
const malCache = new Map();

async function gql(query, variables = {}, token = null) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  if (json.errors) {
    const msg = json.errors.map((e) => e.message).join("; ");
    throw new Error(msg || `AniList error ${res.status}`);
  }
  return json.data;
}

const MEDIA_FIELDS = `
  id idMal
  title { romaji english }
  averageScore episodes duration format status season seasonYear
  coverImage { large extraLarge color }
  bannerImage
  genres
  description(asHtml: false)
`;

// --- metadata by MAL id (the bridge from AnimeWorld) ---------------------
async function byMalId(idMal) {
  const n = parseInt(idMal, 10);
  if (!n) return null;
  if (malCache.has(n)) return malCache.get(n);
  try {
    const data = await gql(
      `query($idMal:Int){ Media(idMal:$idMal, type:ANIME){ ${MEDIA_FIELDS} } }`,
      { idMal: n },
    );
    malCache.set(n, data.Media || null);
    return data.Media || null;
  } catch {
    malCache.set(n, null);
    return null;
  }
}

// --- discovery listings --------------------------------------------------
async function listing(sort, extra = {}) {
  const seasonArgs =
    extra.season && extra.seasonYear ? ", season:$season, seasonYear:$year" : "";
  const varDefs =
    extra.season && extra.seasonYear ? "$season:MediaSeason,$year:Int," : "";
  const data = await gql(
    `query(${varDefs}$sort:[MediaSort]){
      Page(page:1, perPage:24){
        media(sort:$sort, type:ANIME${seasonArgs}, isAdult:false){ ${MEDIA_FIELDS} }
      }
    }`,
    { sort, season: extra.season, year: extra.seasonYear },
  );
  return data.Page.media;
}

const trending = () => listing(["TRENDING_DESC"]);
const popular = () => listing(["POPULARITY_DESC"]);

function currentSeason() {
  const m = new Date().getMonth();
  const season =
    m <= 1 || m === 11 ? "WINTER" : m <= 4 ? "SPRING" : m <= 7 ? "SUMMER" : "FALL";
  const year = new Date().getFullYear();
  return { season, seasonYear: year };
}
const seasonal = () =>
  listing(["POPULARITY_DESC"], currentSeason());

// --- search --------------------------------------------------------------
async function search(query) {
  const data = await gql(
    `query($q:String){ Page(page:1, perPage:24){
      media(search:$q, type:ANIME, sort:SEARCH_MATCH){ ${MEDIA_FIELDS} }
    }}`,
    { q: query },
  );
  return data.Page.media;
}

// --- authenticated: viewer, lists, progress ------------------------------
function token() {
  return store.getSettings().anilistToken || null;
}

async function viewer() {
  const t = token();
  if (!t) return null;
  try {
    const data = await gql(`query{ Viewer{ id name avatar{ medium } } }`, {}, t);
    return data.Viewer;
  } catch {
    return null;
  }
}

// user's lists (WATCHING/COMPLETED/etc.) as MediaListCollection
async function userList(status = "CURRENT") {
  const t = token();
  const v = await viewer();
  if (!t || !v) return [];
  const data = await gql(
    `query($userId:Int,$status:MediaListStatus){
      MediaListCollection(userId:$userId, type:ANIME, status:$status){
        lists{ entries{ progress score media{ ${MEDIA_FIELDS} } } }
      }
    }`,
    { userId: v.id, status },
    t,
  );
  const lists = data.MediaListCollection?.lists || [];
  return lists.flatMap((l) => l.entries);
}

// push progress (episodes watched) to AniList by MAL id
async function setProgress(idMal, progress) {
  const t = token();
  if (!t) return null;
  const media = await byMalId(idMal);
  if (!media) return null;
  const data = await gql(
    `mutation($mediaId:Int,$progress:Int){
      SaveMediaListEntry(mediaId:$mediaId, progress:$progress, status:CURRENT){
        id progress status
      }
    }`,
    { mediaId: media.id, progress },
    t,
  );
  return data.SaveMediaListEntry;
}

module.exports = {
  byMalId,
  trending,
  popular,
  seasonal,
  search,
  viewer,
  userList,
  setProgress,
};
