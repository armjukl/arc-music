export type MusicApiId = 'gdstudio' | 'bilibili';

export type ApiResourceType = 'lyric' | 'pic';

export type ApiSearchItem = {
  id: number | string;
  name?: string;
  artist?: string[] | string;
  album?: string;
  duration?: string;
  pic_id?: string;
  lyric_id?: string;
  cover_url?: string;
  published_at?: string;
  source?: string;
};

export type ApiUrlResponse = {
  url?: string;
  br?: number;
  size?: number;
};

export type ApiPicResponse = {
  url?: string;
};

export type ApiLyricResponse = {
  lyric?: string | null;
  tlyric?: string | null;
};

export type MusicApiSearchParams = {
  source: string;
  keyword: string;
  count: number;
  page: number;
};

export type MusicApiUrlParams = {
  source: string;
  id: string;
  bitrate: number;
};

export type MusicApiResourceParams = {
  source: string;
  id: string;
  size?: string;
};

export interface MusicApi {
  readonly id: MusicApiId;
  readonly label: string;
  search(params: MusicApiSearchParams): Promise<ApiSearchItem[]>;
  getUrl(params: MusicApiUrlParams): Promise<ApiUrlResponse>;
  getPic(params: MusicApiResourceParams): Promise<ApiPicResponse>;
  getLyric(params: MusicApiResourceParams): Promise<ApiLyricResponse>;
  buildResourceUrl(type: ApiResourceType, params: MusicApiResourceParams): string;
}
