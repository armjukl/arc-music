import {
  ApiLyricResponse,
  ApiPicResponse,
  ApiPlaylistResponse,
  ApiResourceType,
  ApiSearchItem,
  ApiUrlResponse,
  MusicApi,
  MusicApiPlaylistParams,
  MusicApiResourceParams,
  MusicApiSearchParams,
  MusicApiUrlParams,
} from './types';

const MUSIC_API_HUB_PROXY_BASE = '/api/music-hub';

type HubTrack = {
  source?: string;
  id?: string;
  title?: string;
  artist?: string;
  album?: string;
  duration_ms?: number | null;
  cover_url?: string | null;
  published_at?: string | null;
  source_url?: string | null;
  stream_url?: string | null;
  download_url?: string | null;
  playable?: boolean;
};

type HubResolvedAudio = HubTrack & {
  audio_url?: string;
};

function buildUrl(path: string, params: Record<string, string>): string {
  const origin =
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const url = new URL(`${MUSIC_API_HUB_PROXY_BASE}${path}`, origin);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function resolveMediaUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    if (typeof window !== 'undefined' && value.startsWith('/api/bilibili/')) {
      return new URL(
        `${MUSIC_API_HUB_PROXY_BASE}${value}`,
        window.location.origin,
      ).toString();
    }
    return new URL(
      value,
      typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
    ).toString();
  } catch {
    return undefined;
  }
}

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    let detail = `Bilibili API 请求失败（HTTP ${response.status}）`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // Keep the HTTP status when the gateway did not return JSON.
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

function toSearchItem(track: HubTrack): ApiSearchItem {
  const duration =
    typeof track.duration_ms === 'number' && track.duration_ms > 0
      ? Math.round(track.duration_ms / 1000)
      : undefined;
  return {
    id: track.id ?? '',
    name: track.title ?? '',
    artist: track.artist ?? '',
    album: track.album ?? '',
    duration: duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : '',
    cover_url: track.cover_url ?? undefined,
    published_at: track.published_at ?? undefined,
    source: 'bilibili',
  };
}

export const bilibiliApi: MusicApi = {
  id: 'bilibili',
  label: 'Bilibili（Music API Hub）',

  search: async (params: MusicApiSearchParams): Promise<ApiSearchItem[]> => {
    const tracks = await request<HubTrack[]>(
      buildUrl('/api/bilibili/search', {
        q: params.keyword,
        limit: String(params.count),
        page: String(params.page),
      }),
    );
    return Array.isArray(tracks)
      ? tracks.filter((track) => track.id && track.title).map(toSearchItem)
      : [];
  },

  getUrl: async (params: MusicApiUrlParams): Promise<ApiUrlResponse> => {
    const track = await request<HubResolvedAudio>(
      buildUrl('/api/bilibili/audio/resolve', { id: params.id }),
    );
    const url =
      resolveMediaUrl(track.download_url) ??
      buildUrl('/api/bilibili/audio/direct', { id: params.id });
    return {
      url,
      br: params.bitrate,
    };
  },

  // Bilibili favorites are videos; parse a playable video URL through the
  // separate Bilibili video parse API instead of the audio hub.
  getVideoUrl: async (params: MusicApiUrlParams): Promise<ApiUrlResponse> => {
    const bvid = String(params.id ?? "").split(":")[0];
    if (!bvid) {
      throw new Error("无法解析Bilibili视频ID");
    }
    const origin =
      typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL("/api/bilibili/video", origin);
    url.searchParams.set("url", `https://www.bilibili.com/video/${bvid}`);
    const parsed = await request<{ code?: number; url?: string }>(url.toString());
    if (!parsed.url) {
      throw new Error("视频解析失败");
    }
    return { url: parsed.url, br: params.bitrate };
  },

  // Bilibili search results do not expose music cover or lyric resources.
  getPic: async (): Promise<ApiPicResponse> => ({}),
  getLyric: async (): Promise<ApiLyricResponse> => ({}),

  // Reads a public Bilibili favorite folder (media_id) and expands it into
  // a playlist of playable audio tracks (BV号:cid). The folder info and items
  // are fetched server-side from Bilibili's official API by the Next.js route.
  getPlaylist: async (
    params: MusicApiPlaylistParams,
  ): Promise<ApiPlaylistResponse> => {
    const origin =
      typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL("/api/bilibili/favorites", origin);
    url.searchParams.set("media_id", params.id);
    if (params.page) {
      url.searchParams.set("page", String(params.page));
    }
    return request<ApiPlaylistResponse>(url.toString());
  },

  buildResourceUrl: (_type: ApiResourceType, _params: MusicApiResourceParams): string => '',
};
