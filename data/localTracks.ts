import type { MusicApiId } from '../api/types';

export type MusicSource = 'netease' | 'kuwo' | 'joox';

export type LocalTrack = {
  id: string;
  name: string;
  artist?: string;
  album?: string;
  duration?: string;
  apiId?: MusicApiId;
  source: MusicSource;
  keyword?: string;
  trackId?: string;
  picId?: string;
  lyricId?: string;
  bitrate?: 128 | 192 | 320 | 740 | 999;
};

export const LOCAL_TRACKS: LocalTrack[] = [
    
  {
    "id": "netease-1867150097",
    "name": "夏霞",
    "artist": "あたらよ",
    "album": "夏霞",

    "source": "netease",
    "keyword": "夏霞 あたらよ",
    "trackId": "1867150097",
    "picId": "109951166253940594",
    "lyricId": "1867150097",
    "bitrate": 320
  },
  {
    "id": "netease-1835951859",
    "name": "Avid",
    "artist": "SawanoHiroyuki[nZk], 瑞葵(mizuki)",
    "album": "Avid / Hands Up to the Sky",

    "source": "netease",
    "keyword": "Avid SawanoHiroyuki[nZk], 瑞葵(mizuki)",
    "trackId": "1835951859",
    "picId": "109951166004106688",
    "lyricId": "1835951859",
    "bitrate": 320
  },
  {
    "id": "netease-554245242",
    "name": "Cage",
    "artist": "Tielle, SawanoHiroyuki[nZk]",
    "album": "Binary Star/Cage",

    "source": "netease",
    "keyword": "Cage Tielle, SawanoHiroyuki[nZk]",
    "trackId": "554245242",
    "picId": "109951166200369055",
    "lyricId": "554245242",
    "bitrate": 320
  },
  {
    "id": "netease-2051328176",
    "name": "僕らはそれを愛と呼んだ",
    "artist": "あたらよ",
    "album": "僕らはそれを愛と呼んだ",

    "source": "netease",
    "keyword": "僕らはそれを愛と呼んだ あたらよ",
    "trackId": "2051328176",
    "picId": "109951168645551891",
    "lyricId": "2051328176",
    "bitrate": 320
  }


];



