import type React from "react";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MoreVertical,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import type { CombinedLyricLine, PlaybackMode, Track } from "./types";
import { formatTime } from "./utils";

type MobilePlayerProps = {
  currentSong?: Track;
  coverUrl: string | null;
  isPlaying: boolean;
  mobileExpanded: boolean;
  lyricsExpanded: boolean;
  hasAnyLyric: boolean;
  displayLyricLines: CombinedLyricLine[];
  previewLyricLines: { index: number; line: CombinedLyricLine }[];
  activeLyricIndex: number;
  hasTranslationLyric: boolean;
  showTranslation: boolean;
  lyricContainerRef: React.RefObject<HTMLDivElement>;
  progress: number;
  dragProgress: number;
  isDraggingProgress: boolean;
  isDragCancel: boolean;
  currentTime: number;
  duration: number;
  playbackMode: PlaybackMode;
  playButtonRef: React.RefObject<HTMLButtonElement>;
  volume: number;
  isFavorite: boolean;
  onSetExpanded: (expanded: boolean) => void;
  onShowTrackInfo: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  onToggleTranslation: () => void;
  onToggleLyricsExpanded: () => void;
  onProgressMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onProgressTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onProgressTouchMove: (event: React.TouchEvent<HTMLDivElement>) => void;
  onProgressTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onShuffle: () => void;
  onPrevious: () => void;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onCyclePlaybackMode: () => void;
  onVolumeChange: (volume: number) => void;
};

export function MobilePlayer({
  currentSong,
  coverUrl,
  isPlaying,
  mobileExpanded,
  lyricsExpanded,
  hasAnyLyric,
  displayLyricLines,
  previewLyricLines,
  activeLyricIndex,
  hasTranslationLyric,
  showTranslation,
  lyricContainerRef,
  progress,
  dragProgress,
  isDraggingProgress,
  isDragCancel,
  currentTime,
  duration,
  playbackMode,
  playButtonRef,
  volume,
  isFavorite,
  onSetExpanded,
  onShowTrackInfo,
  onToggleFavorite,
  onToggleTranslation,
  onToggleLyricsExpanded,
  onProgressMouseDown,
  onProgressTouchStart,
  onProgressTouchMove,
  onProgressTouchEnd,
  onShuffle,
  onPrevious,
  onTogglePlayPause,
  onNext,
  onCyclePlaybackMode,
  onVolumeChange,
}: MobilePlayerProps) {
  const coverNodeSmall = (
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center mr-4">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt="cover"
          className="w-full h-full object-cover"
        />
      ) : isPlaying ? (
        <div className="flex space-x-1">
          <div className="w-1 h-4 bg-white animate-pulse"></div>
          <div
            className="w-1 h-4 bg-white animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-1 h-4 bg-white animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      ) : (
        <span className="text-sm font-bold text-white">▶</span>
      )}
    </div>
  );
  return (
    <>
      <div
        className={clsx(
          "md:hidden fixed bottom-0 left-0 right-0 h-20 z-30 bg-white/80 backdrop-blur border-t border-slate-200 flex items-center px-3 transform transition-transform duration-300 ease-in-out",
          mobileExpanded ? "translate-y-full pointer-events-none" : "translate-y-0",
        )}
      >
        <div
          className="flex items-center flex-1 min-w-0"
          onClick={() => onSetExpanded(true)}
        >
          {coverNodeSmall}
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-5 text-slate-900 line-clamp-2 break-words">
              {currentSong?.name ?? "未选择"}
            </p>
            <p className="text-xs text-slate-600 truncate">
              {currentSong?.artist ?? ""}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 pl-3">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onPrevious();
            }}
            className="p-2 text-slate-600 hover:text-slate-900"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onTogglePlayPause();
            }}
            className="p-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full text-white"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            className="p-2 text-slate-600 hover:text-slate-900"
          >
            <SkipForward size={20} />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onSetExpanded(true);
            }}
            className="p-2 text-slate-600 hover:text-slate-900"
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </div>
      {mobileExpanded && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-slate-900/20"
          onClick={() => onSetExpanded(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={clsx(
          "md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur shadow-2xl flex flex-col overflow-hidden rounded-t-2xl transform transition-transform duration-300 ease-in-out",
          mobileExpanded
            ? "translate-y-0 h-[65vh]"
            : "translate-y-full pointer-events-none h-[52vh]",
        )}
      >
        <div
          className={clsx(
            "flex items-center justify-between p-4 border-b border-slate-200/70",
            lyricsExpanded && "hidden",
          )}
        >
          <div className="flex items-center">
            {coverNodeSmall}
            <div className="min-w-0">
              <p className="font-bold text-base leading-5 text-slate-900 line-clamp-2 break-words">
                {currentSong?.name ?? "未选择"}
              </p>
              <p className="text-sm text-slate-600 truncate">{currentSong?.artist ?? ""}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-slate-600">
            <button
              type="button"
              aria-label={isFavorite ? "取消收藏" : "收藏"}
              onClick={() => {
                if (currentSong) onToggleFavorite(currentSong);
              }}
              disabled={!currentSong}
              className={clsx(
                "p-2 transition-colors disabled:opacity-40",
                isFavorite
                  ? "text-red-500 hover:text-red-600"
                  : "hover:text-slate-800",
              )}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => {
                if (currentSong) onShowTrackInfo(currentSong);
              }}
              className="p-2 hover:text-slate-800 transition-colors disabled:opacity-40"
              disabled={!currentSong}
            >
              <MoreVertical size={20} />
            </button>
            <button
              onClick={() => {
                if (currentSong?.url) window.open(currentSong.url, "_blank");
              }}
              className="p-2 hover:text-slate-800 transition-colors disabled:opacity-50"
              disabled={!currentSong?.url}
            >
              <Share size={20} />
            </button>
            <button
              onClick={() => onSetExpanded(false)}
              className="p-2 hover:text-slate-800"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 w-full flex flex-col">
            {hasAnyLyric ? <div className={clsx("w-full", lyricsExpanded && "flex-1 flex flex-col")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-600">歌词</span>
                <div className="flex items-center space-x-2">
                  {hasTranslationLyric && <button type="button" onClick={onToggleTranslation} className="text-xs px-2 py-1 rounded-md border border-sky-400 text-sky-600 hover:bg-sky-50 transition-colors">{showTranslation ? "查看原文" : "查看翻译"}</button>}
                  <button type="button" onClick={onToggleLyricsExpanded} className="text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-white/70 transition-colors">{lyricsExpanded ? "收起歌词" : "展开歌词"}</button>
                </div>
              </div>
              {lyricsExpanded ? <div ref={lyricContainerRef} className="flex-1 min-h-[8rem] overflow-y-auto max-h-[calc(100vh-24rem)] custom-scrollbar bg-white/70 border border-slate-200 rounded-xl p-3">
                {displayLyricLines.length > 0 ? displayLyricLines.map((line, index) => { const isActive = index === activeLyricIndex; return <div key={`lyric-mobile-combined-${index}`} data-lyric-key={`${currentSong?.id ?? "unknown"}-combined-${Number.isFinite(line.time) ? line.time.toFixed(3) : `idx-${index}`}`} className="py-1 flex items-start gap-2"><div className="flex-1 min-w-0"><p className={clsx("leading-relaxed transition-all duration-200 ease-out", isActive ? "text-sky-600 font-bold text-base opacity-100" : "text-slate-700 text-sm opacity-70")}>{line.original}</p>{line.translation ? <p className={clsx("leading-relaxed transition-all duration-200 ease-out", isActive ? "text-sky-500 font-semibold text-sm mt-0.5 opacity-100" : "text-slate-500 text-xs mt-0.5 opacity-70")}>{line.translation}</p> : null}</div>{Number.isFinite(line.time) ? <span className="text-[10px] text-slate-400 flex-shrink-0 pt-1 select-none">{formatTime(line.time)}</span> : null}</div>; }) : <p className="text-sm text-slate-500">暂无歌词</p>}
              </div> : <div className="bg-white/70 border border-slate-200 rounded-xl p-3">{previewLyricLines.length > 0 ? previewLyricLines.map(({ index, line }) => { const isActive = index === activeLyricIndex; return <div key={`lyric-preview-mobile-combined-${index}`} className="py-0.5"><p className={clsx("leading-relaxed text-center transition-all", isActive ? "text-sky-600 font-semibold text-base" : "text-slate-600 text-sm")}>{line.original}</p>{line.translation ? <p className={clsx("leading-relaxed text-center transition-all", isActive ? "text-sky-500 font-medium text-sm mt-0.5" : "text-slate-500 text-xs mt-0.5")}>{line.translation}</p> : null}</div>; }) : <p className="text-sm text-slate-500">暂无歌词</p>}</div>}
            </div> : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-slate-500">暂无歌词</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="h-2 bg-slate-300 rounded-full cursor-pointer group overflow-hidden select-none touch-none" onMouseDown={onProgressMouseDown} onTouchStart={onProgressTouchStart} onTouchMove={onProgressTouchMove} onTouchEnd={onProgressTouchEnd}><div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full relative" style={{ width: `${isDraggingProgress ? dragProgress : progress}%` }}><div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" /></div></div><div className="flex justify-between text-xs text-slate-600 mt-2"><span>{formatTime(isDraggingProgress ? (dragProgress / 100) * (duration || 0) : currentTime)}</span><span>{formatTime(duration)}</span></div>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4"><button onClick={onShuffle} className="p-2 text-slate-600 hover:text-slate-900"><Shuffle size={20} /></button><button onClick={onPrevious} className="p-2 text-slate-600 hover:text-slate-900"><SkipBack size={24} /></button><button ref={playButtonRef} onClick={onTogglePlayPause} className={clsx("p-3 rounded-full text-white transition-all duration-200", isDraggingProgress && isDragCancel ? "bg-gradient-to-r from-red-500 to-rose-600 scale-110" : "bg-gradient-to-r from-sky-400 to-blue-500")}>{isDraggingProgress && isDragCancel ? <X size={24} /> : isPlaying ? <Pause size={24} /> : <Play size={24} />}</button><button onClick={onNext} className="p-2 text-slate-600 hover:text-slate-900"><SkipForward size={24} /></button><button onClick={onCyclePlaybackMode} className={clsx("p-2", playbackMode === "order" ? "text-slate-600 hover:text-slate-900" : "text-sky-600 ring-1 ring-sky-400 rounded-full")}>{playbackMode === "single" ? <Repeat1 size={20} /> : playbackMode === "shuffle" ? <Shuffle size={20} /> : <Repeat size={20} />}</button></div>
          <div className="flex items-center justify-center space-x-3 mt-3"><Volume2 size={20} className="text-slate-600" /><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => onVolumeChange(Number.parseFloat(event.target.value))} className="w-32 h-1 bg-slate-300 rounded-full appearance-none cursor-pointer slider hover:bg-slate-400 transition-colors" /></div>
        </div>
      </div>
    </>
  );
}
