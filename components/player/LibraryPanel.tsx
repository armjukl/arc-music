import React from "react";
import clsx from "clsx";
import { Check, Monitor, Moon, Settings, Sun } from "lucide-react";
import type { MusicApiId } from "../../api";
import type { MusicSource } from "../../data/localTracks";
import { SearchBar } from "./SearchBar";
import { TrackList } from "./TrackList";
import type {
  BitrateOption,
  FavoriteTrack,
  PlaybackHistoryTrack,
  Track,
} from "./types";

type SourceOption = {
  value: MusicSource;
  label: string;
};

type LibraryPanelProps = {
  availableSources: SourceOption[];
  bitrateOptions: readonly BitrateOption[];
  currentSongIndex: number;
  errorMessage: string | null;
  isPlaying: boolean;
  isSearching: boolean;
  lastSearchKeyword: string | null;
  loadingTrackIndex: number | null;
  musicApis: readonly { id: MusicApiId; label: string }[];
  musicList: Track[];
  playbackHistory: PlaybackHistoryTrack[];
  favorites: FavoriteTrack[];
  searchHasMore: boolean;
  searchPage: number;
  searchPageInput: string;
  searchResultCount: number;
  searchTerm: string;
  selectedApiId: MusicApiId;
  selectedBitrate: BitrateOption;
  selectedSource: MusicSource;
  performanceMode: "normal" | "low";
  themeMode: "light" | "dark" | "system";
  coverBackground: boolean;
  showingSearchResults: boolean;
  showingPlaybackHistory: boolean;
  showingFavorites: boolean;
  onApiChange: (apiId: MusicApiId) => void;
  onBitrateChange: (bitrate: BitrateOption) => void;
  onClearPlaybackHistory: () => void;
  onDeletePlaybackHistoryTrack: (track: PlaybackHistoryTrack) => void;
  onPlayHistoryTrack: (track: PlaybackHistoryTrack, index: number) => void;
  onPlayFavoriteTrack: (track: FavoriteTrack, index: number) => void;
  onPlaySong: (index: number) => void;
  onSearch: () => void;
  onSearchPageInputChange: (value: string) => void;
  onSearchPageNext: () => void;
  onSearchPagePrevious: () => void;
  onSearchPageSubmit: () => void;
  onSearchTermChange: (value: string) => void;
  onShowTrackInfo: (track: Track) => void;
  onSourceChange: (source: MusicSource) => void;
  onPerformanceModeChange: (mode: "normal" | "low") => void;
  onThemeModeChange: (mode: "light" | "dark" | "system") => void;
  onCoverBackgroundChange: (enabled: boolean) => void;
  onToggleFavorite: (track: Track) => void;
  onReorderFavorites: (fromIndex: number, toIndex: number) => void;
  onTogglePlaybackHistory: () => void;
  onToggleFavorites: () => void;
};

export function LibraryPanel({
  availableSources,
  bitrateOptions,
  currentSongIndex,
  errorMessage,
  isPlaying,
  isSearching,
  lastSearchKeyword,
  loadingTrackIndex,
  musicApis,
  musicList,
  playbackHistory,
  favorites,
  searchHasMore,
  searchPage,
  searchPageInput,
  searchResultCount,
  searchTerm,
  selectedApiId,
  selectedBitrate,
  selectedSource,
  performanceMode,
  themeMode,
  coverBackground,
  showingSearchResults,
  showingPlaybackHistory,
  showingFavorites,
  onApiChange,
  onBitrateChange,
  onClearPlaybackHistory,
  onDeletePlaybackHistoryTrack,
  onPlayHistoryTrack,
  onPlayFavoriteTrack,
  onPlaySong,
  onSearch,
  onSearchPageInputChange,
  onSearchPageNext,
  onSearchPagePrevious,
  onSearchPageSubmit,
  onSearchTermChange,
  onShowTrackInfo,
  onSourceChange,
  onPerformanceModeChange,
  onThemeModeChange,
  onCoverBackgroundChange,
  onToggleFavorite,
  onReorderFavorites,
  onTogglePlaybackHistory,
  onToggleFavorites,
}: LibraryPanelProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState<{
    left: number;
    top: number;
  } | null>(null);
  const settingsButtonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!settingsOpen) {
      setDropdownPosition(null);
      return;
    }
    const button = settingsButtonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const dropdownWidth = 288;
    const left = Math.max(
      8,
      Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 8),
    );
    const top = rect.bottom + 8;
    setDropdownPosition({ left, top });
  }, [settingsOpen]);

  return (
    <div className={clsx("flex-1 flex flex-col overflow-hidden md:w-2/3 md:border-r", coverBackground ? "md:bg-transparent md:border-transparent" : "md:border-slate-200/70 md:bg-white/40 md:dark:bg-slate-900/50 md:dark:border-slate-700/70")}>
      <div className="relative z-[100] px-4 py-3 md:px-8 md:py-4 border-b border-slate-200/70 dark:border-slate-700/70 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
            Arc-music
          </h1>
          <button
            ref={settingsButtonRef}
            type="button"
            title="设置"
            aria-label="设置"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Settings size={20} />
          </button>
        </div>
        {settingsOpen && dropdownPosition && (
          <div
            role="dialog"
            aria-label="设置"
            className="fixed z-[100] mt-2 w-72 max-h-[80vh] overflow-y-auto custom-scrollbar rounded-lg border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            style={{ left: dropdownPosition.left, top: dropdownPosition.top }}
          >
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              主题模式
            </p>
            <div
              role="radiogroup"
              aria-label="主题模式"
              className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {([
                ["light", "日间"],
                ["dark", "夜间"],
                ["system", "跟随系统"],
              ] as const).map(([mode, label]) => {
                const selected = themeMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onThemeModeChange(mode)}
                    className={`flex h-9 items-center justify-center gap-1 text-sm transition-colors ${
                      selected
                        ? "bg-sky-500 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {mode === "light" ? (
                      <Sun size={14} />
                    ) : mode === "dark" ? (
                      <Moon size={14} />
                    ) : (
                      <Monitor size={14} />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              跟随系统会随着设备外观自动切换日间/夜间模式。
            </p>
            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                封面毛玻璃背景
              </p>
              <div
                role="radiogroup"
                aria-label="封面毛玻璃背景"
                className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {([
                  [false, "关闭"],
                  [true, "开启"],
                ] as const).map(([enabled, label]) => {
                  const selected = coverBackground === enabled;
                  return (
                    <button
                      key={String(enabled)}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onCoverBackgroundChange(enabled)}
                      className={`flex h-9 items-center justify-center gap-1 text-sm transition-colors ${
                        selected
                          ? "bg-sky-500 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {enabled && <Check size={14} />}
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                开启后，播放歌曲时会将封面作为背景并模糊处理，形成毛玻璃效果。
              </p>
            </div>
            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                性能模式
              </p>
              <div
                role="radiogroup"
                aria-label="性能模式"
                className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {([
                  ["normal", "正常"],
                  ["low", "低性能"],
                ] as const).map(([mode, label]) => {
                  const selected = performanceMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onPerformanceModeChange(mode)}
                      className={`flex h-9 items-center justify-center gap-1 text-sm transition-colors ${
                        selected
                          ? "bg-sky-500 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {selected && <Check size={14} />}
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                低性能模式会关闭非必要动画和歌词平滑滚动。
              </p>
            </div>
          </div>
        )}
      </div>

      <SearchBar
        availableSources={availableSources}
        bitrateOptions={bitrateOptions}
        errorMessage={errorMessage}
        isSearching={isSearching}
        musicApis={musicApis}
        searchTerm={searchTerm}
        selectedApiId={selectedApiId}
        selectedBitrate={selectedBitrate}
        selectedSource={selectedSource}
        showingPlaybackHistory={showingPlaybackHistory}
        showingFavorites={showingFavorites}
        coverBackground={coverBackground}
        onApiChange={onApiChange}
        onBitrateChange={onBitrateChange}
        onSearch={onSearch}
        onSearchTermChange={onSearchTermChange}
        onSourceChange={onSourceChange}
        onTogglePlaybackHistory={onTogglePlaybackHistory}
        onToggleFavorites={onToggleFavorites}
      />

      <TrackList
        currentSongIndex={currentSongIndex}
        errorMessage={errorMessage}
        isPlaying={isPlaying}
        isSearching={isSearching}
        lastSearchKeyword={lastSearchKeyword}
        loadingTrackIndex={loadingTrackIndex}
        musicList={musicList}
        playbackHistory={playbackHistory}
        favorites={favorites}
        coverBackground={coverBackground}
        searchHasMore={searchHasMore}
        searchPage={searchPage}
        searchPageInput={searchPageInput}
        searchResultCount={searchResultCount}
        showingSearchResults={showingSearchResults}
        showingPlaybackHistory={showingPlaybackHistory}
        showingFavorites={showingFavorites}
        onClearPlaybackHistory={onClearPlaybackHistory}
        onDeletePlaybackHistoryTrack={onDeletePlaybackHistoryTrack}
        onPlayHistoryTrack={onPlayHistoryTrack}
        onPlayFavoriteTrack={onPlayFavoriteTrack}
        onPlaySong={onPlaySong}
        onSearchPageInputChange={onSearchPageInputChange}
        onSearchPageNext={onSearchPageNext}
        onSearchPagePrevious={onSearchPagePrevious}
        onSearchPageSubmit={onSearchPageSubmit}
        onShowTrackInfo={onShowTrackInfo}
        onToggleFavorite={onToggleFavorite}
        onReorderFavorites={onReorderFavorites}
        onTogglePlaybackHistory={onTogglePlaybackHistory}
        onToggleFavorites={onToggleFavorites}
      />
    </div>
  );
}
