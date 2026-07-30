import { gdstudioApi } from './gdstudio';
import { bilibiliApi } from './bilibili';
import { MusicApi, MusicApiId } from './types';

export const DEFAULT_MUSIC_API_ID: MusicApiId = 'gdstudio';

// Register new API adapters here so the UI can discover them automatically.
export const MUSIC_APIS: readonly MusicApi[] = [gdstudioApi, bilibiliApi];

export function getMusicApi(apiId: MusicApiId): MusicApi {
  return MUSIC_APIS.find((api) => api.id === apiId) ?? gdstudioApi;
}

export { gdstudioApi } from './gdstudio';
export { bilibiliApi } from './bilibili';
export * from './types';
