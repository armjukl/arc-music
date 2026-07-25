import type { MusicApiId } from "../../api";
import type { LocalTrack } from "../../data/localTracks";

export type BitrateOption = 128 | 192 | 320 | 740 | 999;

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
  lyric?: string | null;
  tLyric?: string | null;
  fileSizeKb?: number | null;
};
