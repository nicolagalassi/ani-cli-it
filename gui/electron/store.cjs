// Simple JSON persistence in the app's userData dir.
// Tracks watch history: per anime, the set of watched episodes, the last
// watched one, playback position, and metadata for "Continue watching".

const { app } = require("electron");
const fs = require("fs");
const path = require("path");

const STORE = "animix-it.json";
const file = () => path.join(app.getPath("userData"), STORE);

// pre-rename (AniPlay) store locations, for a one-time history migration
function legacyFiles() {
  const appData = app.getPath("appData");
  return [
    path.join(appData, "AniPlay ITA", "aniplay-it.json"),
    path.join(appData, "aniplay-it", "aniplay-it.json"),
  ];
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(file(), "utf8"));
  } catch {
    // migrate history/settings from the old AniPlay store on first launch
    for (const legacy of legacyFiles()) {
      try {
        const data = JSON.parse(fs.readFileSync(legacy, "utf8"));
        save(data);
        return data;
      } catch {
        // try next candidate
      }
    }
    return { history: {}, settings: {} };
  }
}

function save(data) {
  try {
    fs.mkdirSync(path.dirname(file()), { recursive: true });
    fs.writeFileSync(file(), JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("store save failed:", e);
  }
}

// record progress for an episode of an anime
// entry key = slug
function recordProgress({ slug, title, poster, ep, token, position, duration }) {
  const data = load();
  const h = data.history[slug] || {
    slug,
    title,
    poster,
    watched: [],
    lastEp: null,
    lastToken: null,
    position: 0,
    duration: 0,
    updatedAt: 0,
  };
  if (title) h.title = title;
  if (poster) h.poster = poster;
  if (ep != null && !h.watched.includes(String(ep))) h.watched.push(String(ep));
  if (ep != null) h.lastEp = String(ep);
  if (token) h.lastToken = token;
  if (position != null) h.position = position;
  if (duration != null) h.duration = duration;
  h.updatedAt = Date.now();
  data.history[slug] = h;
  save(data);
  return h;
}

// list history entries, most recently watched first
function history() {
  const data = load();
  return Object.values(data.history).sort((a, b) => b.updatedAt - a.updatedAt);
}

function getEntry(slug) {
  return load().history[slug] || null;
}

function clearHistory() {
  const data = load();
  data.history = {};
  save(data);
}

function removeEntry(slug) {
  const data = load();
  delete data.history[slug];
  save(data);
}

function getSettings() {
  return load().settings || {};
}

function setSetting(key, value) {
  const data = load();
  data.settings = data.settings || {};
  data.settings[key] = value;
  save(data);
  return data.settings;
}

module.exports = {
  recordProgress,
  history,
  getEntry,
  clearHistory,
  removeEntry,
  getSettings,
  setSetting,
};
