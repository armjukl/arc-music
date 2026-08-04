import React, { useState } from "react";
import clsx from "clsx";
import { Search, SlidersHorizontal } from "lucide-react";
import type { MusicApiId } from "../../api";
import type { MusicSource } from "../../data/localTracks";
import type { BitrateOption } from "./types";

type SourceOption = {
  value: MusicSource;
  label: string;
};

type SearchBarProps = {
  availableSources: SourceOption[];
  bitrateOptions: readonly BitrateOption[];
  errorMessage: string | null;
  isSearching: boolean;
  musicApis: readonly { id: MusicApiId; label: string }[];
  searchTerm: string;
  selectedApiId: MusicApiId;
  selectedBitrate: BitrateOption;
  selectedSource: MusicSource;
  showingPlaybackHistory: boolean;
  showingFavorites: boolean;
  onApiChange: (apiId: MusicApiId) => void;
  onBitrateChange: (bitrate: BitrateOption) => void;
  onSearch: () => void;
  onSearchTermChange: (value: string) => void;
  onSourceChange: (source: MusicSource) => void;
  onTogglePlaybackHistory: () => void;
  onToggleFavorites: () => void;
};

export function SearchBar({
  availableSources,
  bitrateOptions,
  errorMessage,
  isSearching,
  musicApis,
  searchTerm,
  selectedApiId,
  selectedBitrate,
  selectedSource,
  showingPlaybackHistory,
  showingFavorites,
  onApiChange,
  onBitrateChange,
  onSearch,
  onSearchTermChange,
  onSourceChange,
  onTogglePlaybackHistory,
  onToggleFavorites,
}: SearchBarProps) {
  // 移动端筛选区默认收起，桌面端始终展开
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  return (
    <div className="p-4 md:px-8 md:py-5 border-b border-slate-200/60 dark:border-slate-700/60 shrink-0">
      <div
        className={clsx(
          "flex-wrap items-center gap-3 mb-3",
          filtersExpanded ? "flex" : "hidden md:flex",
        )}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">API</span>
          <select
            value={selectedApiId}
            onChange={(e) => onApiChange(e.target.value as MusicApiId)}
            className="px-3 py-1 rounded-lg border border-slate-300 bg-white/70 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200"
          >
            {musicApis.map((api) => (
              <option key={api.id} value={api.id}>
                {api.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onTogglePlaybackHistory}
          className={clsx(
            "px-3 py-1 rounded-lg border text-sm transition-colors",
            showingPlaybackHistory
              ? "border-sky-500 bg-sky-500 text-white"
              : "border-slate-300 bg-white/70 text-slate-600 hover:bg-white/60 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700/60",
          )}
        >
          播放历史
        </button>
        <button
          type="button"
          onClick={onToggleFavorites}
          className={clsx(
            "px-3 py-1 rounded-lg border text-sm transition-colors",
            showingFavorites
              ? "border-sky-500 bg-sky-500 text-white"
              : "border-slate-300 bg-white/70 text-slate-600 hover:bg-white/60 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700/60",
          )}
        >
          收藏列表
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">音源</span>
          <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white/70 dark:border-slate-600 dark:bg-slate-800/70">
            {availableSources.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onSourceChange(value)}
                className={clsx(
                  "px-3 py-1 text-sm transition-colors",
                  selectedSource === value
                    ? "bg-sky-500 text-white"
                    : "text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-700/60",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">音质</span>
          <select
            value={selectedBitrate}
            onChange={(e) =>
              onBitrateChange(Number(e.target.value) as BitrateOption)
            }
            className="px-3 py-1 rounded-lg border border-slate-300 bg-white/70 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200"
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
          className="flex-1 px-3 py-1.5 md:py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/70 text-slate-800 placeholder-slate-500 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200 dark:placeholder-slate-400"
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={isSearching}
          aria-label="搜索"
          className={clsx(
            "px-3 py-1 md:py-2 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:shadow-md inline-flex items-center justify-center",
            isSearching && "opacity-80 cursor-not-allowed",
          )}
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </button>
        <button
          type="button"
          onClick={() => setFiltersExpanded((expanded) => !expanded)}
          aria-label={filtersExpanded ? "收起筛选" : "展开筛选"}
          className={clsx(
            "md:hidden px-3 py-1 rounded-lg border inline-flex items-center justify-center transition-colors",
            filtersExpanded
              ? "border-sky-500 bg-sky-500 text-white"
              : "border-slate-300 bg-white/70 text-slate-600 hover:bg-white/60 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700/60",
          )}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>
      {errorMessage && (
        <div className="mt-2 text-sm text-red-500">{errorMessage}</div>
      )}
    </div>
  );
}
