import { Heart, MoreVertical, Search } from "lucide-react";
import type { MusicApiId } from "../../api";
import type { MusicSource } from "../../data/localTracks";
import type { BitrateOption, Track } from "./types";

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
  searchHasMore: boolean;
  searchPage: number;
  searchPageInput: string;
  searchResultCount: number;
  searchTerm: string;
  selectedApiId: MusicApiId;
  selectedBitrate: BitrateOption;
  selectedSource: MusicSource;
  showingSearchResults: boolean;
  onApiChange: (apiId: MusicApiId) => void;
  onBitrateChange: (bitrate: BitrateOption) => void;
  onPlaySong: (index: number) => void;
  onSearch: () => void;
  onSearchPageInputChange: (value: string) => void;
  onSearchPageNext: () => void;
  onSearchPagePrevious: () => void;
  onSearchPageSubmit: () => void;
  onSearchTermChange: (value: string) => void;
  onShowTrackInfo: (track: Track) => void;
  onSourceChange: (source: MusicSource) => void;
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
  searchHasMore,
  searchPage,
  searchPageInput,
  searchResultCount,
  searchTerm,
  selectedApiId,
  selectedBitrate,
  selectedSource,
  showingSearchResults,
  onApiChange,
  onBitrateChange,
  onPlaySong,
  onSearch,
  onSearchPageInputChange,
  onSearchPageNext,
  onSearchPagePrevious,
  onSearchPageSubmit,
  onSearchTermChange,
  onShowTrackInfo,
  onSourceChange,
}: LibraryPanelProps) {
  return (
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
              onChange={(e) => onApiChange(e.target.value as MusicApiId)}
              className="px-3 py-1 rounded-lg border border-slate-300 bg-white/70 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {musicApis.map((api) => (
                <option key={api.id} value={api.id}>
                  {api.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-600">音源</span>
            <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white/70">
              {availableSources.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSourceChange(value)}
                  className={`px-3 py-1 text-sm transition-colors ${selectedSource === value ? "bg-sky-500 text-white" : "text-slate-600 hover:bg-white/60"}`}
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
              onChange={(e) =>
                onBitrateChange(Number(e.target.value) as BitrateOption)
              }
              className="px-3 py-1 rounded-lg border border-slate-300 bg-white/70 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {bitrateOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >{`${option} kbps${option >= 740 ? " (无损)" : ""}`}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearch();
              }
            }}
            placeholder="搜索歌曲/歌手/专辑"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/70 text-slate-800 placeholder-slate-500"
          />
          <button
            type="button"
            onClick={onSearch}
            disabled={isSearching}
            className={`px-4 py-2 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:shadow-md inline-flex items-center justify-center ${isSearching ? "opacity-80 cursor-not-allowed" : ""}`}
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
                onClick={onSearchPagePrevious}
                className={`px-3 py-1 rounded-md border text-xs transition-colors ${isSearching || !lastSearchKeyword || searchPage <= 1 ? "text-slate-400 border-slate-200 cursor-not-allowed" : "text-slate-600 border-slate-300 hover:bg-white"}`}
                disabled={isSearching || !lastSearchKeyword || searchPage <= 1}
              >
                上一页
              </button>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min={1}
                  value={searchPageInput}
                  onChange={(e) => onSearchPageInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSearchPageSubmit();
                    }
                  }}
                  className="w-16 px-2 py-1 rounded-md border border-slate-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                  disabled={!lastSearchKeyword}
                />
                <button
                  onClick={onSearchPageSubmit}
                  className={`px-3 py-1 rounded-md border text-xs transition-colors ${isSearching || !lastSearchKeyword ? "text-slate-400 border-slate-200 cursor-not-allowed" : "text-slate-600 border-slate-300 hover:bg-white"}`}
                  disabled={isSearching || !lastSearchKeyword}
                >
                  跳转
                </button>
              </div>
              <button
                onClick={onSearchPageNext}
                className={`px-3 py-1 rounded-md border text-xs transition-colors ${isSearching || !lastSearchKeyword || !searchHasMore ? "text-slate-400 border-slate-200 cursor-not-allowed" : "text-slate-600 border-slate-300 hover:bg-white"}`}
                disabled={isSearching || !lastSearchKeyword || !searchHasMore}
              >
                下一页
              </button>
              <span className="text-xs text-slate-500">第 {searchPage} 页</span>
            </div>
            <span className="text-xs text-slate-400">
              每页 {searchResultCount} 条
            </span>
          </div>
        )}
        {musicList.length === 0 && (
          <div className="text-slate-600 text-sm">
            {showingSearchResults
              ? (errorMessage ?? "未找到匹配的歌曲")
              : "暂无音乐，请检查本地曲目配置。"}
          </div>
        )}
        {musicList.map((song, index) => (
          <div
            key={song.id}
            className={`
            group flex items-center p-4 rounded-2xl mb-3 cursor-pointer
            transition-all duration-300 transform hover:scale-[1.01]
            ${index === currentSongIndex ? "bg-white/60 shadow-md" : "hover:bg-white/50"}
          `}
            onClick={() => onPlaySong(index)}
          >
            <div
              className={`
              relative w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4
              transition-all duration-300
              ${index === currentSongIndex ? "shadow-md" : "group-hover:shadow-sm"}
            `}
            >
              <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                {loadingTrackIndex === index ? (
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                ) : index === currentSongIndex && isPlaying ? (
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-white animate-pulse" />
                    <div
                      className="w-1 h-3 bg-white animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-1 h-3 bg-white animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-white">
                    {index + 1}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold truncate ${index === currentSongIndex ? "text-slate-900" : "text-slate-700"}`}
              >
                {song.name}
              </p>
              <p className="text-sm text-slate-500 truncate">
                {song.artist ?? ""}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowTrackInfo(song);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-slate-600 transition-all duration-300"
              >
                <MoreVertical size={16} />
              </button>
              <button className="opacity-0 group-hover:opacity-100 hover:text-sky-600 transition-all duration-300">
                <Heart size={16} />
              </button>
              <span className="text-sm text-slate-500">
                {song.duration ?? ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
