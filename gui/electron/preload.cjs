const { contextBridge, ipcRenderer } = require("electron");

// Expose a typed-ish, promise-based API to the renderer.
contextBridge.exposeInMainWorld("ani", {
  // scraping
  search: (query, mode) => ipcRenderer.invoke("ani:search", query, mode),
  episodes: (slug) => ipcRenderer.invoke("ani:episodes", slug),
  episodeUrl: (token) => ipcRenderer.invoke("ani:episodeUrl", token),
  info: (slug) => ipcRenderer.invoke("ani:info", slug),
  resolveByMal: (idMal, titles) =>
    ipcRenderer.invoke("ani:resolveByMal", idMal, titles),
  latest: (mode) => ipcRenderer.invoke("ani:latest", mode),
  getBase: () => ipcRenderer.invoke("ani:base"),
  setBase: (b) => ipcRenderer.invoke("ani:setBase", b),

  // history / store
  recordProgress: (entry) => ipcRenderer.invoke("store:recordProgress", entry),
  history: () => ipcRenderer.invoke("store:history"),
  getEntry: (slug) => ipcRenderer.invoke("store:getEntry", slug),
  removeEntry: (slug) => ipcRenderer.invoke("store:removeEntry", slug),
  clearHistory: () => ipcRenderer.invoke("store:clearHistory"),
  settings: () => ipcRenderer.invoke("store:settings"),
  setSetting: (k, v) => ipcRenderer.invoke("store:setSetting", k, v),

  // anilist (public)
  alByMalId: (idMal) => ipcRenderer.invoke("al:byMalId", idMal),
  alTrending: () => ipcRenderer.invoke("al:trending"),
  alPopular: () => ipcRenderer.invoke("al:popular"),
  alSeasonal: () => ipcRenderer.invoke("al:seasonal"),
  alSearch: (q) => ipcRenderer.invoke("al:search", q),

  // anilist (account)
  alLogin: () => ipcRenderer.invoke("al:login"),
  alLogout: () => ipcRenderer.invoke("al:logout"),
  alViewer: () => ipcRenderer.invoke("al:viewer"),
  alUserList: (status) => ipcRenderer.invoke("al:userList", status),
  alSetProgress: (idMal, progress) =>
    ipcRenderer.invoke("al:setProgress", idMal, progress),

  // aniskip
  skipTimes: (malId, ep) => ipcRenderer.invoke("skip:times", malId, ep),

  // misc
  openExternal: (url) => ipcRenderer.invoke("app:openExternal", url),

  // downloads
  downloadEpisode: (req) => ipcRenderer.invoke("dl:episode", req),
  cancelDownload: (token) => ipcRenderer.invoke("dl:cancel", token),
  downloadedEps: (title) => ipcRenderer.invoke("dl:downloaded", title),
  openDownloads: () => ipcRenderer.invoke("dl:open"),
  onDownload: (cb) => {
    const h = (_e, data) => cb(data);
    ipcRenderer.on("download:event", h);
    return () => ipcRenderer.removeListener("download:event", h);
  },
});
