import type { LocalTrack } from "../localTracks";
import type { SavedPlaylist } from "../../components/player/types";
import neteaseHot from "./netease-hot.json";
import custom from "./custom.json";
import bilibiliFavorites from "./bilibili-favorites.json";

// Built-in playlists seeded into local storage on first launch.
// `type` distinguishes how the playlist is loaded:
//  - "netease": fetch tracks from the NetEase playlist API by playlistId
//  - "custom":  use the embedded `tracks` (same shape as data/localTracks.ts)
//  - "bilibili": fetch tracks from Bilibili's official favorites API by playlistId
export const DEFAULT_PLAYLISTS: SavedPlaylist[] = [
  {
    id: `gdstudio-netease-${neteaseHot.id}`,
    apiId: "gdstudio",
    source: "netease",
    playlistId: neteaseHot.id,
    name: neteaseHot.name,
    cover: null,
    addedAt: 0,
  },
  {
    id: "gdstudio-netease-custom",
    apiId: "gdstudio",
    source: "netease",
    playlistId: "",
    name: custom.name,
    cover: null,
    tracks: custom.tracks as LocalTrack[],
    addedAt: 0,
  },
  {
    id: `bilibili_yf-bilibili-${bilibiliFavorites.id}`,
    apiId: "bilibili_yf",
    source: "bilibili",
    playlistId: bilibiliFavorites.id,
    name: bilibiliFavorites.name,
    cover: null,
    addedAt: 0,
  },
];
