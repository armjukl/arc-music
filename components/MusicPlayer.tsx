// components/MusicPlayer.tsx
"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Howl } from "howler";
import { BITRATE_OPTIONS, LOCAL_TRACKS, MusicSource } from "../data/localTracks";
import { DEFAULT_MUSIC_API_ID, getMusicApi, MUSIC_APIS } from "../api";
import type { MusicApiId } from "../api";
import { TrackInfoModal } from "./player/TrackInfoModal";
import { LibraryPanel } from "./player/LibraryPanel";
import { DesktopPlayer } from "./player/DesktopPlayer";
import { MobilePlayer } from "./player/MobilePlayer";
import type {
  BitrateOption,
  CombinedLyricLine,
  FavoriteTrack,
  LyricLine,
  PlaybackHistoryTrack,
  PlaybackMode,
  Track,
} from "./player/types";
import {
  createTrack,
  parseLyricLines,
  sanitizeUrl,
  selectBestSearchResult,
} from "./player/utils";

const DEFAULT_SEARCH_COUNT = 8;
const DEFAULT_COVER_SIZE = "300";

const GDSTUDIO_SOURCES: { value: MusicSource; label: string }[] = [
  { value: "netease", label: "网易云" },
  { value: "kuwo", label: "酷我" },
  { value: "joox", label: "JOOX" },
];

const BILIBILI_SOURCES: { value: MusicSource; label: string }[] = [
  { value: "bilibili", label: "Bilibili" },
];

const DEFAULT_SOURCE: MusicSource = "netease";
const PLAYBACK_HISTORY_STORAGE_KEY = "arc-music-playback-history";
const FAVORITES_STORAGE_KEY = "arc-music-favorites";
const PERFORMANCE_MODE_STORAGE_KEY = "arc-music-performance-mode";
const THEME_MODE_STORAGE_KEY = "arc-music-theme-mode";
const COVER_BACKGROUND_STORAGE_KEY = "arc-music-cover-background";
const MAX_PLAYBACK_HISTORY = 50;
const MAX_FAVORITES = 50;
type PerformanceMode = "normal" | "low";
type ThemeMode = "light" | "dark" | "system";
const INITIAL_TRACKS: Track[] = LOCAL_TRACKS.map((track) =>
  createTrack(track, DEFAULT_MUSIC_API_ID),
);
const INITIAL_SOURCE_TRACKS: Track[] = INITIAL_TRACKS.filter(
  (track) =>
    track.apiId === DEFAULT_MUSIC_API_ID && track.source === DEFAULT_SOURCE,
);

const toPlaybackHistoryTrack = (track: Track): PlaybackHistoryTrack => ({
  id: track.id,
  name: track.name,
  artist: track.artist,
  album: track.album,
  duration: track.duration,
  apiId: track.apiId,
  source: track.source,
  keyword: track.keyword,
  trackId: track.trackId,
  picId: track.picId,
  lyricId: track.lyricId,
  bitrate: track.bitrate,
  cover: track.cover,
  publishedAt: track.publishedAt,
});

const toFavoriteTrack = (track: Track): FavoriteTrack => toPlaybackHistoryTrack(track);

const MusicPlayer = () => {
  // 播放器状态
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [isDragCancel, setIsDragCancel] = useState(false);
  const isDraggingProgressRef = useRef(false);
  const dragProgressRef = useRef(0);
  const isDragCancelRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const desktopPlayBtnRef = useRef<HTMLButtonElement | null>(null);
  const mobilePlayBtnRef = useRef<HTMLButtonElement | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [localTracks, setLocalTracks] = useState<Track[]>(() => INITIAL_TRACKS);
  const [selectedApiId, setSelectedApiId] =
    useState<MusicApiId>(DEFAULT_MUSIC_API_ID);
  const [selectedSource, setSelectedSource] =
    useState<MusicSource>(DEFAULT_SOURCE);
  const [selectedBitrate, setSelectedBitrate] = useState<BitrateOption>(320);
  const [musicList, setMusicList] = useState<Track[]>(
    () => INITIAL_SOURCE_TRACKS,
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("order");
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [loadingTrackIndex, setLoadingTrackIndex] = useState<number | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchPageInput, setSearchPageInput] = useState("1");
  const [lastSearchKeyword, setLastSearchKeyword] = useState<string | null>(
    null,
  );
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTrack, setInfoModalTrack] = useState<Track | null>(null);
  const [infoModalLoading, setInfoModalLoading] = useState(false);
  const [infoModalError, setInfoModalError] = useState<string | null>(null);
  const [playbackHistory, setPlaybackHistory] = useState<PlaybackHistoryTrack[]>([]);
  const [showingPlaybackHistory, setShowingPlaybackHistory] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
  const [showingFavorites, setShowingFavorites] = useState(false);
  const [pendingHistoryIndex, setPendingHistoryIndex] = useState<number | null>(null);
  const [performanceMode, setPerformanceMode] =
    useState<PerformanceMode>("normal");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [coverBackground, setCoverBackground] = useState(false);

  const soundRef = useRef<Howl | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef(false);
  const playbackModeRef = useRef<PlaybackMode>("order");
  const playRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const lyricDesktopRef = useRef<HTMLDivElement | null>(null);
  const lyricMobileRef = useRef<HTMLDivElement | null>(null);
  const infoRequestIdRef = useRef(0);

  const currentSong =
    currentSongIndex >= 0 ? musicList[currentSongIndex] : undefined;
  const isCurrentSongFavorite = currentSong
    ? favorites.some(
        (favorite) =>
          favorite.id === currentSong.id && favorite.apiId === currentSong.apiId,
      )
    : false;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PLAYBACK_HISTORY_STORAGE_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setPlaybackHistory(
          parsed
            .filter(
              (item): item is PlaybackHistoryTrack =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as PlaybackHistoryTrack).id === "string" &&
                typeof (item as PlaybackHistoryTrack).name === "string",
            )
            .map((item) => toPlaybackHistoryTrack(item as Track))
            .slice(0, MAX_PLAYBACK_HISTORY),
        );
      }
    } catch {
      window.localStorage.removeItem(PLAYBACK_HISTORY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setFavorites(
          parsed
            .filter(
              (item): item is FavoriteTrack =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as FavoriteTrack).id === "string" &&
                typeof (item as FavoriteTrack).name === "string",
            )
            .map((item) => toFavoriteTrack(item as Track))
            .slice(0, MAX_FAVORITES),
        );
      }
    } catch {
      window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PERFORMANCE_MODE_STORAGE_KEY);
      if (stored === "normal" || stored === "low") {
        setPerformanceMode(stored);
      }
    } catch {
      // Keep the default mode when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeMode(stored);
      }
    } catch {
      // Keep the default theme when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemPrefersDark(media.matches);
    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    if (typeof media.addListener === "function") {
      media.addListener(update);
      return () => media.removeListener(update);
    }
    return undefined;
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COVER_BACKGROUND_STORAGE_KEY);
      if (stored === "on") {
        setCoverBackground(true);
      }
    } catch {
      // Keep the default state when storage is unavailable.
    }
  }, []);

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

  const originalLyricLines = useMemo(
    () => parseLyricLines(currentSong?.lyric),
    [currentSong?.lyric],
  );
  const translationLyricLines = useMemo(
    () => parseLyricLines(currentSong?.tLyric),
    [currentSong?.tLyric],
  );
  const hasTranslationLyric = translationLyricLines.length > 0;
  const hasOriginalLyric = originalLyricLines.length > 0;

  useEffect(() => {
    if (hasTranslationLyric) {
      setShowTranslation(true);
    }
  }, [currentSong?.id, hasTranslationLyric]);

  function findTranslationForTime(
    time: number,
    translations: LyricLine[],
  ): string {
    let best = "";
    let bestDiff = Number.POSITIVE_INFINITY;
    for (const t of translations) {
      if (!Number.isFinite(t.time)) continue;
      const diff = Math.abs(t.time - time);
      if (diff < bestDiff && diff < 0.5) {
        bestDiff = diff;
        best = t.text;
      }
    }
    return best;
  }

  const displayLyricLines = useMemo<CombinedLyricLine[]>(() => {
    const hasTranslation = hasTranslationLyric && showTranslation;
    if (hasTranslation && !hasOriginalLyric) {
      return translationLyricLines.map((line) => ({
        time: line.time,
        original: line.text,
        translation: "",
      }));
    }
    if (!hasOriginalLyric) return [];
    return originalLyricLines.map((line) => ({
      time: line.time,
      original: line.text,
      translation: hasTranslation
        ? findTranslationForTime(line.time, translationLyricLines)
        : "",
    }));
  }, [
    hasOriginalLyric,
    hasTranslationLyric,
    originalLyricLines,
    showTranslation,
    translationLyricLines,
  ]);

  const hasAnyLyric =
    displayLyricLines.length > 0 || hasTranslationLyric || hasOriginalLyric;

  function findLyricIndexAt(time: number): number {
    if (displayLyricLines.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < displayLyricLines.length; i += 1) {
      const entry = displayLyricLines[i];
      if (!Number.isFinite(entry.time)) continue;
      if (entry.time <= time + 0.25) {
        index = i;
      } else if (entry.time > time + 0.25) {
        break;
      }
    }
    if (index === -1 && displayLyricLines.length > 0) {
      const firstFinite = displayLyricLines.findIndex((entry) =>
        Number.isFinite(entry.time),
      );
      if (firstFinite === -1) {
        return 0;
      }
      return firstFinite;
    }
    return index;
  }

  const activeLyricIndex = useMemo(() => {
    if (isDraggingProgress && lyricsExpanded) {
      const dragTime = (dragProgress / 100) * (duration || 0);
      return findLyricIndexAt(dragTime);
    }
    return findLyricIndexAt(currentTime);
  }, [
    currentTime,
    displayLyricLines,
    isDraggingProgress,
    dragProgress,
    duration,
    lyricsExpanded,
  ]);

  const activeLyricKey = useMemo(() => {
    if (activeLyricIndex < 0 || activeLyricIndex >= displayLyricLines.length)
      return null;
    const entry = displayLyricLines[activeLyricIndex];
    const timeKey = Number.isFinite(entry.time)
      ? entry.time.toFixed(3)
      : `idx-${activeLyricIndex}`;
    return `${currentSong?.id ?? "unknown"}-combined-${timeKey}`;
  }, [activeLyricIndex, currentSong?.id, displayLyricLines]);

  const previewLyricLines = useMemo(() => {
    if (displayLyricLines.length === 0)
      return [] as { index: number; line: CombinedLyricLine }[];
    const baseIndex =
      activeLyricIndex >= 0 && activeLyricIndex < displayLyricLines.length
        ? activeLyricIndex
        : 0;
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
      const target = container.querySelector<HTMLElement>(
        `[data-lyric-key="${activeLyricKey}"]`,
      );
      if (!target) return;
      const offset =
        target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
      if (typeof container.scrollTo === "function") {
        container.scrollTo({
          top: Math.max(offset, 0),
          behavior:
            isDraggingProgress || performanceMode === "low" ? "auto" : "smooth",
        });
      } else {
        container.scrollTop = Math.max(offset, 0);
      }
    });
  }, [
    activeLyricKey,
    lyricDesktopRef,
    lyricMobileRef,
    lyricsExpanded,
    mobileExpanded,
    isDraggingProgress,
    performanceMode,
  ]);

  const handlePerformanceModeChange = useCallback((mode: PerformanceMode) => {
    setPerformanceMode(mode);
    try {
      window.localStorage.setItem(PERFORMANCE_MODE_STORAGE_KEY, mode);
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }, []);

  const handleThemeModeChange = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }, []);

  const handleCoverBackgroundChange = useCallback((enabled: boolean) => {
    setCoverBackground(enabled);
    try {
      window.localStorage.setItem(
        COVER_BACKGROUND_STORAGE_KEY,
        enabled ? "on" : "off",
      );
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }, []);

  const updateTrackInStates = useCallback((updated: Track) => {
    setLocalTracks((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    setMusicList((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }, []);

  const recordPlaybackHistory = useCallback((track: Track) => {
    const historyTrack = toPlaybackHistoryTrack(track);

    setPlaybackHistory((previous) => {
      const next = [
        historyTrack,
        ...previous.filter(
          (item) => !(item.id === historyTrack.id && item.apiId === historyTrack.apiId),
        ),
      ].slice(0, MAX_PLAYBACK_HISTORY);

      try {
        window.localStorage.setItem(PLAYBACK_HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota and privacy-mode failures without interrupting playback.
      }
      return next;
    });
  }, []);

  const ensureTrackResolved = useCallback(
    async (track: Track, desiredBitrate: BitrateOption): Promise<Track> => {
      if (track.url && track.bitrate === desiredBitrate) {
        return track;
      }

      const keyword = (
        track.keyword ?? `${track.name} ${track.artist ?? ""}`
      ).trim();
      let trackId = track.trackId;
      let picId = track.picId;
      let lyricId = track.lyricId;
      let resolvedName = track.name;
      let resolvedAlbum = track.album;
      let resolvedArtist = track.artist;
      let lyricText = track.lyric ?? null;
      let translationText = track.tLyric ?? null;
      let cover = track.cover ?? null;
      let publishedAt = track.publishedAt;
      const api = getMusicApi(track.apiId);

      if (!trackId) {
        if (!keyword) {
          throw new Error("未配置歌曲关键词");
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
          throw new Error("未找到对应歌曲");
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
        const artistText = Array.isArray(artistValue)
          ? artistValue.join(", ")
          : artistValue;
        if (artistText) {
          resolvedArtist = artistText;
        }
        if (best.cover_url) {
          cover = best.cover_url;
        }
        if (best.published_at) {
          publishedAt = best.published_at;
        }
      }

      const urlData = await api.getUrl({
        source: track.source,
        id: trackId,
        bitrate: desiredBitrate,
      });

      if (!urlData || !urlData.url) {
        throw new Error("未获取到播放链接");
      }

      const resolvedUrl = sanitizeUrl(urlData.url);

      if (picId) {
        try {
          const picData = await api.getPic({
            source: track.source,
            id: picId,
            size: DEFAULT_COVER_SIZE,
          });
          if (
            picData &&
            typeof picData.url === "string" &&
            picData.url.trim()
          ) {
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
            if (typeof lyricData.lyric === "string" && lyricData.lyric.trim()) {
              lyricText = lyricData.lyric;
            }
            if (
              typeof lyricData.tlyric === "string" &&
              lyricData.tlyric.trim()
            ) {
              translationText = lyricData.tlyric;
            }
          }
        } catch {
          // ignore lyric fetch failure
        }
      }

      const fileSizeKb =
        typeof urlData.size === "number"
          ? urlData.size / 1024
          : (track.fileSizeKb ?? null);

      const resolvedTrack: Track = {
        ...track,
        url: resolvedUrl,
        trackId,
        picId,
        lyricId,
        cover,
        publishedAt,
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
    },
    [updateTrackInStates],
  );

  const playSong = useCallback(
    async (index: number, autoplay = true) => {
      if (index < 0 || index >= musicList.length) return;
      if (loadingTrackIndex !== null && loadingTrackIndex === index) return;

      const requestId = ++playRequestIdRef.current;
      setLoadingTrackIndex(index);
      setErrorMessage(null);
      setIsPlaying(false);

      try {
        const originalTrack = musicList[index];
        if (!originalTrack) {
          throw new Error("未找到歌曲");
        }

        const needsNewBitrate = originalTrack.bitrate !== selectedBitrate;
        const baseTrack: Track = {
          ...originalTrack,
          bitrate: selectedBitrate,
          url: needsNewBitrate ? undefined : originalTrack.url,
          fileSizeKb: needsNewBitrate
            ? null
            : (originalTrack.fileSizeKb ?? null),
        };

        updateTrackInStates(baseTrack);

        let resolvedTrack = baseTrack;
        if (!resolvedTrack.url) {
          resolvedTrack = await ensureTrackResolved(baseTrack, selectedBitrate);
        }

        if (playRequestIdRef.current !== requestId) {
          return;
        }

        recordPlaybackHistory(resolvedTrack);

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
          const message =
            err instanceof Error ? err.message : "播放失败，请稍后重试";
          setErrorMessage(message);
        }
      } finally {
        if (playRequestIdRef.current === requestId) {
          setLoadingTrackIndex(null);
        }
      }
    },
    [
      ensureTrackResolved,
      musicList,
      loadingTrackIndex,
      selectedBitrate,
      updateTrackInStates,
      recordPlaybackHistory,
    ],
  );

  useEffect(() => {
    if (pendingHistoryIndex === null) return;
    const track = musicList[pendingHistoryIndex];
    if (!track) return;
    if (
      selectedApiId !== track.apiId ||
      selectedSource !== track.source ||
      selectedBitrate !== track.bitrate
    ) return;
    setPendingHistoryIndex(null);
    void playSong(pendingHistoryIndex);
  }, [
    musicList,
    pendingHistoryIndex,
    playSong,
    selectedApiId,
    selectedBitrate,
    selectedSource,
  ]);

  const handlePlayHistoryTrack = useCallback(
    (historyTrack: PlaybackHistoryTrack, index: number) => {
      const bitrate = historyTrack.bitrate ?? selectedBitrate;
      const tracks: Track[] = playbackHistory.map((item) => ({
        ...item,
        bitrate: item.bitrate ?? bitrate,
        url: undefined,
        lyric: null,
        tLyric: null,
        fileSizeKb: null,
      }));
      const track = tracks[index];
      if (!track) return;

      setSelectedApiId(track.apiId);
      setSelectedSource(track.source);
      setSelectedBitrate(bitrate);
      setMusicList(tracks);
      setCurrentSongIndex(-1);
      setPendingHistoryIndex(index);
    },
    [playbackHistory, selectedBitrate],
  );

  const handlePlayFavoriteTrack = useCallback(
    (favorite: FavoriteTrack, index: number) => {
      const bitrate = favorite.bitrate ?? selectedBitrate;
      const tracks: Track[] = favorites.map((item) => ({
        ...item,
        bitrate: item.bitrate ?? bitrate,
        url: undefined,
        lyric: null,
        tLyric: null,
        fileSizeKb: null,
      }));
      const track = tracks[index];
      if (!track) return;

      setSelectedApiId(track.apiId);
      setSelectedSource(track.source);
      setSelectedBitrate(bitrate);
      setMusicList(tracks);
      setCurrentSongIndex(-1);
      setPendingHistoryIndex(index);
    },
    [favorites, selectedBitrate],
  );

  const handleToggleFavorite = useCallback((track: Track) => {
    const favorite = toFavoriteTrack(track);
    setFavorites((previous) => {
      const exists = previous.some(
        (item) => item.id === favorite.id && item.apiId === favorite.apiId,
      );
      // Adding preserves the existing user-defined order; playback never changes it.
      const next = exists
        ? previous.filter(
            (item) => !(item.id === favorite.id && item.apiId === favorite.apiId),
          )
        : [...previous, favorite].slice(0, MAX_FAVORITES);
      try {
        window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Keep the in-memory list usable if storage is unavailable.
      }
      return next;
    });
  }, []);

  const handleReorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
    setFavorites((previous) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= previous.length ||
        toIndex >= previous.length ||
        fromIndex === toIndex
      ) {
        return previous;
      }
      const next = [...previous];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      try {
        window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Keep the in-memory reorder usable if storage is unavailable.
      }
      return next;
    });
  }, []);

  const handleClearPlaybackHistory = useCallback(() => {
    setPlaybackHistory([]);
    try {
      window.localStorage.removeItem(PLAYBACK_HISTORY_STORAGE_KEY);
    } catch {
      // Ignore privacy-mode failures; the in-memory history is still cleared.
    }
  }, []);

  const handleDeletePlaybackHistoryTrack = useCallback(
    (track: PlaybackHistoryTrack) => {
      setPlaybackHistory((previous) => {
        const next = previous.filter(
          (item) => !(item.id === track.id && item.apiId === track.apiId),
        );
        try {
          window.localStorage.setItem(
            PLAYBACK_HISTORY_STORAGE_KEY,
            JSON.stringify(next),
          );
        } catch {
          // Ignore storage failures without affecting the visible history list.
        }
        return next;
      });
    },
    [],
  );

  const playNext = useCallback(() => {
    if (musicList.length === 0) return;

    const mode = playbackModeRef.current;
    if (currentSongIndex < 0) {
      void playSong(0);
      return;
    }

    if (mode === "shuffle") {
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

    const nextIndex =
      currentSongIndex >= musicList.length - 1 ? 0 : currentSongIndex + 1;
    void playSong(nextIndex);
  }, [currentSongIndex, musicList, playSong]);

  const playPrevious = useCallback(() => {
    if (musicList.length === 0) return;

    const mode = playbackModeRef.current;
    if (currentSongIndex < 0) {
      void playSong(0);
      return;
    }

    if (mode === "shuffle") {
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

    const previousIndex =
      currentSongIndex <= 0 ? musicList.length - 1 : currentSongIndex - 1;
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
        if (playbackModeRef.current === "single") {
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

  const performSearch = useCallback(
    async (
      apiId: MusicApiId,
      source: MusicSource,
      keyword: string,
      page = 1,
    ) => {
      const trimmedKeyword = keyword.trim();
      if (!trimmedKeyword) return;

      const activeTrack =
        currentSongIndex >= 0 ? musicList[currentSongIndex] : null;
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
          const artistText = Array.isArray(item.artist)
            ? item.artist.join(", ")
            : (item.artist ?? "");
          const mappedTrack: Track = {
            id: `${apiId}-${source}-${rawId}`,
            name: item.name ?? trimmedKeyword,
            artist: artistText,
            album: item.album ?? "",
            duration: item.duration ?? "",
            apiId,
            source,
            keyword: trimmedKeyword,
            trackId,
            picId,
            lyricId,
            bitrate: selectedBitrate,
            url: undefined,
            cover: item.cover_url ?? (picId ? undefined : null),
            publishedAt: item.published_at,
            lyric: null,
            tLyric: null,
            fileSizeKb: null,
          };
          return mappedTrack;
        });
        if (searchRequestIdRef.current !== requestId) {
          return;
        }

        let nextList: Track[] = mapped;
        let nextIndex: number | null = null;

        if (hasActiveSound && activeTrack) {
          const existingIndex = mapped.findIndex(
            (item) => item.id === activeTrack.id,
          );
          if (existingIndex >= 0) {
            const mergedTrack: Track = {
              ...mapped[existingIndex],
              ...activeTrack,
            };
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
        setErrorMessage(mapped.length === 0 ? "未找到匹配的歌曲" : null);
      } catch (err) {
        if (searchRequestIdRef.current !== requestId) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "搜索失败，请稍后再试";
        setErrorMessage(message);
        setShowingSearchResults(true);
        setShowTranslation(false);
        setLastSearchKeyword(trimmedKeyword);
        setSearchPage(page);
        setSearchPageInput(String(page));
        setSearchHasMore(false);
        if (!hasActiveSound) {
          setMusicList([]);
        }
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setIsSearching(false);
        }
      }
    },
    [currentSongIndex, musicList, resetPlayer, selectedBitrate],
  );

  const handleSearch = useCallback(async () => {
    const keyword = searchTerm.trim();
    if (!keyword) {
      const activeTrack =
        soundRef.current && currentSongIndex >= 0
          ? musicList[currentSongIndex]
          : null;
      searchRequestIdRef.current += 1;
      setIsSearching(false);
      const filtered = localTracks.filter(
        (track) =>
          track.apiId === selectedApiId && track.source === selectedSource,
      );
      if (activeTrack) {
        const existingIndex = filtered.findIndex(
          (track) => track.id === activeTrack.id,
        );
        const nextList = [...filtered];
        const nextIndex = existingIndex >= 0 ? existingIndex : 0;
        if (existingIndex >= 0) {
          nextList[existingIndex] = { ...nextList[existingIndex], ...activeTrack };
        } else {
          nextList.unshift(activeTrack);
        }
        setMusicList(nextList);
        setCurrentSongIndex(nextIndex);
      } else {
        setMusicList(filtered);
        resetPlayer();
      }
      setShowingSearchResults(false);
      setShowTranslation(false);
      setErrorMessage(null);
      setSearchPage(1);
      setSearchPageInput("1");
      setSearchHasMore(false);
      setLastSearchKeyword(null);
      return;
    }

    setSearchPageInput("1");
    await performSearch(selectedApiId, selectedSource, keyword, 1);
  }, [
    localTracks,
    currentSongIndex,
    musicList,
    performSearch,
    resetPlayer,
    searchTerm,
    selectedApiId,
    selectedSource,
  ]);

  const handleSearchPagePrev = useCallback(() => {
    if (!lastSearchKeyword) return;
    if (searchPage <= 1) return;
    void performSearch(
      selectedApiId,
      selectedSource,
      lastSearchKeyword,
      Math.max(1, searchPage - 1),
    );
  }, [
    lastSearchKeyword,
    performSearch,
    searchPage,
    selectedApiId,
    selectedSource,
  ]);

  const handleSearchPageNext = useCallback(() => {
    if (!lastSearchKeyword) return;
    if (!searchHasMore) return;
    void performSearch(
      selectedApiId,
      selectedSource,
      lastSearchKeyword,
      searchPage + 1,
    );
  }, [
    lastSearchKeyword,
    performSearch,
    searchHasMore,
    searchPage,
    selectedApiId,
    selectedSource,
  ]);

  const handleSearchPageSubmit = useCallback(() => {
    if (!lastSearchKeyword) return;
    const pageValue = Number.parseInt(searchPageInput, 10);
    if (!Number.isFinite(pageValue) || pageValue <= 0) return;
    void performSearch(
      selectedApiId,
      selectedSource,
      lastSearchKeyword,
      pageValue,
    );
  }, [
    lastSearchKeyword,
    performSearch,
    searchPageInput,
    selectedApiId,
    selectedSource,
  ]);

  const handleCloseInfoModal = useCallback(() => {
    setInfoModalVisible(false);
    setInfoModalTrack(null);
    setInfoModalLoading(false);
    setInfoModalError(null);
  }, []);

  const handleShowTrackInfo = useCallback(
    async (track: Track) => {
      if (!track) return;
      const requestId = ++infoRequestIdRef.current;
      setInfoModalVisible(true);
      setInfoModalLoading(true);
      setInfoModalError(null);
      setInfoModalTrack({ ...track });

      try {
        const desiredBitrate = (track.bitrate ??
          selectedBitrate) as BitrateOption;
        const resolved = await ensureTrackResolved(
          { ...track, bitrate: desiredBitrate },
          desiredBitrate,
        );
        if (infoRequestIdRef.current !== requestId) {
          return;
        }
        setInfoModalTrack({ ...resolved });
      } catch (err) {
        if (infoRequestIdRef.current !== requestId) {
          return;
        }
        setInfoModalError(
          err instanceof Error ? err.message : "获取歌曲信息失败",
        );
      } finally {
        if (infoRequestIdRef.current === requestId) {
          setInfoModalLoading(false);
        }
      }
    },
    [ensureTrackResolved, selectedBitrate],
  );

  const handleRetryInfo = useCallback(() => {
    if (infoModalTrack) {
      void handleShowTrackInfo(infoModalTrack);
    }
  }, [handleShowTrackInfo, infoModalTrack]);

  const handleApiChange = useCallback(
    (apiId: MusicApiId) => {
      if (apiId === selectedApiId) return;

      const nextSource: MusicSource =
        apiId === "bilibili"
          ? "bilibili"
          : selectedSource === "bilibili"
            ? "netease"
            : selectedSource;
      setSelectedApiId(apiId);
      setSelectedSource(nextSource);
      if (searchTerm.trim()) {
        setSearchPageInput("1");
        void performSearch(apiId, nextSource, searchTerm.trim(), 1);
      } else {
        const activeTrack =
          soundRef.current && currentSongIndex >= 0
            ? musicList[currentSongIndex]
            : null;
        searchRequestIdRef.current += 1;
        setIsSearching(false);
        const filtered = localTracks.filter(
          (track) => track.apiId === apiId && track.source === nextSource,
        );
        if (activeTrack) {
          const existingIndex = filtered.findIndex(
            (track) => track.id === activeTrack.id,
          );
          const nextList = [...filtered];
          const nextIndex = existingIndex >= 0 ? existingIndex : 0;
          if (existingIndex >= 0) {
            nextList[existingIndex] = { ...nextList[existingIndex], ...activeTrack };
          } else {
            nextList.unshift(activeTrack);
          }
          setMusicList(nextList);
          setCurrentSongIndex(nextIndex);
        } else {
          setMusicList(filtered);
          resetPlayer();
        }
        setShowingSearchResults(false);
        setShowTranslation(false);
        setErrorMessage(null);
        setSearchPage(1);
        setSearchPageInput("1");
        setSearchHasMore(false);
        setLastSearchKeyword(null);
      }
    },
    [
      localTracks,
      currentSongIndex,
      musicList,
      performSearch,
      resetPlayer,
      searchTerm,
      selectedApiId,
      selectedSource,
    ],
  );

  const handleSourceChange = useCallback(
    (source: MusicSource) => {
      if (source === selectedSource) return;

      setSelectedSource(source);
      if (searchTerm.trim()) {
        setSearchPageInput("1");
        void performSearch(selectedApiId, source, searchTerm.trim(), 1);
      } else {
        const activeTrack =
          soundRef.current && currentSongIndex >= 0
            ? musicList[currentSongIndex]
            : null;
        searchRequestIdRef.current += 1;
        setIsSearching(false);
        const filtered = localTracks.filter(
          (track) => track.apiId === selectedApiId && track.source === source,
        );
        if (activeTrack) {
          const existingIndex = filtered.findIndex(
            (track) => track.id === activeTrack.id,
          );
          const nextList = [...filtered];
          const nextIndex = existingIndex >= 0 ? existingIndex : 0;
          if (existingIndex >= 0) {
            nextList[existingIndex] = { ...nextList[existingIndex], ...activeTrack };
          } else {
            nextList.unshift(activeTrack);
          }
          setMusicList(nextList);
          setCurrentSongIndex(nextIndex);
        } else {
          setMusicList(filtered);
          resetPlayer();
        }
        setShowingSearchResults(false);
        setShowTranslation(false);
        setErrorMessage(null);
        setSearchPage(1);
        setSearchPageInput("1");
        setSearchHasMore(false);
        setLastSearchKeyword(null);
      }
    },
    [
      localTracks,
      currentSongIndex,
      musicList,
      performSearch,
      resetPlayer,
      searchTerm,
      selectedApiId,
      selectedSource,
    ],
  );

  useEffect(() => {
    if (selectedBitrate <= 0) return;
    if (currentSongIndex < 0) return;
    if (loadingTrackIndex !== null) return;
    const track = musicList[currentSongIndex];
    if (!track) return;
    if (track.bitrate === selectedBitrate && track.url) return;
    void playSong(currentSongIndex, isPlaying);
  }, [
    currentSongIndex,
    isPlaying,
    loadingTrackIndex,
    musicList,
    playSong,
    selectedBitrate,
  ]);

  // 进度条点击/拖动跳转
  const updateDragProgress = (ratio: number) => {
    const r = Math.max(0, Math.min(1, ratio));
    dragProgressRef.current = r * 100;
    setDragProgress(r * 100);
  };

  const checkDragCancel = (clientX: number, clientY: number): boolean => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return false;
    if (desktopPlayBtnRef.current && desktopPlayBtnRef.current.contains(el))
      return true;
    if (mobilePlayBtnRef.current && mobilePlayBtnRef.current.contains(el))
      return true;
    return false;
  };

  const setDragCancelState = (value: boolean) => {
    isDragCancelRef.current = value;
    setIsDragCancel(value);
  };

  const commitSeek = () => {
    if (isDragCancelRef.current) return;
    const s = soundRef.current;
    if (!s) return;
    const ratio = dragProgressRef.current / 100;
    const dur = s.duration();
    const baseDur =
      dur && Number.isFinite(dur) && dur > 0 ? dur : duration || 0;
    const newTime = ratio * baseDur;
    s.seek(newTime);
    setCurrentTime(newTime);
    setProgress(ratio * 100);
  };

  const getRatioFromEvent = (clientX: number, bar: HTMLElement): number => {
    const rect = bar.getBoundingClientRect();
    let r = (clientX - rect.left) / rect.width;
    if (Number.isNaN(r)) r = 0;
    return Math.max(0, Math.min(1, r));
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingProgressRef.current = true;
    setDragCancelState(false);
    const bar = e.currentTarget;
    progressBarRef.current = bar;
    setIsDraggingProgress(true);
    updateDragProgress(getRatioFromEvent(e.clientX, bar));

    const handleMove = (ev: MouseEvent) => {
      if (!isDraggingProgressRef.current || !progressBarRef.current) return;
      updateDragProgress(getRatioFromEvent(ev.clientX, progressBarRef.current));
      const cancel = checkDragCancel(ev.clientX, ev.clientY);
      if (cancel !== isDragCancelRef.current) setDragCancelState(cancel);
    };
    const handleUp = (ev: MouseEvent) => {
      if (!isDraggingProgressRef.current) return;
      const cancel = checkDragCancel(ev.clientX, ev.clientY);
      isDraggingProgressRef.current = false;
      if (!cancel) {
        commitSeek();
      }
      setIsDraggingProgress(false);
      setDragCancelState(false);
      progressBarRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingProgressRef.current = true;
    setDragCancelState(false);
    const bar = e.currentTarget;
    progressBarRef.current = bar;
    setIsDraggingProgress(true);
    updateDragProgress(getRatioFromEvent(touch.clientX, bar));
  };

  const handleProgressTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingProgressRef.current) return;
    const touch = e.touches[0];
    if (!touch || !progressBarRef.current) return;
    e.preventDefault();
    updateDragProgress(
      getRatioFromEvent(touch.clientX, progressBarRef.current),
    );
    const cancel = checkDragCancel(touch.clientX, touch.clientY);
    if (cancel !== isDragCancelRef.current) setDragCancelState(cancel);
  };

  const handleProgressTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingProgressRef.current) return;
    const touch = e.changedTouches[0];
    const cancel = touch
      ? checkDragCancel(touch.clientX, touch.clientY)
      : isDragCancelRef.current;
    isDraggingProgressRef.current = false;
    if (!cancel) {
      commitSeek();
    }
    setIsDraggingProgress(false);
    setDragCancelState(false);
    progressBarRef.current = null;
  };

  const playRandom = () => {
    if (musicList.length === 0) return;
    let index = Math.floor(Math.random() * musicList.length);
    if (musicList.length > 1 && currentSongIndex >= 0) {
      while (index === currentSongIndex) {
        index = Math.floor(Math.random() * musicList.length);
      }
    }
    void playSong(index);
  };

  const cyclePlaybackMode = () => {
    setPlaybackMode((mode) =>
      mode === "order" ? "single" : mode === "single" ? "shuffle" : "order",
    );
  };

  const isDarkMode =
    themeMode === "dark" || (themeMode === "system" && systemPrefersDark);

  return (
    <div
      className={`relative min-h-screen text-slate-800 dark:text-slate-200${
        performanceMode === "low" ? " low-performance" : ""
      }${isDarkMode ? " dark" : ""}`}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="h-full w-full bg-center bg-cover scale-105 transform transition-opacity duration-700"
          style={{
            backgroundImage: "url('bg/5.jpg')",
            opacity: coverBackground && coverUrl ? 0 : 1,
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: coverBackground && coverUrl ? 1 : 0 }}
        >
          {coverBackground && coverUrl ? (
            <div
              key={coverUrl}
              className="fade-in h-full w-full bg-center bg-cover scale-110 transform blur-3xl"
              style={{ backgroundImage: `url("${coverUrl}")` }}
            />
          ) : null}
        </div>
        <div
          className="absolute inset-0 bg-white/50 dark:bg-slate-900/70 transition-opacity duration-700"
          style={{ opacity: coverBackground && coverUrl ? 0 : 1 }}
        />
        <div
          className="absolute inset-0 bg-black/30 transition-opacity duration-700"
          style={{ opacity: coverBackground && coverUrl ? 1 : 0 }}
        />
      </div>

      <div className="h-screen flex flex-col md:flex-row">
        {/* 移动端：底部小播放器，可展开半屏；桌面端：右侧 1/3 宽 */}
        {/* 左侧/下方：歌曲列表 */}
        <LibraryPanel
          availableSources={
            selectedApiId === "bilibili" ? BILIBILI_SOURCES : GDSTUDIO_SOURCES
          }
          bitrateOptions={BITRATE_OPTIONS}
          currentSongIndex={currentSongIndex}
          errorMessage={errorMessage}
          isPlaying={isPlaying}
          isSearching={isSearching}
          lastSearchKeyword={lastSearchKeyword}
          loadingTrackIndex={loadingTrackIndex}
          musicApis={MUSIC_APIS}
          musicList={musicList}
          playbackHistory={playbackHistory}
          favorites={favorites}
          searchHasMore={searchHasMore}
          searchPage={searchPage}
          searchPageInput={searchPageInput}
          searchResultCount={DEFAULT_SEARCH_COUNT}
          searchTerm={searchTerm}
          selectedApiId={selectedApiId}
          selectedBitrate={selectedBitrate}
          selectedSource={selectedSource}
          performanceMode={performanceMode}
          showingSearchResults={showingSearchResults}
          showingPlaybackHistory={showingPlaybackHistory}
          showingFavorites={showingFavorites}
          onApiChange={handleApiChange}
          onBitrateChange={setSelectedBitrate}
          onClearPlaybackHistory={handleClearPlaybackHistory}
          onDeletePlaybackHistoryTrack={handleDeletePlaybackHistoryTrack}
          onPlayHistoryTrack={handlePlayHistoryTrack}
          onPlayFavoriteTrack={handlePlayFavoriteTrack}
          onPlaySong={(index) => {
            void playSong(index);
          }}
          onSearch={() => {
            void handleSearch();
          }}
          onSearchPageInputChange={setSearchPageInput}
          onSearchPageNext={handleSearchPageNext}
          onSearchPagePrevious={handleSearchPagePrev}
          onSearchPageSubmit={handleSearchPageSubmit}
          onSearchTermChange={setSearchTerm}
          onShowTrackInfo={(track) => {
            void handleShowTrackInfo(track);
          }}
          onSourceChange={handleSourceChange}
          onPerformanceModeChange={handlePerformanceModeChange}
          onThemeModeChange={handleThemeModeChange}
          onCoverBackgroundChange={handleCoverBackgroundChange}
          coverBackground={coverBackground}
          themeMode={themeMode}
          onToggleFavorite={handleToggleFavorite}
          onReorderFavorites={handleReorderFavorites}
          onTogglePlaybackHistory={() => {
            setShowingPlaybackHistory((showing) => !showing);
            setShowingFavorites(false);
          }}
          onToggleFavorites={() => {
            setShowingFavorites((showing) => !showing);
            setShowingPlaybackHistory(false);
          }}
        />
        <DesktopPlayer
          currentSong={currentSong}
          coverUrl={coverUrl}
          isPlaying={isPlaying}
          lyricsExpanded={lyricsExpanded}
          hasAnyLyric={hasAnyLyric}
          displayLyricLines={displayLyricLines}
          previewLyricLines={previewLyricLines}
          activeLyricIndex={activeLyricIndex}
          hasTranslationLyric={hasTranslationLyric}
          showTranslation={showTranslation}
          lyricContainerRef={lyricDesktopRef}
          progress={progress}
          dragProgress={dragProgress}
          isDraggingProgress={isDraggingProgress}
          isDragCancel={isDragCancel}
          currentTime={currentTime}
          duration={duration}
          playbackMode={playbackMode}
           playButtonRef={desktopPlayBtnRef}
           volume={volume}
           isFavorite={isCurrentSongFavorite}
           onShowTrackInfo={(track) => {
             void handleShowTrackInfo(track);
           }}
           onToggleFavorite={handleToggleFavorite}
          onToggleTranslation={() =>
            setShowTranslation((previous) => !previous)
          }
          onToggleLyricsExpanded={() =>
            setLyricsExpanded((previous) => !previous)
          }
          onProgressMouseDown={handleProgressMouseDown}
          onProgressTouchStart={handleProgressTouchStart}
          onProgressTouchMove={handleProgressTouchMove}
          onProgressTouchEnd={handleProgressTouchEnd}
          onShuffle={playRandom}
          onPrevious={playPrevious}
          onTogglePlayPause={togglePlayPause}
          onNext={playNext}
          onCyclePlaybackMode={cyclePlaybackMode}
          onVolumeChange={setVolume}
          coverBackground={coverBackground}
        />
        <MobilePlayer
          currentSong={currentSong}
          coverUrl={coverUrl}
          isPlaying={isPlaying}
          mobileExpanded={mobileExpanded}
          lyricsExpanded={lyricsExpanded}
          hasAnyLyric={hasAnyLyric}
          displayLyricLines={displayLyricLines}
          previewLyricLines={previewLyricLines}
          activeLyricIndex={activeLyricIndex}
          hasTranslationLyric={hasTranslationLyric}
          showTranslation={showTranslation}
          lyricContainerRef={lyricMobileRef}
          progress={progress}
          dragProgress={dragProgress}
          isDraggingProgress={isDraggingProgress}
          isDragCancel={isDragCancel}
          currentTime={currentTime}
          duration={duration}
          playbackMode={playbackMode}
           playButtonRef={mobilePlayBtnRef}
           volume={volume}
           isFavorite={isCurrentSongFavorite}
           onSetExpanded={setMobileExpanded}
           onShowTrackInfo={(track) => {
             void handleShowTrackInfo(track);
           }}
           onToggleFavorite={handleToggleFavorite}
          onToggleTranslation={() =>
            setShowTranslation((previous) => !previous)
          }
          onToggleLyricsExpanded={() =>
            setLyricsExpanded((previous) => !previous)
          }
          onProgressMouseDown={handleProgressMouseDown}
          onProgressTouchStart={handleProgressTouchStart}
          onProgressTouchMove={handleProgressTouchMove}
          onProgressTouchEnd={handleProgressTouchEnd}
          onShuffle={playRandom}
          onPrevious={playPrevious}
          onTogglePlayPause={togglePlayPause}
          onNext={playNext}
          onCyclePlaybackMode={cyclePlaybackMode}
          onVolumeChange={setVolume}
          coverBackground={coverBackground}
        />
        {infoModalVisible && (
          <TrackInfoModal
            track={infoModalTrack}
            loading={infoModalLoading}
            error={infoModalError}
            onClose={handleCloseInfoModal}
            onRetry={handleRetryInfo}
          />
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;
