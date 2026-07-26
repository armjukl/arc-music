import React from "react";
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
  onToggleFavorite,
  onReorderFavorites,
  onTogglePlaybackHistory,
  onToggleFavorites,
}: LibraryPanelProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 md:w-2/3 md:border-r md:border-slate-200/70 md:bg-white/40">
      <div className="px-4 py-2 md:px-6 md:py-3 border-b border-slate-200/70 shrink-0">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
          Arc-music
        </h1>
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
