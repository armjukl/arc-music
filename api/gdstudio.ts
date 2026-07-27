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

const GDSTUDIO_API_BASE = 'https://music-api.gdstudio.xyz/api.php';
const GDSTUDIO_PROXY_PATH = '/api/gdstudio';
const GDSTUDIO_AUDIO_PROXY_PATH = '/api/gdstudio/audio';

function buildUrl(params: Record<string, string>): string {
  const url = new URL(
    typeof window === 'undefined'
      ? GDSTUDIO_API_BASE
      : `${window.location.origin}${GDSTUDIO_PROXY_PATH}`,
  );
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

async function request<T>(params: Record<string, string>): Promise<T> {
  const response = await fetch(buildUrl(params), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('音乐服务暂时不可用');
  }
  return (await response.json()) as T;
}

function buildPlaybackUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  const proxyUrl = new URL(GDSTUDIO_AUDIO_PROXY_PATH, window.location.origin);
  proxyUrl.searchParams.set('url', url);
  return proxyUrl.toString();
}

export const gdstudioApi: MusicApi = {
  id: 'gdstudio',
  label: 'GDStudio',

  search: (params: MusicApiSearchParams): Promise<ApiSearchItem[]> => request<ApiSearchItem[]>({
    types: 'search',
    source: params.source,
    name: params.keyword,
    count: String(params.count),
    pages: String(params.page),
  }),

  getUrl: async (params: MusicApiUrlParams): Promise<ApiUrlResponse> => {
    const data = await request<ApiUrlResponse>({
      types: 'url',
      source: params.source,
      id: params.id,
      br: String(params.bitrate),
    });
    return data.url ? { ...data, url: buildPlaybackUrl(data.url) } : data;
  },

  getPic: (params: MusicApiResourceParams): Promise<ApiPicResponse> => request<ApiPicResponse>({
    types: 'pic',
    source: params.source,
    id: params.id,
    size: params.size ?? '300',
  }),

  getLyric: (params: MusicApiResourceParams): Promise<ApiLyricResponse> => request<ApiLyricResponse>({
    types: 'lyric',
    source: params.source,
    id: params.id,
  }),

  buildResourceUrl: (type: ApiResourceType, params: MusicApiResourceParams): string => buildUrl({
    types: type,
    source: params.source,
    id: params.id,
    ...(params.size ? { size: params.size } : {}),
  }),
};
