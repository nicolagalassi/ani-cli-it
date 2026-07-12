const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const scraper = require("./scraper.cjs");
const store = require("./store.cjs");

const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: "#0e0b1a",
    autoHideMenuBar: true,
    title: "AniPlay ITA",
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
