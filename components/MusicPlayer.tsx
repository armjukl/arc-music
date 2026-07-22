// components/MusicPlayer.tsx
'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Howl } from 'howler';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share, Repeat, Shuffle, Repeat1, ChevronUp, ChevronDown, Search, MoreVertical } from 'lucide-react';
import { LOCAL_TRACKS, LocalTrack, MusicSource } from '../data/localTracks';
import { DEFAULT_MUSIC_API_ID, getMusicApi, MUSIC_APIS } from '../api';
import type { ApiSearchItem, MusicApiId } from '../api';

const DEFAULT_SEARCH_COUNT = 8;
const DEFAULT_COVER_SIZE = '300';
const BITRATE_OPTIONS = [128, 192, 320, 740, 999] as const;
type BitrateOption = typeof BITRATE_OPTIONS[number];

const AVAILABLE_SOURCES: { value: MusicSource; label: string }[] = [
  { value: 'netease', label: '网易云' },
  { value: 'kuwo', label: '酷我' },
  { value: 'joox', label: 'JOOX' },
];

type LyricLine = {
  time: number;
  text: string;
};

export type Track = Omit<LocalTrack, 'apiId'> & {
  apiId: MusicApiId;
  url?: string;
  cover?: string | null;
  lyric?: string | null;
  tLyric?: string | null;
  fileSizeKb?: number | null;
};

function sanitizeUrl(url: string): string {
  return url.replace(/&amp;/g, '&');
}

function createTrack(track: LocalTrack): Track {
  return {
    ...track,
    apiId: track.apiId ?? DEFAULT_MUSIC_API_ID,
    url: undefined,
    cover: track.picId ? undefined : null,
    lyric: null,
    tLyric: null,
    fileSizeKb: null,
  };
}

function parseLyricLines(lyric: string | null | undefined): LyricLine[] {
  if (!lyric) return [];
  const result: LyricLine[] = [];
  const lines = lyric.split(/\r?\n/);
  const timeTagRegex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?]/g;

  for (const line of lines) {
    const text = line.replace(timeTagRegex, '').trim();
    const matches = [...line.matchAll(timeTagRegex)];

    if (matches.length === 0) {
      if (text.length > 0) {
        result.push({ time: Number.POSITIVE_INFINITY, text });
      }
      continue;
    }

    for (const match of matches) {
      const minutes = Number.parseInt(match[1] ?? '0', 10);
      const seconds = Number.parseInt(match[2] ?? '0', 10);
      const millisRaw = match[3] ?? '0';
      const millis = Number.parseInt(millisRaw.padEnd(3, '0').slice(0, 3), 10);
      const totalSeconds = minutes * 60 + seconds + millis / 1000;
      if (text.length > 0) {
        result.push({ time: totalSeconds, text });
      }
    }
  }

  return result
    .sort((a, b) => a.time - b.time)
    .reduce<LyricLine[]>((acc, current) => {
      if (acc.length === 0) {
        acc.push(current);
        return acc;
      }
      const prev = acc[acc.length - 1];
      if (prev.time === current.time && prev.text === current.text) {
        return acc;
      }
      acc.push(current);
      return acc;
    }, []);
}

const DEFAULT_SOURCE: MusicSource = 'netease';
const INITIAL_TRACKS: Track[] = LOCAL_TRACKS.map(createTrack);
const INITIAL_SOURCE_TRACKS: Track[] = INITIAL_TRACKS.filter(
  (track) => track.apiId === DEFAULT_MUSIC_API_ID && track.source === DEFAULT_SOURCE,
);

function normalizeText(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[\s'"、，。！？!（）()【】\[\]《》“”‘’·._/\-]+/g, '');
}

function collectArtistTokens(artist: string[] | string | undefined): string[] {
  if (!artist) return [];
  const raw = Array.isArray(artist) ? artist : [artist];
  return raw
    .flatMap((item) => item.split(/[,，/&、x×+·]|feat\.?|ft\.?|with|合作|合唱/gi))
    .map((token) => normalizeText(token))
    .filter(Boolean);
}

function selectBestSearchResult(results: ApiSearchItem[], target: Track): ApiSearchItem | null {
  if (!results || results.length === 0) return null;

  const targetName = normalizeText(target.name);
  const targetArtists = collectArtistTokens(target.artist);

  let best = results[0];
  let bestScore = -Infinity;
  let bestIndex = 0;

  results.forEach((item, index) => {
    let score = 0;
    const itemName = normalizeText(item.name);
    const itemArtists = collectArtistTokens(item.artist);

    if (targetName && itemName === targetName) {
      score += 4;
    } else if (targetName && itemName.includes(targetName)) {
      score += 2;
    }

    if (targetArtists.length > 0 && itemArtists.length > 0) {
      const hit = itemArtists.some((token) => targetArtists.includes(token));
      if (hit) {
        score += 4;
      }
    }

    if (item.source && item.source === target.source) {
      score += 1;
    }

    if (score > bestScore || (score === bestScore && index < bestIndex)) {
      bestScore = score;
      best = item;
      bestIndex = index;
    }
  });

  return best ?? null;
}

const MusicPlayer = () => {
  // 播放器状态
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [localTracks, setLocalTracks] = useState<Track[]>(() => INITIAL_TRACKS);
  const [selectedApiId, setSelectedApiId] = useState<MusicApiId>(DEFAULT_MUSIC_API_ID);
  const [selectedSource, setSelectedSource] = useState<MusicSource>(DEFAULT_SOURCE);
  const [selectedBitrate, setSelectedBitrate] = useState<BitrateOption>(320);
  const [allTracks, setAllTracks] = useState<Track[]>(() => INITIAL_SOURCE_TRACKS);
  const [musicList, setMusicList] = useState<Track[]>(() => INITIAL_SOURCE_TRACKS);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  type PlaybackMode = 'order' | 'single' | 'shuffle';
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('order');
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [loadingTrackIndex, setLoadingTrackIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
const [searchPage, setSearchPage] = useState(1);
const [searchHasMore, setSearchHasMore] = useState(false);
const [searchPageInput, setSearchPageInput] = useState('1');
const [lastSearchKeyword, setLastSearchKeyword] = useState<string | null>(null);
const [infoModalVisible, setInfoModalVisible] = useState(false);
const [infoModalTrack, setInfoModalTrack] = useState<Track | null>(null);
const [infoModalLoading, setInfoModalLoading] = useState(false);
const [infoModalError, setInfoModalError] = useState<string | null>(null);

  const soundRef = useRef<Howl | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef(false);
  const playbackModeRef = useRef<PlaybackMode>('order');
  const playRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const lyricDesktopRef = useRef<HTMLDivElement | null>(null);
  const lyricMobileRef = useRef<HTMLDivElement | null>(null);
  const infoRequestIdRef = useRef(0);

  const currentSong = currentSongIndex >= 0 ? musicList[currentSongIndex] : undefined;

  useEffect(() => {
    setCoverUrl(currentSong?.cover ?? null);
  }, [currentSong?.cover]);

  useEffect(() => {
    setShowTranslation(false);
    setLyricsExpanded(false);
  }, [currentSong?.id]);

  useEffect(() => {
    if (!mobileExpanded) {
      setLyricsExpanded(false);
    }
  }, [mobileExpanded]);

  const originalLyricLines = useMemo(() => parseLyricLines(currentSong?.lyric), [currentSong?.lyric]);
  const translationLyricLines = useMemo(() => parseLyricLines(currentSong?.tLyric), [currentSong?.tLyric]);
  const displayLyricLines = useMemo<LyricLine[]>(() => {
    const hasTranslation = translationLyricLines.length > 0;
    const hasOriginal = originalLyricLines.length > 0;
    if (showTranslation && hasTranslation) {
      return translationLyricLines;
    }
    if (hasOriginal) {
      return originalLyricLines;
    }
    if (hasTranslation) {
      return translationLyricLines;
    }
    return [] as LyricLine[];
  }, [originalLyricLines, showTranslation, translationLyricLines]);
  const hasTranslationLyric = translationLyricLines.length > 0;
  const hasOriginalLyric = originalLyricLines.length > 0;
  const hasAnyLyric = displayLyricLines.length > 0 || hasTranslationLyric || hasOriginalLyric;
  const activeLyricIndex = useMemo(() => {
    if (displayLyricLines.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < displayLyricLines.length; i += 1) {
      const entry = displayLyricLines[i];
      if (!Number.isFinite(entry.time)) continue;
      if (entry.time <= currentTime + 0.25) {
        index = i;
      } else if (entry.time > currentTime + 0.25) {
        break;
      }
    }
    if (index === -1 && displayLyricLines.length > 0) {
      const firstFinite = displayLyricLines.findIndex((entry) => Number.isFinite(entry.time));
      if (firstFinite === -1) {
        return 0;
      }
      return firstFinite;
    }
    return index;
  }, [currentTime, displayLyricLines]);

  const activeLyricKey = useMemo(() => {
    if (activeLyricIndex < 0 || activeLyricIndex >= displayLyricLines.length) return null;
    const entry = displayLyricLines[activeLyricIndex];
    const timeKey = Number.isFinite(entry.time) ? entry.time.toFixed(3) : `idx-${activeLyricIndex}`;
    return `${currentSong?.id ?? 'unknown'}-${showTranslation ? 'trans' : 'orig'}-${timeKey}`;
  }, [activeLyricIndex, currentSong?.id, displayLyricLines, showTranslation]);

  const previewLyricLines = useMemo(() => {
    if (displayLyricLines.length === 0) return [] as { index: number; line: LyricLine }[];
    const baseIndex = activeLyricIndex >= 0 && activeLyricIndex < displayLyricLines.length ? activeLyricIndex : 0;
    const indices = new Set<number>();
    if (displayLyricLines[baseIndex]) indices.add(baseIndex);
    if (baseIndex > 0) indices.add(baseIndex - 1);
    if (baseIndex + 1 < displayLyricLines.length) indices.add(baseIndex + 1);
    if (indices.size === 0) {
      indices.add(0);
    }
    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((index) => ({ index, line: displayLyricLines[index] }));
  }, [activeLyricIndex, displayLyricLines]);

  useEffect(() => {
    if (!activeLyricKey) return;
    if (!lyricsExpanded) return;
    const containers: (HTMLDivElement | null)[] = [];
    containers.push(lyricDesktopRef.current);
    if (mobileExpanded) {
      containers.push(lyricMobileRef.current);
    }
    containers.forEach((container) => {
      if (!container) return;
      const target = container.querySelector<HTMLElement>(`[data-lyric-key="${activeLyricKey}"]`);
      if (!target) return;
      const offset = target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top: Math.max(offset, 0), behavior: 'smooth' });
      } else {
        container.scrollTop = Math.max(offset, 0);
      }
    });
  }, [activeLyricKey, lyricDesktopRef, lyricMobileRef, lyricsExpanded, mobileExpanded]);

  const updateTrackInStates = useCallback((updated: Track) => {
    setLocalTracks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setAllTracks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setMusicList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  const ensureTrackResolved = useCallback(async (track: Track, desiredBitrate: BitrateOption): Promise<Track> => {
    if (track.url && track.bitrate === desiredBitrate) {
      return track;
    }

    const keyword = (track.keyword ?? `${track.name} ${track.artist ?? ''}`).trim();
    let trackId = track.trackId;
    let picId = track.picId;
    let lyricId = track.lyricId;
    let resolvedName = track.name;
    let resolvedAlbum = track.album;
    let resolvedArtist = track.artist;
    let lyricText = track.lyric ?? null;
    let translationText = track.tLyric ?? null;
    const api = getMusicApi(track.apiId);

    if (!trackId) {
      if (!keyword) {
        throw new Error('未配置歌曲关键词');
      }
      const searchResults = await api.search({
        source: track.source,
        keyword,
        count: DEFAULT_SEARCH_COUNT,
        page: 1,
      });
      const list = Array.isArray(searchResults) ? searchResults : [];
      const best = selectBestSearchResult(list, track);
      if (!best) {
        throw new Error('未找到对应歌曲');
      }
      trackId = String(best.id);
      if (best.pic_id) {
        picId = String(best.pic_id);
      }
      if (best.lyric_id) {
        lyricId = String(best.lyric_id);
      }
      if (best.name) {
        resolvedName = best.name;
      }
      if (best.album) {
        resolvedAlbum = best.album;
      }
      const artistValue = best.artist;
      const artistText = Array.isArray(artistValue) ? artistValue.join(', ') : artistValue;
      if (artistText) {
        resolvedArtist = artistText;
      }
    }

    const urlData = await api.getUrl({
      source: track.source,
      id: trackId,
      bitrate: desiredBitrate,
    });

    if (!urlData || !urlData.url) {
      throw new Error('未获取到播放链接');
    }

    const resolvedUrl = sanitizeUrl(urlData.url);
    let cover = track.cover ?? null;

    if (picId) {
      try {
        const picData = await api.getPic({
          source: track.source,
          id: picId,
          size: DEFAULT_COVER_SIZE,
        });
        if (picData && typeof picData.url === 'string' && picData.url.trim()) {
          cover = picData.url;
        }
      } catch {
        // ignore cover fetch failure
      }
    }

    if (!lyricText && lyricId) {
      try {
        const lyricData = await api.getLyric({
          source: track.source,
          id: lyricId,
        });
        if (lyricData) {
          if (typeof lyricData.lyric === 'string' && lyricData.lyric.trim()) {
            lyricText = lyricData.lyric;
          }
          if (typeof lyricData.tlyric === 'string' && lyricData.tlyric.trim()) {
            translationText = lyricData.tlyric;
          }
        }
      } catch {
        // ignore lyric fetch failure
      }
    }

    const fileSizeKb = typeof urlData.size === 'number' ? urlData.size : track.fileSizeKb ?? null;

    const resolvedTrack: Track = {
      ...track,
      url: resolvedUrl,
      trackId,
      picId,
      lyricId,
      cover,
      name: resolvedName,
      album: resolvedAlbum,
      artist: resolvedArtist,
      bitrate: desiredBitrate,
      lyric: lyricText,
      tLyric: translationText,
      fileSizeKb,
    };

    updateTrackInStates(resolvedTrack);
    return resolvedTrack;
  }, [updateTrackInStates]);

  const playSong = useCallback(async (index: number, autoplay = true) => {
    if (index < 0 || index >= musicList.length) return;
    if (loadingTrackIndex !== null && loadingTrackIndex === index) return;

    const requestId = ++playRequestIdRef.current;
    setLoadingTrackIndex(index);
    setErrorMessage(null);
    setIsPlaying(false);

    try {
      const originalTrack = musicList[index];
      if (!originalTrack) {
        throw new Error('未找到歌曲');
      }

      const needsNewBitrate = originalTrack.bitrate !== selectedBitrate;
      const baseTrack: Track = {
        ...originalTrack,
        bitrate: selectedBitrate,
        url: needsNewBitrate ? undefined : originalTrack.url,
        fileSizeKb: needsNewBitrate ? null : originalTrack.fileSizeKb ?? null,
      };

      updateTrackInStates(baseTrack);

      let resolvedTrack = baseTrack;
      if (!resolvedTrack.url) {
        resolvedTrack = await ensureTrackResolved(baseTrack, selectedBitrate);
      }

      if (playRequestIdRef.current !== requestId) {
        return;
      }

      if (soundRef.current) {
        soundRef.current.unload();
        soundRef.current = null;
      }

      autoPlayRef.current = autoplay;
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      setCurrentSongIndex(index);
      setCoverUrl(resolvedTrack.cover ?? null);
    } catch (err: unknown) {
      if (playRequestIdRef.current === requestId) {
        const message = err instanceof Error ? err.message : '播放失败，请稍后重试';
        setErrorMessage(message);
      }
    } finally {
      if (playRequestIdRef.current === requestId) {
        setLoadingTrackIndex(null);
      }
    }
  }, [ensureTrackResolved, musicList, loadingTrackIndex, selectedBitrate, updateTrackInStates]);

  const playNext = useCallback(() => {
    if (musicList.length === 0) return;

    const mode = playbackModeRef.current;
    if (currentSongIndex < 0) {
      void playSong(0);
      return;
    }

    if (mode === 'shuffle') {
      if (musicList.length === 1) {
        void playSong(currentSongIndex);
        return;
      }
      let candidate = currentSongIndex;
      while (candidate === currentSongIndex) {
        candidate = Math.floor(Math.random() * musicList.length);
      }
      void playSong(candidate);
      return;
    }

    const nextIndex = currentSongIndex >= musicList.length - 1 ? 0 : currentSongIndex + 1;
    void playSong(nextIndex);
  }, [currentSongIndex, musicList, playSong]);

  const playPrevious = useCallback(() => {
    if (musicList.length === 0) return;

    const mode = playbackModeRef.current;
    if (currentSongIndex < 0) {
      void playSong(0);
      return;
    }

    if (mode === 'shuffle') {
      if (musicList.length === 1) {
        void playSong(currentSongIndex);
        return;
      }
      let candidate = currentSongIndex;
      while (candidate === currentSongIndex) {
        candidate = Math.floor(Math.random() * musicList.length);
      }
      void playSong(candidate);
      return;
    }

    const previousIndex = currentSongIndex <= 0 ? musicList.length - 1 : currentSongIndex - 1;
    void playSong(previousIndex);
  }, [currentSongIndex, musicList, playSong]);

  const resetPlayer = useCallback(() => {
    playRequestIdRef.current += 1;
    setLoadingTrackIndex(null);
    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setCurrentSongIndex(-1);
    setCoverUrl(null);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // 初始化音频
  useEffect(() => {
    if (!currentSong || !currentSong.url) return;

    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }

    const howl = new Howl({
      src: [currentSong.url],
      html5: true,
      volume: volume,
      onplay: () => {
        setIsPlaying(true);
        startProgressTimer();
      },
      onpause: () => {
        setIsPlaying(false);
        stopProgressTimer();
      },
      onend: () => {
        if (playbackModeRef.current === 'single') {
          try {
            howl.seek(0);
            howl.play();
          } catch {}
          return;
        }
        playNext();
      },
      onload: () => {
        setDuration(howl.duration());
      },
    });

    soundRef.current = howl;

    if (autoPlayRef.current) {
      try {
        howl.play();
      } catch {
        // ignore
      } finally {
        autoPlayRef.current = false;
      }
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
        soundRef.current = null;
      }
      stopProgressTimer();
    };
  }, [currentSong?.url]);

  // 更新音量
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume);
    }
  }, [volume]);

  // 同步播放模式到 ref
  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  // 进度计时器
  const startProgressTimer = () => {
    stopProgressTimer();
    progressIntervalRef.current = setInterval(() => {
      const s = soundRef.current;
      if (s && s.playing()) {
        const seek = (s.seek() as number) || 0;
        const dur = s.duration();
        setCurrentTime(seek);
        if (dur && isFinite(dur) && dur > 0) {
          const pct = Math.max(0, Math.min(100, (seek / dur) * 100));
          setProgress(pct);
        } else {
          setProgress(0);
        }
      }
    }, 500);
  };

  const stopProgressTimer = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // 播放控制
  const togglePlayPause = () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  };

  const performSearch = useCallback(async (apiId: MusicApiId, source: MusicSource, keyword: string, page = 1) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    const activeTrack = currentSongIndex >= 0 ? musicList[currentSongIndex] : null;
    const hasActiveSound = !!soundRef.current;
    const requestId = ++searchRequestIdRef.current;

    if (!hasActiveSound) {
      resetPlayer();
    } else {
      autoPlayRef.current = false;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const searchResults = await getMusicApi(apiId).search({
        source,
        keyword: trimmedKeyword,
        count: DEFAULT_SEARCH_COUNT,
        page,
      });
      const list = Array.isArray(searchResults) ? searchResults : [];
      const mapped: Track[] = list.map((item, index) => {
        const rawId = item.id ?? `${trimmedKeyword}-${index}`;
        const trackId = item.id !== undefined ? String(item.id) : undefined;
        const picId = item.pic_id ? String(item.pic_id) : undefined;
        const lyricId = item.lyric_id ? String(item.lyric_id) : trackId;
        const artistText = Array.isArray(item.artist) ? item.artist.join(', ') : item.artist ?? '';
        const mappedTrack: Track = {
          id: `${apiId}-${source}-${rawId}`,
          name: item.name ?? trimmedKeyword,
          artist: artistText,
          album: item.album ?? '',
          duration: '',
          apiId,
          source,
          keyword: trimmedKeyword,
          trackId,
          picId,
          lyricId,
          bitrate: selectedBitrate,
          url: undefined,
          cover: picId ? undefined : null,
          lyric: null,
          tLyric: null,
          fileSizeKb: null,
        };
        return mappedTrack;
      });
      if (searchRequestIdRef.current !== requestId) {
        return;
      }

      setAllTracks(mapped);

      let nextList: Track[] = mapped;
      let nextIndex: number | null = null;

      if (hasActiveSound && activeTrack) {
        const existingIndex = mapped.findIndex((item) => item.id === activeTrack.id);
        if (existingIndex >= 0) {
          const mergedTrack: Track = { ...mapped[existingIndex], ...activeTrack };
          nextList = [...mapped];
          nextList[existingIndex] = mergedTrack;
          nextIndex = existingIndex;
        } else {
          nextList = [activeTrack, ...mapped];
          nextIndex = 0;
        }
      }

      setMusicList(nextList);
      if (nextIndex !== null) {
        setCurrentSongIndex(nextIndex);
      }

      setShowingSearchResults(true);
      setShowTranslation(false);
      setLastSearchKeyword(trimmedKeyword);
      setSearchPage(page);
      setSearchPageInput(String(page));
      setSearchHasMore(mapped.length === DEFAULT_SEARCH_COUNT);
      setErrorMessage(mapped.length === 0 ? '未找到匹配的歌曲' : null);
    } catch (err) {
      if (searchRequestIdRef.current !== requestId) {
        return;
      }
      const message = err instanceof Error ? err.message : '搜索失败，请稍后再试';
      setErrorMessage(message);
      setShowingSearchResults(true);
      setShowTranslation(false);
      setLastSearchKeyword(trimmedKeyword);
      setSearchPage(page);
      setSearchPageInput(String(page));
      setSearchHasMore(false);
      setAllTracks([]);
      if (!hasActiveSound) {
        setMusicList([]);
      }
    } finally {
      if (searchRequestIdRef.current === requestId) {
        setIsSearching(false);
      }
    }
  }, [currentSongIndex, musicList, resetPlayer, selectedBitrate]);

  const handleSearch = useCallback(async () => {
    const keyword = searchTerm.trim();
    if (!keyword) {
      searchRequestIdRef.current += 1;
      setIsSearching(false);
      const filtered = localTracks.filter((track) => track.apiId === selectedApiId && track.source === selectedSource);
      setAllTracks(filtered);
      setMusicList(filtered);
      setShowingSearchResults(false);
      setShowTranslation(false);
      setErrorMessage(null);
      setSearchPage(1);
      setSearchPageInput('1');
      setSearchHasMore(false);
      setLastSearchKeyword(null);
      resetPlayer();
      return;
    }

    setSearchPageInput('1');
    await performSearch(selectedApiId, selectedSource, keyword, 1);
  }, [localTracks, performSearch, resetPlayer, searchTerm, selectedApiId, selectedSource]);

  const handleSearchPagePrev = useCallback(() => {
    if (!lastSearchKeyword) return;
    if (searchPage <= 1) return;
    void performSearch(selectedApiId, selectedSource, lastSearchKeyword, Math.max(1, searchPage - 1));
  }, [lastSearchKeyword, performSearch, searchPage, selectedApiId, selectedSource]);

  const handleSearchPageNext = useCallback(() => {
    if (!lastSearchKeyword) return;
    if (!searchHasMore) return;
    void performSearch(selectedApiId, selectedSource, lastSearchKeyword, searchPage + 1);
  }, [lastSearchKeyword, performSearch, searchHasMore, searchPage, selectedApiId, selectedSource]);

  const handleSearchPageSubmit = useCallback(() => {
    if (!lastSearchKeyword) return;
    const pageValue = Number.parseInt(searchPageInput, 10);
    if (!Number.isFinite(pageValue) || pageValue <= 0) return;
    void performSearch(selectedApiId, selectedSource, lastSearchKeyword, pageValue);
  }, [lastSearchKeyword, performSearch, searchPageInput, selectedApiId, selectedSource]);

  const handleCloseInfoModal = useCallback(() => {
    setInfoModalVisible(false);
    setInfoModalTrack(null);
    setInfoModalLoading(false);
    setInfoModalError(null);
  }, []);

  const handleShowTrackInfo = useCallback(async (track: Track) => {
    if (!track) return;
    const requestId = ++infoRequestIdRef.current;
    setInfoModalVisible(true);
    setInfoModalLoading(true);
    setInfoModalError(null);
    setInfoModalTrack({ ...track });

    try {
      const desiredBitrate = (track.bitrate ?? selectedBitrate) as BitrateOption;
      const resolved = await ensureTrackResolved({ ...track, bitrate: desiredBitrate }, desiredBitrate);
      if (infoRequestIdRef.current !== requestId) {
        return;
      }
      setInfoModalTrack({ ...resolved });
    } catch (err) {
      if (infoRequestIdRef.current !== requestId) {
        return;
      }
      setInfoModalError(err instanceof Error ? err.message : '获取歌曲信息失败');
    } finally {
      if (infoRequestIdRef.current === requestId) {
        setInfoModalLoading(false);
      }
    }
  }, [ensureTrackResolved, selectedBitrate]);

  const handleRetryInfo = useCallback(() => {
    if (infoModalTrack) {
      void handleShowTrackInfo(infoModalTrack);
    }
  }, [handleShowTrackInfo, infoModalTrack]);

  const handleApiChange = useCallback((apiId: MusicApiId) => {
    if (apiId === selectedApiId) return;

    setSelectedApiId(apiId);
    if (searchTerm.trim()) {
      setSearchPageInput('1');
      void performSearch(apiId, selectedSource, searchTerm.trim(), 1);
    } else {
      searchRequestIdRef.current += 1;
      setIsSearching(false);
      const filtered = localTracks.filter((track) => track.apiId === apiId && track.source === selectedSource);
      setAllTracks(filtered);
      setMusicList(filtered);
      setShowingSearchResults(false);
      setShowTranslation(false);
      setErrorMessage(null);
      setSearchPage(1);
      setSearchPageInput('1');
      setSearchHasMore(false);
      setLastSearchKeyword(null);
      resetPlayer();
    }
  }, [localTracks, performSearch, resetPlayer, searchTerm, selectedApiId, selectedSource]);

  const handleSourceChange = useCallback((source: MusicSource) => {
    if (source === selectedSource) return;

    setSelectedSource(source);
    if (searchTerm.trim()) {
      setSearchPageInput('1');
      void performSearch(selectedApiId, source, searchTerm.trim(), 1);
    } else {
      searchRequestIdRef.current += 1;
      setIsSearching(false);
      const filtered = localTracks.filter((track) => track.apiId === selectedApiId && track.source === source);
      setAllTracks(filtered);
      setMusicList(filtered);
      setShowingSearchResults(false);
      setShowTranslation(false);
      setErrorMessage(null);
      setSearchPage(1);
      setSearchPageInput('1');
      setSearchHasMore(false);
      setLastSearchKeyword(null);
      resetPlayer();
    }
  }, [localTracks, performSearch, resetPlayer, searchTerm, selectedApiId, selectedSource]);

 /* useEffect(() => {
    if (searchTerm.trim() === '' && showingSearchResults) {
      searchRequestIdRef.current += 1;
      setIsSearching(false);
      const filtered = localTracks.filter((track) => track.apiId === selectedApiId && track.source === selectedSource);
      setAllTracks(filtered);
      setMusicList(filtered);
      setShowingSearchResults(false);
      setShowTranslation(false);
      setErrorMessage(null);
      resetPlayer();
    }
  }, [localTracks, resetPlayer, searchTerm, selectedApiId, selectedSource, showingSearchResults]);*/

  useEffect(() => {
    if (selectedBitrate <= 0) return;
    if (currentSongIndex < 0) return;
    if (loadingTrackIndex !== null) return;
    const track = musicList[currentSongIndex];
    if (!track) return;
    if (track.bitrate === selectedBitrate && track.url) return;
    void playSong(currentSongIndex, isPlaying);
  }, [currentSongIndex, isPlaying, loadingTrackIndex, musicList, playSong, selectedBitrate]);

  // 进度条点击跳转
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const s = soundRef.current;
    if (!s) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    let clickPosition = (e.clientX - rect.left) / rect.width;
    if (isNaN(clickPosition)) clickPosition = 0;
    clickPosition = Math.max(0, Math.min(1, clickPosition));

    const dur = s.duration();
    const baseDur = dur && isFinite(dur) && dur > 0 ? dur : duration || 0;
    const newTime = clickPosition * baseDur;

    s.seek(newTime);
    setCurrentTime(newTime);
    setProgress(clickPosition * 100);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatFileSizeLabel = (sizeKb?: number | null): string => {
    if (!sizeKb || sizeKb <= 0) return '未知';
    if (sizeKb >= 1024) {
      const mb = sizeKb / 1024;
      return `${mb >= 10 ? mb.toFixed(1) : mb.toFixed(2)} MB`;
    }
    return `${Math.max(Math.round(sizeKb), 1)} KB`;
  };

  const formatBitrateLabel = (value?: number | null): string => {
    if (!value) return '未知';
    const map: Record<number, string> = {
      128: '128K 标准音质',
      192: '192K 中高音质',
      320: '320K 高品音质',
      740: '740K 无损音质',
      999: '999K 无损音质',
    };
    return map[value] ?? `${value}K`;
  };

  const coverNodeSmall = (
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center mr-4">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
      ) : isPlaying ? (
        <div className="flex space-x-1">
          <div className="w-1 h-4 bg-white animate-pulse"></div>
          <div className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      ) : (
        <span className="text-sm font-bold text-white">▶</span>
      )}
    </div>
  );

  const coverNodeLarge = (
    <div className="w-56 h-56 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-xl transition-transform duration-1000">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="cover" className="w-full h-full object-contain bg-slate-900/10" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-400 flex items-center justify-center">
          <div className="text-white text-center">
            <span className="text-lg font-semibold">专辑封面</span>
          </div>
        </div>
      )}
    </div>
  );

  const infoTrack = infoModalTrack;
  const infoApi = infoTrack ? getMusicApi(infoTrack.apiId) : null;
  const infoSourceLabel = infoTrack
    ? AVAILABLE_SOURCES.find((item) => item.value === infoTrack.source)?.label ?? infoTrack.source
    : '';
  const infoLyricId = infoTrack?.lyricId ?? infoTrack?.trackId;
  const lyricLink = infoTrack && infoApi && infoLyricId
    ? infoApi.buildResourceUrl('lyric', { source: infoTrack.source, id: infoLyricId })
    : null;
  const coverLink = infoTrack?.cover
    ? infoTrack.cover
    : infoTrack?.picId
    ? infoApi?.buildResourceUrl('pic', { source: infoTrack.source, id: infoTrack.picId, size: DEFAULT_COVER_SIZE }) ?? null
    : null;
  const audioLink = infoTrack?.url ?? null;
  const fileSizeLabel = formatFileSizeLabel(infoTrack?.fileSizeKb);
  const bitrateLabel = formatBitrateLabel(infoTrack?.bitrate);
  const durationLabel = infoTrack?.duration && infoTrack.duration.trim() ? infoTrack.duration : '未知';

  return (
    <div className="relative min-h-screen text-slate-800">
      <div className="absolute inset-0 -z-10">
        <div
          className="h-full w-full bg-center bg-cover scale-105 transform"
          style={{ backgroundImage: "url('bg/5.jpg')" }}
        />
        <div className="absolute inset-0 bg-white/50" />
      </div>

      <div className="h-screen flex flex-col md:flex-row">
        {/* 移动端：底部小播放器，可展开半屏；桌面端：右侧 1/3 宽 */}
        {/* 左侧/下方：歌曲列表 */}
        <div
          className={`
            flex-1 flex flex-col overflow-hidden p-4
            md:w-2/3 md:border-r md:border-slate-200/70 md:bg-white/40
          `}
        >
          <div className="px-4 py-2 md:px-6 md:py-3 border-b border-slate-200/70 shrink-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
              Arc-music
            </h1>
          </div>

          <div className="p-3 md:p-6 border-b border-slate-200/60 shrink-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-600">API</span>
                <select
                  value={selectedApiId}
                  onChange={(e) => handleApiChange(e.target.value as MusicApiId)}
                  className="px-3 py-1 rounded-lg border border-slate-300 bg-white/70 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {MUSIC_APIS.map((api) => (
                    <option key={api.id} value={api.id}>{api.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-600">音源</span>
                <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white/70">
                  {AVAILABLE_SOURCES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSourceChange(value)}
                      className={`px-3 py-1 text-sm transition-colors ${selectedSource === value ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-white/60'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-600">音质</span>
                <select
                  value={selectedBitrate}
                  onChange={(e) => setSelectedBitrate(Number(e.target.value) as BitrateOption)}
                  className="px-3 py-1 rounded-lg border border-slate-300 bg-white/70 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {BITRATE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{`${option} kbps${option >= 740 ? ' (无损)' : ''}`}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSearch();
                  }
                }}
                placeholder="搜索歌曲/歌手/专辑"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/70 text-slate-800 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => { void handleSearch(); }}
                disabled={isSearching}
                className={`px-4 py-2 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:shadow-md inline-flex items-center justify-center ${isSearching ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search size={16} className="mr-1" />
                    搜索
                  </>
                )}
              </button>
            </div>
            {errorMessage && (
              <div className="mt-2 text-sm text-red-500">{errorMessage}</div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0">
          {showingSearchResults && (
            <div className="flex flex-wrap items-center justify-between mb-3 pr-2 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <span>页码</span>
                <button
                  onClick={handleSearchPagePrev}
                  className={`px-3 py-1 rounded-md border text-xs transition-colors ${isSearching || !lastSearchKeyword || searchPage <= 1 ? 'text-slate-400 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 hover:bg-white'}`}
                  disabled={isSearching || !lastSearchKeyword || searchPage <= 1}
                >
                  上一页
                </button>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min={1}
                    value={searchPageInput}
                    onChange={(e) => setSearchPageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchPageSubmit(); } }}
                    className="w-16 px-2 py-1 rounded-md border border-slate-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                    disabled={!lastSearchKeyword}
                  />
                  <button
                    onClick={handleSearchPageSubmit}
                    className={`px-3 py-1 rounded-md border text-xs transition-colors ${isSearching || !lastSearchKeyword ? 'text-slate-400 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 hover:bg-white'}`}
                    disabled={isSearching || !lastSearchKeyword}
                  >
                    跳转
                  </button>
                </div>
                <button
                  onClick={handleSearchPageNext}
                  className={`px-3 py-1 rounded-md border text-xs transition-colors ${isSearching || !lastSearchKeyword || !searchHasMore ? 'text-slate-400 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 hover:bg-white'}`}
                  disabled={isSearching || !lastSearchKeyword || !searchHasMore}
                >
                  下一页
                </button>
                <span className="text-xs text-slate-500">第 {searchPage} 页</span>
              </div>
              <span className="text-xs text-slate-400">每页 {DEFAULT_SEARCH_COUNT} 条</span>
            </div>
          )}
            {musicList.length === 0 && (
              <div className="text-slate-600 text-sm">
                {showingSearchResults ? (errorMessage ?? '未找到匹配的歌曲') : '暂无音乐，请检查本地曲目配置。'}
              </div>
            )}
            {musicList.map((song, index) => (
              <div
                key={song.id}
                className={`
                  group flex items-center p-4 rounded-2xl mb-3 cursor-pointer 
                  transition-all duration-300 transform hover:scale-[1.01]
                  ${index === currentSongIndex 
                    ? 'bg-white/60 shadow-md' 
                    : 'hover:bg-white/50'
                  }
                `}
                onClick={() => { void playSong(index); }}
              >
                <div
                  className={`
                    relative w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4
                    transition-all duration-300
                    ${index === currentSongIndex ? 'shadow-md' : 'group-hover:shadow-sm'}
                  `}
                >
                  <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                    {loadingTrackIndex === index ? (
                      <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                    ) : index === currentSongIndex && isPlaying ? (
                      <div className="flex space-x-1">
                        <div className="w-1 h-3 bg-white animate-pulse"></div>
                        <div className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${index === currentSongIndex ? 'text-slate-900' : 'text-slate-700'}`}>
                    {song.name}
                  </p>
                  <p className="text-sm text-slate-500 truncate">{song.artist ?? ''}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); void handleShowTrackInfo(song); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-slate-600 transition-all duration-300"
                  >
                    <MoreVertical size={16} />
                  </button>
                  <button className="opacity-0 group-hover:opacity-100 hover:text-sky-600 transition-all duration-300">
                    <Heart size={16} />
                  </button>
                  <span className="text-sm text-slate-500">{song.duration ?? ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 播放器 */}
        <div
          className="
            hidden md:flex md:w-1/3 md:h-full md:flex-col bg-white/60
          "
        >
          {/* 顶部控制栏 */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200/70">
            <div className="flex items-center">
              {coverNodeSmall}
              <div>
                <p className="font-bold text-lg text-slate-900">{currentSong?.name ?? '未选择'}</p>
                <p className="text-slate-600">{currentSong?.artist ?? ''}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-slate-600">
              <button className="p-2 hover:text-slate-800 transition-colors">
                <Heart size={20} />
              </button>
              <button
                onClick={() => { if (currentSong) { void handleShowTrackInfo(currentSong); } }}
                className="p-2 hover:text-slate-800 transition-colors disabled:opacity-40"
                disabled={!currentSong}
              >
                <MoreVertical size={20} />
              </button>
              <button
                onClick={() => { if (currentSong?.url) { window.open(currentSong.url, '_blank'); } }}
                className="p-2 hover:text-slate-800 transition-colors disabled:opacity-50"
                disabled={!currentSong?.url}
              >
                <Share size={20} />
              </button>
            </div>
          </div>

          {/* 播放器内容 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            <div className="flex flex-col items-center w-full max-w-4xl min-h-full justify-center">
              <div className="flex-1 w-full flex flex-col items-center min-h-0">
                {!lyricsExpanded && (
                  <div className="flex items-center justify-center w-full mt-2 md:mt-0 mb-4 md:mb-6">
                    <div className="flex items-center space-x-4 md:space-x-6">
                      {coverNodeLarge}

                      <div className="text-left max-w-xs">
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">{currentSong?.name ?? '未选择'}</h2>
                        <p className="text-lg text-slate-700 mb-1">{currentSong?.artist ?? ''}</p>
                        {currentSong?.album ? <p className="text-sm text-slate-500">{currentSong.album}</p> : null}
                      </div>
                    </div>
                  </div>
                )}

                {hasAnyLyric && (
                  <div
                    className={`w-full max-w-2xl ${
                      lyricsExpanded ? 'flex-1 flex flex-col mt-2 md:mt-4 mb-4 md:mb-6' : 'mb-4 md:mb-6'
                    } min-h-0`}
                  >
                    <div className={`flex items-center justify-between ${lyricsExpanded ? 'mb-3' : 'mb-2'}`}>
                      <span className="text-sm font-semibold text-slate-600">歌词</span>
                      <div className="flex items-center space-x-2">
                        {hasTranslationLyric && (
                          <button
                            type="button"
                            onClick={() => setShowTranslation((prev) => !prev)}
                            className="text-xs px-2 py-1 rounded-md border border-sky-400 text-sky-600 hover:bg-sky-50 transition-colors"
                          >
                            {showTranslation ? '查看原文' : '查看翻译'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setLyricsExpanded((prev) => !prev)}
                          className="text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-white/70 transition-colors"
                        >
                          {lyricsExpanded ? '收起歌词' : '展开歌词'}
                        </button>
                      </div>
                    </div>
                    {lyricsExpanded ? (
                      <div
                        ref={lyricDesktopRef}
                        className="flex-1 min-h-[8rem] overflow-y-auto max-h-[calc(100vh-22rem)] md:max-h-[calc(100vh-20rem)] custom-scrollbar bg-white/70 border border-slate-200 rounded-xl p-4"
                      >
                        {displayLyricLines.length > 0 ? (
                          displayLyricLines.map((line, idx) => {
                            const isActive = idx === activeLyricIndex;
                            const key = `lyric-desktop-${showTranslation ? 'trans' : 'orig'}-${idx}`;
                            return (
                              <p
                                key={key}
                                data-lyric-key={`${currentSong?.id ?? 'unknown'}-${showTranslation ? 'trans' : 'orig'}-${Number.isFinite(line.time) ? line.time.toFixed(3) : `idx-${idx}`}`}
                                className={`leading-relaxed transition-colors ${isActive ? 'text-sky-600 font-bold text-lg' : 'text-slate-700 text-base'}`}
                              >
                                {line.text}
                              </p>
                            );
                          })
                        ) : (
                          <p className="text-sm text-slate-500">暂无歌词</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white/70 border border-slate-200 rounded-xl p-4">
                        {previewLyricLines.length > 0 ? (
                          previewLyricLines.map(({ index, line }) => {
                            const isActive = index === activeLyricIndex;
                            const key = `lyric-preview-${showTranslation ? 'trans' : 'orig'}-${index}`;
                            return (
                              <p
                                key={key}
                                className={`leading-relaxed text-center transition-all ${isActive ? 'text-sky-600 font-semibold text-lg' : 'text-slate-600 text-sm'}`}
                              >
                                {line.text}
                              </p>
                            );
                          })
                        ) : (
                          <p className="text-sm text-slate-500">暂无歌词</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`w-full max-w-2xl ${lyricsExpanded ? 'mb-4 md:mb-6 mt-2 md:mt-4' : 'mb-4 md:mb-6'}`}>
                <div className="h-2 bg-slate-300 rounded-full cursor-pointer group overflow-hidden" onClick={handleProgressClick}>
                  <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" />
                  </div>
                </div>
                <div className="flex justify-between text-sm text-slate-600 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className={`flex items-center justify-center space-x-6 ${lyricsExpanded ? 'mb-3 md:mb-5' : 'mb-2 md:mb-6'}`}>
                <button
                  onClick={() => {
                    if (musicList.length === 0) return;
                    let idx = Math.floor(Math.random() * musicList.length);
                    if (musicList.length > 1 && currentSongIndex >= 0) {
                      while (idx === currentSongIndex) {
                        idx = Math.floor(Math.random() * musicList.length);
                      }
                    }
                    void playSong(idx);
                  }}
                  className="p-2 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110"
                >
                  <Shuffle size={20} />
                </button>

                <button onClick={playPrevious} className="p-3 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
                  <SkipBack size={24} />
                </button>

                <button onClick={togglePlayPause} className="p-4 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-110 shadow-lg text-white">
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>

                <button onClick={playNext} className="p-3 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110">
                  <SkipForward size={24} />
                </button>

                <button
                  onClick={() => setPlaybackMode((m) => (m === 'order' ? 'single' : m === 'single' ? 'shuffle' : 'order'))}
                  className={`p-2 transition-all duration-300 transform hover:scale-110 ${playbackMode === 'order' ? 'text-slate-600 hover:text-slate-900' : 'text-sky-600 ring-1 ring-sky-400 rounded-full'}`}
                >
                  {playbackMode === 'single' ? <Repeat1 size={20} /> : playbackMode === 'shuffle' ? <Shuffle size={20} /> : <Repeat size={20} />}
                </button>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <Volume2 size={20} className="text-slate-600" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-32 h-1 bg-slate-300 rounded-full appearance-none cursor-pointer slider hover:bg-slate-400 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
        {/* 移动端：底部小播放器与半屏展开（带动画） */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 h-20 z-30 bg-white/80 backdrop-blur border-t border-slate-200 flex items-center px-3 transform transition-transform duration-300 ease-in-out ${mobileExpanded ? 'translate-y-full pointer-events-none' : 'translate-y-0'}`}
        >
          <div className="flex items-center flex-1 min-w-0" onClick={() => setMobileExpanded(true)}>
            {coverNodeSmall}
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{currentSong?.name ?? '未选择'}</p>
              <p className="text-sm text-slate-600 truncate">{currentSong?.artist ?? ''}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 pl-3">
            <button onClick={(e) => { e.stopPropagation(); playPrevious(); }} className="p-2 text-slate-600 hover:text-slate-900">
              <SkipBack size={20} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="p-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full text-white">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="p-2 text-slate-600 hover:text-slate-900">
              <SkipForward size={20} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMobileExpanded(true); }} className="p-2 text-slate-600 hover:text-slate-900">
              <ChevronUp size={20} />
            </button>
          </div>
        </div>
        {mobileExpanded && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-slate-900/20"
            onClick={() => setMobileExpanded(false)}
            aria-hidden="true"
          />
        )}
        <div
          className={`md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur shadow-2xl flex flex-col overflow-hidden rounded-t-2xl transform transition-transform duration-300 ease-in-out ${mobileExpanded ? 'translate-y-0 h-[65vh]' : 'translate-y-full pointer-events-none h-[52vh]'}`}
        >
          <div className={`flex items-center justify-between p-4 border-b border-slate-200/70 ${lyricsExpanded ? 'hidden' : ''}`}>
            <div className="flex items-center">
              {coverNodeSmall}
              <div>
                <p className="font-bold text-lg text-slate-900">{currentSong?.name ?? '未选择'}</p>
                <p className="text-slate-600">{currentSong?.artist ?? ''}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <button className="p-2 hover:text-slate-800 transition-colors">
                <Heart size={20} />
              </button>
              <button
                onClick={() => { if (currentSong) { void handleShowTrackInfo(currentSong); } }}
                className="p-2 hover:text-slate-800 transition-colors disabled:opacity-40"
                disabled={!currentSong}
              >
                <MoreVertical size={20} />
              </button>
              <button
                onClick={() => { if (currentSong?.url) { window.open(currentSong.url, '_blank'); } }}
                className="p-2 hover:text-slate-800 transition-colors disabled:opacity-50"
                disabled={!currentSong?.url}
              >
                <Share size={20} />
              </button>
              <button onClick={() => setMobileExpanded(false)} className="p-2 hover:text-slate-800">
                <ChevronDown size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 w-full flex flex-col">
              {hasAnyLyric ? (
                <div className={`w-full ${lyricsExpanded ? 'flex-1 flex flex-col' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-600">歌词</span>
                    <div className="flex items-center space-x-2">
                      {hasTranslationLyric && (
                        <button
                          type="button"
                          onClick={() => setShowTranslation((prev) => !prev)}
                          className="text-xs px-2 py-1 rounded-md border border-sky-400 text-sky-600 hover:bg-sky-50 transition-colors"
                        >
                          {showTranslation ? '查看原文' : '查看翻译'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setLyricsExpanded((prev) => !prev)}
                        className="text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-white/70 transition-colors"
                      >
                        {lyricsExpanded ? '收起歌词' : '展开歌词'}
                      </button>
                    </div>
                  </div>
                  {lyricsExpanded ? (
                    <div
                      ref={lyricMobileRef}
                      className="flex-1 min-h-[8rem] overflow-y-auto max-h-[calc(100vh-24rem)] custom-scrollbar bg-white/70 border border-slate-200 rounded-xl p-3"
                    >
                      {displayLyricLines.length > 0 ? (
                        displayLyricLines.map((line, idx) => {
                          const isActive = idx === activeLyricIndex;
                          const key = `lyric-mobile-${showTranslation ? 'trans' : 'orig'}-${idx}`;
                          return (
                            <p
                              key={key}
                              data-lyric-key={`${currentSong?.id ?? 'unknown'}-${showTranslation ? 'trans' : 'orig'}-${Number.isFinite(line.time) ? line.time.toFixed(3) : `idx-${idx}`}`}
                              className={`leading-relaxed transition-colors ${isActive ? 'text-sky-600 font-bold text-base' : 'text-slate-700 text-sm'}`}
                            >
                              {line.text}
                            </p>
                          );
                        })
                      ) : (
                        <p className="text-sm text-slate-500">暂无歌词</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/70 border border-slate-200 rounded-xl p-3">
                      {previewLyricLines.length > 0 ? (
                        previewLyricLines.map(({ index, line }) => {
                          const isActive = index === activeLyricIndex;
                          const key = `lyric-preview-mobile-${showTranslation ? 'trans' : 'orig'}-${index}`;
                          return (
                            <p
                              key={key}
                              className={`leading-relaxed text-center transition-all ${isActive ? 'text-sky-600 font-semibold text-base' : 'text-slate-600 text-sm'}`}
                            >
                              {line.text}
                            </p>
                          );
                        })
                      ) : (
                        <p className="text-sm text-slate-500">暂无歌词</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-slate-500">暂无歌词</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="h-2 bg-slate-300 rounded-full cursor-pointer group overflow-hidden" onClick={handleProgressClick}>
                <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-4">
              <button
                onClick={() => {
                  if (musicList.length === 0) return;
                  let idx = Math.floor(Math.random() * musicList.length);
                  if (musicList.length > 1 && currentSongIndex >= 0) {
                    while (idx === currentSongIndex) {
                      idx = Math.floor(Math.random() * musicList.length);
                    }
                  }
                  void playSong(idx);
                }}
                className="p-2 text-slate-600 hover:text-slate-900"
              >
                <Shuffle size={20} />
              </button>
              <button onClick={playPrevious} className="p-2 text-slate-600 hover:text-slate-900">
                <SkipBack size={24} />
              </button>
              <button onClick={togglePlayPause} className="p-3 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full text-white">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={playNext} className="p-2 text-slate-600 hover:text-slate-900">
                <SkipForward size={24} />
              </button>
              <button
                onClick={() => setPlaybackMode((m) => (m === 'order' ? 'single' : m === 'single' ? 'shuffle' : 'order'))}
                className={`p-2 ${playbackMode === 'order' ? 'text-slate-600 hover:text-slate-900' : 'text-sky-600 ring-1 ring-sky-400 rounded-full'}`}
              >
                {playbackMode === 'single' ? <Repeat1 size={20} /> : playbackMode === 'shuffle' ? <Shuffle size={20} /> : <Repeat size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-center space-x-3 mt-3">
              <Volume2 size={20} className="text-slate-600" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-32 h-1 bg-slate-300 rounded-full appearance-none cursor-pointer slider hover:bg-slate-400 transition-colors"
              />
            </div>
          </div>
        </div>
      {infoModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4" onClick={handleCloseInfoModal}>
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseInfoModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              关闭
            </button>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">歌曲信息</h3>
            {infoModalLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
              </div>
            ) : infoModalError ? (
              <div className="space-y-4 text-sm text-slate-600">
                <p>{infoModalError}</p>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleRetryInfo}
                    className="px-3 py-1.5 rounded-md bg-sky-500 text-white text-xs hover:bg-sky-600 transition-colors"
                  >
                    重试
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseInfoModal}
                    className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-white"
                  >
                    关闭
                  </button>
                </div>
              </div>
            ) : infoTrack ? (
              <div className="space-y-3 text-sm text-slate-700">
                <p>歌名：{infoTrack.name}</p>
                <p>歌手：{infoTrack.artist || '未知'}</p>
                <p>专辑：{infoTrack.album || '未知'}</p>
                <p>时长：{durationLabel}</p>
                <p>来源：{infoSourceLabel}{infoSourceLabel && infoSourceLabel !== infoTrack.source ? `（${infoTrack.source}）` : ''}</p>
                <p>歌曲ID：{infoTrack.trackId ?? '未知'}</p>
                <p>文件大小：{fileSizeLabel}</p>
                <p>播放音质：{bitrateLabel}</p>
                <div className="space-y-1">
                  <p>歌词链接：{lyricLink ? (<a className="text-sky-600 hover:underline" href={lyricLink} target="_blank" rel="noreferrer">点击下载</a>) : '暂无'}</p>
                  <p>封面链接：{coverLink ? (<a className="text-sky-600 hover:underline" href={coverLink} target="_blank" rel="noreferrer">查看封面</a>) : '暂无'}</p>
                  <p>歌曲链接：{audioLink ? (<a className="text-sky-600 hover:underline break-all" href={audioLink} target="_blank" rel="noreferrer">{audioLink}</a>) : '暂无'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">暂无歌曲信息</p>
            )}
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default MusicPlayer;
