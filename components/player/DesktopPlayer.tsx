import type React from "react";
import clsx from "clsx";
import { Heart, MoreVertical, Pause, Play, Repeat, Repeat1, Share, Shuffle, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import type { CombinedLyricLine, PlaybackMode, Track } from "./types";
import { formatDate, formatTime } from "./utils";

type DesktopPlayerProps = {
  currentSong?: Track;
  coverUrl: string | null;
  isPlaying: boolean;
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

export function DesktopPlayer({
  currentSong,
  coverUrl,
  isPlaying,
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
}: DesktopPlayerProps) {
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
  const coverNodeLarge = (
    <div className="w-56 h-56 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-xl transition-transform duration-1000">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt="cover"
          className="w-full h-full object-contain bg-slate-900/10"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-400 flex items-center justify-center">
          <div className="text-white text-center">
            <span className="text-lg font-semibold">专辑封面</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="hidden md:flex md:w-1/3 md:h-full md:flex-col bg-white/60">
      <div className="flex items-center justify-between p-4 border-b border-slate-200/70">
        <div className="flex items-center">
          {coverNodeSmall}
          <div>
            <p className="font-bold text-lg text-slate-900">
              {currentSong?.name ?? "未选择"}
            </p>
            <p className="text-slate-600">{currentSong?.artist ?? ""}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-slate-600">
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
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="flex flex-col items-center w-full max-w-4xl min-h-full justify-center">
          <div className="flex-1 w-full flex flex-col items-center min-h-0">
            {!lyricsExpanded && (
              <div className="flex items-center justify-center w-full mt-2 md:mt-0 mb-4 md:mb-6">
                <div className="flex items-center space-x-4 md:space-x-6">
                  {coverNodeLarge}
                  <div className="text-left max-w-xs">
                    <h2 className="text-2xl font-bold mb-2 text-slate-900">
                      {currentSong?.name ?? "未选择"}
                    </h2>
                    <p className="text-lg text-slate-700 mb-1">
                      {currentSong?.artist ?? ""}
                    </p>
                    {currentSong?.album ? (
                      <p className="text-sm text-slate-500">
                        {currentSong.album}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
            {(hasAnyLyric || currentSong?.publishedAt) && <div className={clsx("w-full max-w-2xl min-h-0", lyricsExpanded ? "flex-1 flex flex-col mt-2 md:mt-4 mb-4 md:mb-6" : "mb-4 md:mb-6")}>
              <div className={clsx("flex items-center justify-between", lyricsExpanded ? "mb-3" : "mb-2")}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600">歌词</span>
                  {currentSong?.publishedAt ? (
                    <span className="text-xs text-slate-400">发布于 {formatDate(currentSong.publishedAt)}</span>
                  ) : null}
                </div>
                <div className="flex items-center space-x-2">
                  {hasTranslationLyric && <button type="button" onClick={onToggleTranslation} className="text-xs px-2 py-1 rounded-md border border-sky-400 text-sky-600 hover:bg-sky-50 transition-colors">{showTranslation ? "隐藏翻译" : "显示翻译"}</button>}
                  <button type="button" onClick={onToggleLyricsExpanded} className="text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-white/70 transition-colors">{lyricsExpanded ? "收起歌词" : "展开歌词"}</button>
                </div>
              </div>
              {lyricsExpanded ? <div ref={lyricContainerRef} className="flex-1 min-h-[8rem] overflow-y-auto max-h-[calc(100vh-22rem)] md:max-h-[calc(100vh-20rem)] custom-scrollbar bg-white/70 border border-slate-200 rounded-xl p-4">
                {displayLyricLines.length > 0 ? displayLyricLines.map((line, index) => {
                  const isActive = index === activeLyricIndex;
                  return <div key={`lyric-desktop-combined-${index}`} data-lyric-key={`${currentSong?.id ?? "unknown"}-combined-${Number.isFinite(line.time) ? line.time.toFixed(3) : `idx-${index}`}`} className="py-1 transition-colors flex items-start gap-3"><div className="flex-1 min-w-0"><p className={clsx("leading-relaxed transition-all duration-200 ease-out", isActive ? "text-sky-600 font-bold text-lg opacity-100" : "text-slate-700 text-base opacity-70")}>{line.original}</p>{line.translation ? <p className={clsx("leading-relaxed transition-all duration-200 ease-out", isActive ? "text-sky-500 font-semibold text-base mt-0.5 opacity-100" : "text-slate-500 text-sm mt-0.5 opacity-70")}>{line.translation}</p> : null}</div>{Number.isFinite(line.time) ? <span className="text-xs text-slate-400 flex-shrink-0 pt-1 select-none">{formatTime(line.time)}</span> : null}</div>;
                }) : <p className="text-sm text-slate-500">暂无歌词</p>}
              </div> : <div className="bg-white/70 border border-slate-200 rounded-xl p-4">{previewLyricLines.length > 0 ? previewLyricLines.map(({ index, line }) => { const isActive = index === activeLyricIndex; return <div key={`lyric-preview-combined-${index}`} className="py-0.5"><p className={clsx("leading-relaxed text-center transition-all", isActive ? "text-sky-600 font-semibold text-lg" : "text-slate-600 text-sm")}>{line.original}</p>{line.translation ? <p className={clsx("leading-relaxed text-center transition-all", isActive ? "text-sky-500 font-medium text-base mt-0.5" : "text-slate-500 text-xs mt-0.5")}>{line.translation}</p> : null}</div>; }) : <p className="text-sm text-slate-500">暂无歌词</p>}</div>}
            </div>}
          </div>
          <div className={clsx("w-full max-w-2xl", lyricsExpanded ? "mb-4 md:mb-6 mt-2 md:mt-4" : "mb-4 md:mb-6")}>
            <div className="h-2 bg-slate-300 rounded-full cursor-pointer group overflow-hidden select-none touch-none" onMouseDown={onProgressMouseDown} onTouchStart={onProgressTouchStart} onTouchMove={onProgressTouchMove} onTouchEnd={onProgressTouchEnd}><div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full relative" style={{ width: `${isDraggingProgress ? dragProgress : progress}%` }}><div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" /></div></div><div className="flex justify-between text-sm text-slate-600 mt-2"><span>{formatTime(isDraggingProgress ? (dragProgress / 100) * (duration || 0) : currentTime)}</span><span>{formatTime(duration)}</span></div>
          </div>
          <div className={clsx("flex items-center justify-center space-x-6", lyricsExpanded ? "mb-3 md:mb-5" : "mb-2 md:mb-6")}><button onClick={onShuffle} className="p-2 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110"><Shuffle size={20} /></button><button onClick={onPrevious} className="p-3 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110"><SkipBack size={24} /></button><button ref={playButtonRef} onClick={onTogglePlayPause} className={clsx("p-4 rounded-full shadow-lg text-white transition-all duration-300 transform hover:scale-110", isDraggingProgress && isDragCancel ? "bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-2xl scale-110" : "bg-gradient-to-r from-sky-400 to-blue-500 hover:shadow-2xl")}>{isDraggingProgress && isDragCancel ? <X size={24} /> : isPlaying ? <Pause size={24} /> : <Play size={24} />}</button><button onClick={onNext} className="p-3 text-slate-600 hover:text-slate-900 transition-all duration-300 transform hover:scale-110"><SkipForward size={24} /></button><button onClick={onCyclePlaybackMode} className={clsx("p-2 transition-all duration-300 transform hover:scale-110", playbackMode === "order" ? "text-slate-600 hover:text-slate-900" : "text-sky-600 ring-1 ring-sky-400 rounded-full")}>{playbackMode === "single" ? <Repeat1 size={20} /> : playbackMode === "shuffle" ? <Shuffle size={20} /> : <Repeat size={20} />}</button></div>
          <div className="flex items-center justify-center space-x-4"><Volume2 size={20} className="text-slate-600" /><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => onVolumeChange(Number.parseFloat(event.target.value))} className="w-32 h-1 bg-slate-300 rounded-full appearance-none cursor-pointer slider hover:bg-slate-400 transition-colors" /></div>
        </div>
      </div>
    </div>
  );
}
