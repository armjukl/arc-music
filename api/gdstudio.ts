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

const GDSTUDIO_API_BASE = 'https://music-api.gdstudio.xyz/api.php';

function buildUrl(params: Record<string, string>): string {
  return `${GDSTUDIO_API_BASE}?${new URLSearchParams(params).toString()}`;
}

async function request<T>(params: Record<string, string>): Promise<T> {
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

  getPlaylist: (params: MusicApiPlaylistParams): Promise<ApiPlaylistResponse> =>
    request<ApiPlaylistResponse>({
      types: 'playlist',
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
