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

export interface AniAPI {
  search(query: string, mode: Mode | "all"): Promise<SearchItem[]>;
  episodes(slug: string): Promise<AnimeDetail>;
  episodeUrl(token: string): Promise<string | null>;
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
}

declare global {
  interface Window {
    ani: AniAPI;
  }
}
