const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const scraper = require("./scraper.cjs");
const store = require("./store.cjs");
const anilist = require("./anilist.cjs");
const aniskip = require("./aniskip.cjs");

const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: "#0e0b1a",
    autoHideMenuBar: true,
    title: "Animix ITA",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

// --- IPC: scraping ---------------------------------------------------------
ipcMain.handle("ani:search", (_e, query, mode) => scraper.search(query, mode));
ipcMain.handle("ani:episodes", (_e, slug) => scraper.episodes(slug));
ipcMain.handle("ani:episodeUrl", (_e, token) => scraper.episodeUrl(token));
ipcMain.handle("ani:latest", (_e, mode) => scraper.latest(mode));
ipcMain.handle("ani:base", () => scraper.getBase());
ipcMain.handle("ani:setBase", (_e, b) => {
  scraper.setBase(b);
  store.setSetting("base", b);
  return scraper.getBase();
});

// --- IPC: history / store --------------------------------------------------
ipcMain.handle("store:recordProgress", (_e, entry) => store.recordProgress(entry));
ipcMain.handle("store:history", () => store.history());
ipcMain.handle("store:getEntry", (_e, slug) => store.getEntry(slug));
ipcMain.handle("store:removeEntry", (_e, slug) => store.removeEntry(slug));
ipcMain.handle("store:clearHistory", () => store.clearHistory());
ipcMain.handle("store:settings", () => store.getSettings());
ipcMain.handle("store:setSetting", (_e, k, v) => store.setSetting(k, v));

// --- IPC: anilist (public) -------------------------------------------------
ipcMain.handle("al:byMalId", (_e, idMal) => anilist.byMalId(idMal));
ipcMain.handle("al:trending", () => anilist.trending());
ipcMain.handle("al:popular", () => anilist.popular());
ipcMain.handle("al:seasonal", () => anilist.seasonal());
ipcMain.handle("al:search", (_e, q) => anilist.search(q));

// --- IPC: aniskip ----------------------------------------------------------
ipcMain.handle("skip:times", (_e, malId, ep) => aniskip.skipTimes(malId, ep));

// --- IPC: anilist (account) ------------------------------------------------
ipcMain.handle("al:viewer", () => anilist.viewer());
ipcMain.handle("al:userList", (_e, status) => anilist.userList(status));
ipcMain.handle("al:setProgress", (_e, idMal, progress) =>
  anilist.setProgress(idMal, progress),
);
ipcMain.handle("al:logout", () => {
  store.setSetting("anilistToken", null);
  return true;
});

// OAuth implicit-grant: open AniList authorize in a window, capture the
// access_token from the redirect URL fragment, store it, return the viewer.
ipcMain.handle("al:login", async () => {
  const clientId = store.getSettings().anilistClientId;
  if (!clientId) throw new Error("NO_CLIENT_ID");
  const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${encodeURIComponent(
    clientId,
  )}&response_type=token`;

  return new Promise((resolve, reject) => {
    const w = new BrowserWindow({
      width: 480,
      height: 720,
      title: "Accedi ad AniList",
      autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });
    let done = false;

    const resolveViewer = async () => {
      // token is stored; viewer() can transiently fail right after login, so retry
      for (let i = 0; i < 3; i++) {
        const v = await anilist.viewer().catch(() => null);
        if (v) return resolve(v);
        await new Promise((r) => setTimeout(r, 600));
      }
      resolve(null);
    };

    const grab = (url) => {
      if (done || !url) return;
      let hash = "";
      try {
        hash = new URL(url).hash;
      } catch {
        return;
      }
      const m = hash.match(/access_token=([^&]+)/);
      if (m) {
        done = true;
        const token = decodeURIComponent(m[1]);
        store.setSetting("anilistToken", token);
        try {
          w.close();
        } catch {}
        resolveViewer();
      }
    };

    w.webContents.on("will-redirect", (_ev, url) => grab(url));
    w.webContents.on("will-navigate", (_ev, url) => grab(url));
    w.webContents.on("did-navigate", (_ev, url) => grab(url));
    w.webContents.on("did-navigate-in-page", (_ev, url) => grab(url));
    w.on("closed", () => {
      if (!done) reject(new Error("LOGIN_CANCELLED"));
    });
    w.loadURL(authUrl);
  });
});

// --- IPC: misc -------------------------------------------------------------
ipcMain.handle("app:openExternal", (_e, url) => shell.openExternal(url));

app.whenReady().then(() => {
  // restore a custom domain if set
  const s = store.getSettings();
  if (s.base) scraper.setBase(s.base);

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
