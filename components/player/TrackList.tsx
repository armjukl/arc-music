import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { GripVertical, Heart, MoreVertical, Trash2 } from "lucide-react";
import type { FavoriteTrack, PlaybackHistoryTrack, Track } from "./types";

type TrackListProps = {
  currentSongIndex: number;
  errorMessage: string | null;
  isPlaying: boolean;
  isSearching: boolean;
  lastSearchKeyword: string | null;
  loadingTrackIndex: number | null;
  musicList: Track[];
  playbackHistory: PlaybackHistoryTrack[];
  favorites: FavoriteTrack[];
  searchHasMore: boolean;
  searchPage: number;
  searchPageInput: string;
  searchResultCount: number;
  showingSearchResults: boolean;
  showingPlaybackHistory: boolean;
  showingFavorites: boolean;
  onClearPlaybackHistory: () => void;
  onDeletePlaybackHistoryTrack: (track: PlaybackHistoryTrack) => void;
  onPlayHistoryTrack: (track: PlaybackHistoryTrack, index: number) => void;
  onPlayFavoriteTrack: (track: FavoriteTrack, index: number) => void;
  onPlaySong: (index: number) => void;
  onSearchPageInputChange: (value: string) => void;
  onSearchPageNext: () => void;
  onSearchPagePrevious: () => void;
  onSearchPageSubmit: () => void;
  onShowTrackInfo: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  onReorderFavorites: (fromIndex: number, toIndex: number) => void;
  onTogglePlaybackHistory: () => void;
  onToggleFavorites: () => void;
};

export function TrackList({
  currentSongIndex,
  errorMessage,
  isPlaying,
  isSearching,
  lastSearchKeyword,
  loadingTrackIndex,
  musicList,
  playbackHistory,
  favorites,
  searchHasMore,
  searchPage,
  searchPageInput,
  searchResultCount,
  showingSearchResults,
  showingPlaybackHistory,
  showingFavorites,
  onClearPlaybackHistory,
  onDeletePlaybackHistoryTrack,
  onPlayHistoryTrack,
  onPlayFavoriteTrack,
  onPlaySong,
  onSearchPageInputChange,
  onSearchPageNext,
  onSearchPagePrevious,
  onSearchPageSubmit,
  onShowTrackInfo,
  onToggleFavorite,
  onReorderFavorites,
  onTogglePlaybackHistory,
  onToggleFavorites,
}: TrackListProps) {
  const favoriteDragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggedFavoriteIndexRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const [draggedFavoriteIndex, setDraggedFavoriteIndex] = useState<number | null>(null);
  const displayedTracks = showingFavorites
    ? favorites
    : showingPlaybackHistory
      ? playbackHistory
      : musicList;
  const isFavorite = (track: Track | PlaybackHistoryTrack | FavoriteTrack) =>
    favorites.some(
      (favorite) =>
        favorite.id === track.id &&
        favorite.apiId === track.apiId &&
        favorite.source === track.source,
    );

  const clearFavoriteDrag = () => {
    if (favoriteDragTimerRef.current !== null) {
      clearTimeout(favoriteDragTimerRef.current);
      favoriteDragTimerRef.current = null;
    }
    draggedFavoriteIndexRef.current = null;
    dragPointerIdRef.current = null;
    dragStartPositionRef.current = null;
    dragCleanupRef.current?.();
    dragCleanupRef.current = null;
    setDraggedFavoriteIndex(null);
  };

  useEffect(() => clearFavoriteDrag, []);

  const handleFavoriteDragStart = (
    event: React.PointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dragPointerIdRef.current = event.pointerId;
    dragStartPositionRef.current = { x: event.clientX, y: event.clientY };
    favoriteDragTimerRef.current = setTimeout(() => {
      draggedFavoriteIndexRef.current = index;
      setDraggedFavoriteIndex(index);
      favoriteDragTimerRef.current = null;
    }, 300);

    const handleMove = (moveEvent: PointerEvent) => {
      if (dragPointerIdRef.current !== moveEvent.pointerId) return;

      if (draggedFavoriteIndexRef.current === null) {
        const start = dragStartPositionRef.current;
        if (start && Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y) > 8) {
          clearFavoriteDrag();
        }
        return;
      }

      const fromIndex = draggedFavoriteIndexRef.current;
      const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-favorite-index]"));
      const target = rows.reduce<HTMLElement | null>((closest, row) => {
        const rowBounds = row.getBoundingClientRect();
        const rowCenter = rowBounds.top + rowBounds.height / 2;
        if (!closest) return row;
        const closestBounds = closest.getBoundingClientRect();
        const closestCenter = closestBounds.top + closestBounds.height / 2;
        return Math.abs(rowCenter - moveEvent.clientY) < Math.abs(closestCenter - moveEvent.clientY)
          ? row
          : closest;
      }, null);
      const toIndex = target ? Number(target.dataset.favoriteIndex) : -1;
      if (toIndex < 0 || toIndex === fromIndex) return;
      onReorderFavorites(fromIndex, toIndex);
      draggedFavoriteIndexRef.current = toIndex;
      setDraggedFavoriteIndex(toIndex);
    };

    const handleEnd = (endEvent: PointerEvent) => {
      if (dragPointerIdRef.current === endEvent.pointerId) clearFavoriteDrag();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    dragCleanupRef.current = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0">
      {showingPlaybackHistory ? (
        <div className="flex flex-wrap items-center justify-between mb-3 pr-2 text-sm text-slate-600">
          <span>播放历史</span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onTogglePlaybackHistory}
              className="px-3 py-1 rounded-md border border-slate-300 text-xs text-slate-600 transition-colors hover:bg-white"
            >
              返回曲库
            </button>
            <button
              type="button"
              onClick={onClearPlaybackHistory}
              className="px-3 py-1 rounded-md border border-slate-300 text-xs text-slate-600 transition-colors hover:bg-white"
            >
              清空历史
            </button>
          </div>
        </div>
      ) : showingFavorites ? (
        <div className="flex flex-wrap items-center justify-between mb-3 pr-2 text-sm text-slate-600">
          <span>收藏列表</span>
          <button
            type="button"
            onClick={onToggleFavorites}
            className="px-3 py-1 rounded-md border border-slate-300 text-xs text-slate-600 transition-colors hover:bg-white"
          >
            返回曲库
          </button>
        </div>
      ) : showingSearchResults && (
        <div className="flex flex-wrap items-center justify-between mb-3 pr-2 text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <span>页码</span>
            <button
              onClick={onSearchPagePrevious}
              className={clsx(
                "px-3 py-1 rounded-md border text-xs transition-colors",
                isSearching || !lastSearchKeyword || searchPage <= 1
                  ? "text-slate-400 border-slate-200 cursor-not-allowed"
                  : "text-slate-600 border-slate-300 hover:bg-white",
              )}
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
                className={clsx(
                  "px-3 py-1 rounded-md border text-xs transition-colors",
                  isSearching || !lastSearchKeyword
                    ? "text-slate-400 border-slate-200 cursor-not-allowed"
                    : "text-slate-600 border-slate-300 hover:bg-white",
                )}
                disabled={isSearching || !lastSearchKeyword}
              >
                跳转
              </button>
            </div>
            <button
              onClick={onSearchPageNext}
              className={clsx(
                "px-3 py-1 rounded-md border text-xs transition-colors",
                isSearching || !lastSearchKeyword || !searchHasMore
                  ? "text-slate-400 border-slate-200 cursor-not-allowed"
                  : "text-slate-600 border-slate-300 hover:bg-white",
              )}
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
      {displayedTracks.length === 0 && (
        <div className="text-slate-600 text-sm">
          {showingFavorites
            ? "暂无收藏"
            : showingPlaybackHistory
            ? "暂无播放历史"
            : showingSearchResults
            ? (errorMessage ?? "未找到匹配的歌曲")
            : "暂无音乐，请检查本地曲目配置。"}
        </div>
      )}
      {displayedTracks.map((song, index) => {
        const isCurrentSong =
          !showingPlaybackHistory && !showingFavorites && index === currentSongIndex;
        const isBilibiliSearchResult =
          showingSearchResults && song.apiId === "bilibili";
        return (
          <div
            key={`${song.apiId}-${song.source}-${song.id}-${song.trackId ?? ""}-${song.picId ?? ""}-${song.lyricId ?? ""}`}
            data-favorite-index={showingFavorites ? index : undefined}
            className={clsx(
              "group flex items-center p-4 rounded-2xl mb-3 cursor-pointer transition-all duration-300 ease-out transform hover:scale-[1.01]",
              isCurrentSong ? "bg-white/60 shadow-md" : "hover:bg-white/50",
              showingFavorites &&
                index === draggedFavoriteIndex &&
                "scale-[1.02] bg-sky-50/80 shadow-lg ring-1 ring-sky-300/60",
            )}
            onClick={() =>
              showingFavorites
                ? onPlayFavoriteTrack(song, index)
                : showingPlaybackHistory
                ? onPlayHistoryTrack(song, index)
                : onPlaySong(index)
            }
          >
            {showingFavorites && (
              <button
                type="button"
                aria-label={`拖动排序 ${song.name}`}
                onPointerDown={(event) => handleFavoriteDragStart(event, index)}
                onClick={(event) => event.stopPropagation()}
                onContextMenu={(event) => event.preventDefault()}
                className="mr-2 touch-none cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing"
              >
                <GripVertical size={18} />
              </button>
            )}
            <div
              className={clsx(
                "relative w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mr-4 transition-all duration-300",
                isCurrentSong ? "shadow-md" : "group-hover:shadow-sm",
              )}
            >
              <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                {loadingTrackIndex === index ? (
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                ) : isCurrentSong && isPlaying ? (
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
                className={clsx(
                  "font-semibold text-sm leading-5 line-clamp-2 break-words md:text-base md:leading-normal md:line-clamp-1 md:truncate",
                  isCurrentSong ? "text-slate-900" : "text-slate-700",
                )}
              >
                {song.name}
              </p>
              {!isBilibiliSearchResult && (
                <p className="text-sm text-slate-500 truncate">
                  {song.artist ?? ""}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {showingPlaybackHistory && (
                <button
                  type="button"
                  aria-label={`删除 ${song.name} 的播放历史`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeletePlaybackHistoryTrack(song);
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowTrackInfo(song);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-slate-600 transition-all duration-300"
              >
                <MoreVertical size={16} />
              </button>
              <button
                type="button"
                aria-label={`${isFavorite(song) ? "取消收藏" : "收藏"} ${song.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite(song);
                }}
                className={clsx(
                  "opacity-0 group-hover:opacity-100 transition-all duration-300",
                  isFavorite(song)
                    ? "text-red-500 opacity-100 hover:text-red-600"
                    : "hover:text-sky-600",
                )}
              >
                <Heart
                  size={16}
                  fill={isFavorite(song) ? "currentColor" : "none"}
                />
              </button>
              {!isBilibiliSearchResult && (
                <span className="text-sm text-slate-500">
                  {song.duration ?? ""}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
