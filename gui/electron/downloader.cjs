// Episode downloader — streams the direct MP4 to an organized folder under
// <Downloads>/Animix/<Anime>/<Anime> - Ep NN.mp4, with progress events.
const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const { Readable } = require("stream");
const scraper = require("./scraper.cjs");

const AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0";

// active downloads, keyed by episode token, for cancellation
const controllers = new Map();

// strip characters illegal in file names across platforms
function sanitize(s) {
  return (
    String(s)
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "anime"
  );
}

// zero-pad integer episode numbers ("1" -> "01"); leave specials ("1.5") as-is
function padEp(ep) {
  const s = String(ep);
  return /^\d+$/.test(s) ? s.padStart(2, "0") : s;
}

// normalize an episode label for equality checks ("01" and "1" -> "1")
function normEp(ep) {
  const n = parseFloat(ep);
  return isNaN(n) ? String(ep) : String(n);
}

function baseDir() {
  return path.join(app.getPath("downloads"), "Animix");
}

function animeDir(title) {
  return path.join(baseDir(), sanitize(title));
}

function destFor(title, ep) {
  return path.join(animeDir(title), `${sanitize(title)} - Ep ${padEp(ep)}.mp4`);
}

// list already-downloaded episode numbers (normalized) for an anime
function downloadedEps(title) {
  try {
    return fs
      .readdirSync(animeDir(title))
      .map((f) => f.match(/- Ep ([\d.]+)\.mp4$/))
      .filter(Boolean)
      .map((m) => normEp(m[1]));
  } catch {
    return [];
  }
}

async function downloadEpisode(win, { slug, title, ep, token }) {
  const send = (type, extra) =>
    win &&
    !win.isDestroyed() &&
    win.webContents.send("download:event", { type, token, slug, ep, ...extra });

  const dest = destFor(title, ep);
  if (fs.existsSync(dest)) {
    send("done", { dest });
    return { dest, already: true };
  }

  const url = await scraper.episodeUrl(token);
  if (!url) {
    send("error", { message: "URL episodio non trovato" });
    throw new Error("episode url not found");
  }

  fs.mkdirSync(animeDir(title), { recursive: true });
  const tmp = dest + ".part";
  const ac = new AbortController();
  controllers.set(token, ac);

  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { "User-Agent": AGENT, Referer: `https://${scraper.getBase()}/` },
    });
    if (!res.ok || !res.body) throw new Error("HTTP " + res.status);
    const total = Number(res.headers.get("content-length")) || 0;
    let received = 0;
    let lastPct = -1;

    const nodeStream = Readable.fromWeb(res.body);
    const out = fs.createWriteStream(tmp);
    nodeStream.on("data", (chunk) => {
      received += chunk.length;
      const pct = total ? Math.round((received / total) * 100) : 0;
      if (pct !== lastPct) {
        lastPct = pct;
        send("progress", { received, total, pct });
      }
    });

    await new Promise((resolve, reject) => {
      nodeStream.pipe(out);
      out.on("finish", resolve);
      out.on("error", reject);
      nodeStream.on("error", reject);
    });

    fs.renameSync(tmp, dest);
    send("done", { dest });
    return { dest };
  } catch (e) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // no partial file to clean
    }
    if (ac.signal.aborted) {
      send("cancelled", {});
      return { cancelled: true };
    }
    send("error", { message: String((e && e.message) || e) });
    throw e;
  } finally {
    controllers.delete(token);
  }
}

function cancelDownload(token) {
  const ac = controllers.get(token);
  if (ac) ac.abort();
  return true;
}

function openDownloads() {
  const dir = baseDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // ignore mkdir failure; shell.openPath will report it
  }
  return dir;
}

module.exports = {
  downloadEpisode,
  cancelDownload,
  downloadedEps,
  openDownloads,
};
