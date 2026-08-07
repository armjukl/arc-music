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

const YUAFENG_SEARCH_API = 'https://api.yuafeng.cn/API/ly/bilibili.php';
const YUAFENG_PARSE_API = 'https://api.yuafeng.cn/API/ly/bilibili_jx.php';

type YuafengSearchItem = {
  num?: number | string;
  author?: string;
  title?: string;
  cover?: string;
  bvid?: string;
  view_count?: string;
  short_link?: string;
  duration?: string;
};

type YuafengSearchResponse = {
  Code?: number;
  data?: YuafengSearchItem[];
};

type YuafengParseResponse = {
  code?: number;
  msg?: string;
  data?: { video?: string; title?: string; cover?: string; publish_time?: string };
};

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Bilibili 解析服务暂时不可用');
  }
  return (await response.json()) as T;
}

function buildSearchUrl(keyword: string): string {
  const url = new URL(YUAFENG_SEARCH_API);
  url.searchParams.set('msg', keyword);
  return url.toString();
}

function buildParseUrl(id: string): string {
  const bvid = String(id).split(':')[0];
  const url = new URL(YUAFENG_PARSE_API);
  url.searchParams.set('url', `https://www.bilibili.com/video/${bvid}`);
  return url.toString();
}

export const yuafengBilibiliApi: MusicApi = {
  id: 'bilibili_yf',
  label: 'Bilibili 视频解析',

  search: async (params: MusicApiSearchParams): Promise<ApiSearchItem[]> => {
    const body = await request<YuafengSearchResponse>(
      buildSearchUrl(params.keyword),
    );
    const list = Array.isArray(body?.data) ? body.data : [];
    return list.slice(0, params.count).map((item) => ({
      id: item.bvid ?? '',
      name: item.title ?? '',
      artist: item.author ?? '',
      album: '',
      duration: item.duration ?? '',
      cover_url: item.cover ?? undefined,
      source: 'bilibili',
    }));
  },

  getUrl: async (params: MusicApiUrlParams): Promise<ApiUrlResponse> => {
    const body = await request<YuafengParseResponse>(buildParseUrl(params.id));
    if (body.code !== 0 || !body.data?.video) {
      throw new Error(body.msg ?? '视频解析失败');
    }
    return {
      url: body.data.video,
      br: params.bitrate,
      publishedAt: body.data.publish_time,
    };
  },

  getVideoUrl: async (params: MusicApiUrlParams): Promise<ApiUrlResponse> => {
    const body = await request<YuafengParseResponse>(buildParseUrl(params.id));
    if (body.code !== 0 || !body.data?.video) {
      throw new Error(body.msg ?? '视频解析失败');
    }
    return {
      url: body.data.video,
      br: params.bitrate,
      publishedAt: body.data.publish_time,
    };
  },

  // Bilibili favorites are listed through the official Bilibili API (the
  // video parse API has no favorites endpoint), while playback uses yuafeng.
  getPlaylist: async (
    params: MusicApiPlaylistParams,
  ): Promise<ApiPlaylistResponse> => {
    const origin =
      typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const url = new URL('/api/bilibili/favorites', origin);
    url.searchParams.set('media_id', params.id);
    if (params.page) {
      url.searchParams.set('page', String(params.page));
    }
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      let detail = `Bilibili 请求失败（HTTP ${response.status}）`;
      try {
        const body = (await response.json()) as { detail?: string };
        if (body?.detail) detail = body.detail;
      } catch {
        // Keep the HTTP status message.
      }
      throw new Error(detail);
    }
    return (await response.json()) as ApiPlaylistResponse;
  },

  getPic: async (): Promise<ApiPicResponse> => ({}),
  getLyric: async (): Promise<ApiLyricResponse> => ({}),

  buildResourceUrl: (
    _type: ApiResourceType,
    _params: MusicApiResourceParams,
  ): string => '',
};
