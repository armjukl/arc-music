import type { ApiSearchItem } from "../../api";
import type { LocalTrack } from "../../data/localTracks";
import type { LyricLine, Track } from "./types";

export function sanitizeUrl(url: string): string {
  return url.replace(/&amp;/g, "&");
}

export function createTrack(
  track: LocalTrack,
  defaultApiId: Track["apiId"],
): Track {
  return {
    ...track,
    apiId: track.apiId ?? defaultApiId,
    url: undefined,
    cover: track.picId ? undefined : null,
    lyric: null,
    tLyric: null,
    fileSizeKb: null,
  };
}

export function parseLyricLines(lyric: string | null | undefined): LyricLine[] {
  if (!lyric) return [];
  const result: LyricLine[] = [];
  const lines = lyric.split(/\r?\n/);
  const timeTagRegex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?]/g;

  for (const line of lines) {
    const text = line.replace(timeTagRegex, "").trim();
    const matches = [...line.matchAll(timeTagRegex)];
    if (matches.length === 0) {
      if (text.length > 0)
        result.push({ time: Number.POSITIVE_INFINITY, text });
      continue;
    }
    for (const match of matches) {
      const minutes = Number.parseInt(match[1] ?? "0", 10);
      const seconds = Number.parseInt(match[2] ?? "0", 10);
      const millisRaw = match[3] ?? "0";
      const millis = Number.parseInt(millisRaw.padEnd(3, "0").slice(0, 3), 10);
      if (text.length > 0)
        result.push({ time: minutes * 60 + seconds + millis / 1000, text });
    }
  }

  return result
    .sort((a, b) => a.time - b.time)
    .reduce<LyricLine[]>((acc, current) => {
      const previous = acc[acc.length - 1];
      if (
        !previous ||
        previous.time !== current.time ||
        previous.text !== current.text
      )
        acc.push(current);
      return acc;
    }, []);
}

function normalizeText(value: string | undefined | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[\s'"、，。！？!（）()【】\[\]《》“”‘’·._/\-]+/g, "");
}

function collectArtistTokens(artist: string[] | string | undefined): string[] {
  if (!artist) return [];
  return (Array.isArray(artist) ? artist : [artist])
    .flatMap((item) =>
      item.split(/[,，/&、x×+·]|feat\.?|ft\.?|with|合作|合唱/gi),
    )
    .map(normalizeText)
    .filter(Boolean);
}

export function selectBestSearchResult(
  results: ApiSearchItem[],
  target: Track,
): ApiSearchItem | null {
  if (!results || results.length === 0) return null;
  const targetName = normalizeText(target.name);
  const targetArtists = collectArtistTokens(target.artist);
  let best = results[0];
  let bestScore = -Infinity;
  let bestIndex = 0;

  results.forEach((item, index) => {
    let score = 0;
    const itemName = normalizeText(item.name);
    const itemArtists = collectArtistTokens(item.artist);
    if (targetName && itemName === targetName) score += 4;
    else if (targetName && itemName.includes(targetName)) score += 2;
    if (
      targetArtists.length > 0 &&
      itemArtists.length > 0 &&
      itemArtists.some((token) => targetArtists.includes(token))
    )
      score += 4;
    if (item.source && item.source === target.source) score += 1;
    if (score > bestScore || (score === bestScore && index < bestIndex)) {
      best = item;
      bestScore = score;
      bestIndex = index;
    }
  });
  return best ?? null;
}

export function formatTime(seconds: number): string {
  if (Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function formatFileSizeLabel(sizeKb?: number | null): string {
  if (!sizeKb || sizeKb <= 0) return "未知";
  if (sizeKb >= 1024) {
    const mb = sizeKb / 1024;
    return `${mb >= 10 ? mb.toFixed(1) : mb.toFixed(2)} MB`;
  }
  return `${Math.max(Math.round(sizeKb), 1)} KB`;
}

export function formatBitrateLabel(value?: number | null): string {
  if (!value) return "未知";
  const labels: Record<number, string> = {
    128: "128K 标准音质",
    192: "192K 中高音质",
    320: "320K 高品音质",
    740: "740K 无损音质",
    999: "999K 无损音质",
  };
  return labels[value] ?? `${value}K`;
}
