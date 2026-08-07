import { gdstudioApi } from './gdstudio';
import { bilibiliApi } from './bilibili';
import { yuafengBilibiliApi } from './yuafeng';
import { MusicApi, MusicApiId } from './types';

export const DEFAULT_MUSIC_API_ID: MusicApiId = 'gdstudio';

// Register new API adapters here so the UI can discover them automatically.
export const MUSIC_APIS: readonly MusicApi[] = [
  gdstudioApi,
  bilibiliApi,
  yuafengBilibiliApi,
];

export function getMusicApi(apiId: MusicApiId): MusicApi {
  return MUSIC_APIS.find((api) => api.id === apiId) ?? gdstudioApi;
}

export { gdstudioApi } from './gdstudio';
export { bilibiliApi } from './bilibili';
export { yuafengBilibiliApi } from './yuafeng';
export * from './types';
