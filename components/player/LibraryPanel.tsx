import React from "react";
import { Check, Settings } from "lucide-react";
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
  onToggleFavorite,
  onReorderFavorites,
  onTogglePlaybackHistory,
  onToggleFavorites,
}: LibraryPanelProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 md:w-2/3 md:border-r md:border-slate-200/70 md:bg-white/40">
      <div className="relative px-4 py-2 md:px-6 md:py-3 border-b border-slate-200/70 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
            Arc-music
          </h1>
          <button
            type="button"
            title="设置"
            aria-label="设置"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-slate-800"
          >
            <Settings size={20} />
          </button>
        </div>
        {settingsOpen && (
          <div
            role="dialog"
            aria-label="设置"
            className="absolute right-4 top-full z-30 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-lg md:right-6"
          >
            <p className="text-sm font-semibold text-slate-800">性能模式</p>
            <div
              role="radiogroup"
              aria-label="性能模式"
              className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200"
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
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {selected && <Check size={14} />}
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              低性能模式会关闭非必要动画和歌词平滑滚动。
            </p>
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
