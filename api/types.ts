export type MusicApiId = 'gdstudio' | 'bilibili' | 'bilibili_yf';

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
  publishedAt?: string;
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

export type ApiPlaylistTrackArtist = {
  id?: number;
  name?: string;
};

export type ApiPlaylistTrackAlbum = {
  id?: number;
  name?: string;
  picUrl?: string;
};

export type ApiPlaylistTrack = {
  id?: number | string;
  name?: string;
  ar?: ApiPlaylistTrackArtist[];
  al?: ApiPlaylistTrackAlbum;
  dt?: number;
};

export type ApiPlaylist = {
  id?: number | string;
  name?: string;
  coverImgUrl?: string;
  description?: string;
  trackCount?: number;
  playCount?: number;
  creator?: { nickname?: string };
  tracks?: ApiPlaylistTrack[];
};

export type ApiPlaylistResponse = {
  code?: number;
  playlist?: ApiPlaylist;
  page?: number;
  hasMore?: boolean;
};

export type MusicApiPlaylistParams = {
  source: string;
  id: string;
  page?: number;
};

export interface MusicApi {
  readonly id: MusicApiId;
  readonly label: string;
  search(params: MusicApiSearchParams): Promise<ApiSearchItem[]>;
  getUrl(params: MusicApiUrlParams): Promise<ApiUrlResponse>;
  getVideoUrl?(params: MusicApiUrlParams): Promise<ApiUrlResponse>;
  getPic(params: MusicApiResourceParams): Promise<ApiPicResponse>;
  getLyric(params: MusicApiResourceParams): Promise<ApiLyricResponse>;
  getPlaylist?(
    params: MusicApiPlaylistParams,
  ): Promise<ApiPlaylistResponse | null>;
  buildResourceUrl(type: ApiResourceType, params: MusicApiResourceParams): string;
}
