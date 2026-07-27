import {
  ApiLyricResponse,
  ApiPicResponse,
  ApiResourceType,
  ApiSearchItem,
  ApiUrlResponse,
  MusicApi,
  MusicApiResourceParams,
  MusicApiSearchParams,
  MusicApiUrlParams,
} from './types';

// Change this single constant when the Bilibili API Hub address changes.
const MUSIC_API_HUB_BASE = 'http://154.36.187.103:8787';
const MUSIC_API_HUB_PROXY_BASE = '/api/music-hub';

type HubTrack = {
  source?: string;
  id?: string;
  title?: string;
  artist?: string;
  album?: string;
  duration_ms?: number | null;
  cover_url?: string | null;
  source_url?: string | null;
  stream_url?: string | null;
  download_url?: string | null;
  playable?: boolean;
};

type HubResolvedAudio = HubTrack & {
  audio_url?: string;
};

function buildUrl(path: string, params: Record<string, string>): string {
  const base =
    typeof window === 'undefined'
      ? MUSIC_API_HUB_BASE
      : `${window.location.origin}${MUSIC_API_HUB_PROXY_BASE}`;
  const url = new URL(`${base}${path}`);
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
      typeof window === 'undefined'
        ? `${MUSIC_API_HUB_BASE}/`
        : window.location.origin,
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
      buildUrl('/api/bilibili/resolve', { id: params.id }),
    );
    const url =
      resolveMediaUrl(track.download_url) ??
      buildUrl('/api/bilibili/direct', { id: params.id });
    return {
      url,
      br: params.bitrate,
    };
  },

  // Bilibili search results do not expose music cover or lyric resources.
  getPic: async (): Promise<ApiPicResponse> => ({}),
  getLyric: async (): Promise<ApiLyricResponse> => ({}),

  buildResourceUrl: (_type: ApiResourceType, _params: MusicApiResourceParams): string => '',
};

export { MUSIC_API_HUB_BASE };
