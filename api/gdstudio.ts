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
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

const requestTimestamps: number[] = [];

function registerRequest(): void {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new Error('请求过于频繁，请稍后再试');
  }

  requestTimestamps.push(now);
}

function buildUrl(params: Record<string, string>): string {
  return `${GDSTUDIO_API_BASE}?${new URLSearchParams(params).toString()}`;
}

async function request<T>(params: Record<string, string>): Promise<T> {
  registerRequest();
  const response = await fetch(buildUrl(params), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('音乐服务暂时不可用');
  }
  return (await response.json()) as T;
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

  getUrl: (params: MusicApiUrlParams): Promise<ApiUrlResponse> => request<ApiUrlResponse>({
    types: 'url',
    source: params.source,
    id: params.id,
    br: String(params.bitrate),
  }),

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
