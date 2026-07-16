export interface SearchItem {
  slug: string;
  title: string;
  dub: boolean;
  poster: string | null;
}

export interface Episode {
  num: string;
  token: string;
}

export interface AnimeDetail {
  slug: string;
  title: string;
  poster: string | null;
  malId: string | null;
  awScore: number | null;
  awVotes: number | null;
  episodes: Episode[];
}

export interface LatestItem {
  slug: string;
  token: string;
  ep: string;
  title: string;
  poster: string | null;
}

export interface HistoryEntry {
  slug: string;
  title: string;
  poster: string | null;
  watched: string[];
  lastEp: string | null;
  lastToken: string | null;
  position: number;
  duration: number;
  updatedAt: number;
}

export type Mode = "sub" | "dub";

export interface ProgressInput {
  slug: string;
  title?: string;
  poster?: string | null;
  ep?: string;
  token?: string;
  position?: number;
  duration?: number;
}

export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: { romaji: string; english: string | null };
  averageScore: number | null;
  episodes: number | null;
  duration: number | null;
  format: string | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  coverImage: { large: string; extraLarge: string; color: string | null };
  bannerImage: string | null;
  genres: string[];
  description: string | null;
}

export interface AniListViewer {
  id: number;
  name: string;
  avatar: { medium: string } | null;
}

export interface AniListEntry {
  progress: number;
  score: number;
  media: AniListMedia;
}

export interface SkipInterval {
  start: number;
  end: number;
}
export interface SkipTimes {
  op: SkipInterval | null;
  ed: SkipInterval | null;
}

export interface AnimeInfo {
  title: string;
  awScore: number | null;
  awVotes: number | null;
  anilistScore: number | null;
  genres: string[];
  synopsis: string | null;
  episodes: number;
}

export interface DownloadReq {
  slug: string;
  title: string;
  ep: string;
  token: string;
}

export interface DownloadMsg {
  type: "progress" | "done" | "error" | "cancelled";
  token: string;
  slug?: string;
  ep?: string;
  dest?: string;
  received?: number;
  total?: number;
  pct?: number;
  message?: string;
}

export interface AniAPI {
  search(query: string, mode: Mode | "all"): Promise<SearchItem[]>;
  episodes(slug: string): Promise<AnimeDetail>;
  episodeUrl(token: string): Promise<string | null>;
  info(slug: string): Promise<AnimeInfo>;
  latest(mode: Mode): Promise<LatestItem[]>;
  getBase(): Promise<string>;
  setBase(b: string): Promise<string>;
  recordProgress(entry: ProgressInput): Promise<HistoryEntry>;
  history(): Promise<HistoryEntry[]>;
  getEntry(slug: string): Promise<HistoryEntry | null>;
  removeEntry(slug: string): Promise<void>;
  clearHistory(): Promise<void>;
  settings(): Promise<Record<string, unknown>>;
  setSetting(k: string, v: unknown): Promise<Record<string, unknown>>;
  openExternal(url: string): Promise<void>;

  // anilist (public)
  alByMalId(idMal: string | number): Promise<AniListMedia | null>;
  alTrending(): Promise<AniListMedia[]>;
  alPopular(): Promise<AniListMedia[]>;
  alSeasonal(): Promise<AniListMedia[]>;
  alSearch(q: string): Promise<AniListMedia[]>;

  // anilist (account)
  alLogin(): Promise<AniListViewer | null>;
  alLogout(): Promise<boolean>;
  alViewer(): Promise<AniListViewer | null>;
  alUserList(status: string): Promise<AniListEntry[]>;
  alSetProgress(idMal: string | number, progress: number): Promise<unknown>;

  // aniskip
  skipTimes(malId: string | number, ep: string | number): Promise<SkipTimes | null>;

  // downloads
  downloadEpisode(req: DownloadReq): Promise<{ dest?: string; cancelled?: boolean; already?: boolean }>;
  cancelDownload(token: string): Promise<boolean>;
  downloadedEps(title: string): Promise<string[]>;
  openDownloads(): Promise<string>;
  onDownload(cb: (msg: DownloadMsg) => void): () => void;
}

declare global {
  interface Window {
    ani: AniAPI;
  }
}
