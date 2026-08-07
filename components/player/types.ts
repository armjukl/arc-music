import type { MusicApiId } from "../../api";
import type { BitrateOption, LocalTrack, MusicSource } from "../../data/localTracks";

export type { BitrateOption };

// A user-added playlist (e.g. a NetEase playlist) saved in local storage.
export type SavedPlaylist = {
  id: string;
  apiId: MusicApiId;
  source: MusicSource;
  playlistId: string;
  name: string;
  cover?: string | null;
  description?: string;
  trackCount?: number;
  playCount?: number;
  creatorName?: string;
  tracks?: LocalTrack[];
  addedAt: number;
};

export type PlaybackMode = "order" | "single" | "shuffle";

export type LyricLine = {
  time: number;
  text: string;
};

export type CombinedLyricLine = {
  time: number;
  original: string;
  translation: string;
};

export type Track = Omit<LocalTrack, "apiId"> & {
  apiId: MusicApiId;
  url?: string;
  cover?: string | null;
  publishedAt?: string;
  lyric?: string | null;
  tLyric?: string | null;
  fileSizeKb?: number | null;
  // When true, resolve playback via getVideoUrl (video sources) instead of getUrl.
  useVideoUrl?: boolean;
};

// Excludes short-lived playback URLs and fetched payloads so history can be replayed safely.
export type PlaybackHistoryTrack = Pick<
  Track,
  | "id"
  | "name"
  | "artist"
  | "album"
  | "duration"
  | "apiId"
  | "source"
  | "keyword"
  | "trackId"
  | "picId"
  | "lyricId"
  | "bitrate"
  | "cover"
  | "publishedAt"
>;

// Favorites use the same durable metadata whitelist as playback history.
export type FavoriteTrack = PlaybackHistoryTrack;
