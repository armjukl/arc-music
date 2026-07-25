"use client";

import { getMusicApi } from "../../api";
import type { MusicSource } from "../../data/localTracks";
import type { Track } from "./types";
import { formatBitrateLabel, formatFileSizeLabel } from "./utils";

type TrackInfoModalProps = {
  track: Track | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
};

const SOURCE_LABELS: { value: MusicSource; label: string }[] = [
  { value: "netease", label: "网易云" },
  { value: "kuwo", label: "酷我" },
  { value: "joox", label: "JOOX" },
];

export function TrackInfoModal({
  track,
  loading,
  error,
  onClose,
  onRetry,
}: TrackInfoModalProps) {
  const api = track ? getMusicApi(track.apiId) : null;
  const sourceLabel = track
    ? (SOURCE_LABELS.find((item) => item.value === track.source)?.label ??
      track.source)
    : "";
  const lyricId = track?.lyricId ?? track?.trackId;
  const lyricLink =
    track && api && lyricId
      ? api.buildResourceUrl("lyric", { source: track.source, id: lyricId })
      : null;
  const coverLink = track?.cover
    ? track.cover
    : track?.picId
      ? (api?.buildResourceUrl("pic", {
          source: track.source,
          id: track.picId,
          size: "300",
        }) ?? null)
      : null;
  const durationLabel =
    track?.duration && track.duration.trim() ? track.duration : "未知";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          关闭
        </button>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">歌曲信息</h3>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="space-y-4 text-sm text-slate-600">
            <p>{error}</p>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onRetry}
                className="px-3 py-1.5 rounded-md bg-sky-500 text-white text-xs hover:bg-sky-600 transition-colors"
              >
                重试
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-white"
              >
                关闭
              </button>
            </div>
          </div>
        ) : track ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p>歌名：{track.name}</p>
            <p>歌手：{track.artist || "未知"}</p>
            <p>专辑：{track.album || "未知"}</p>
            <p>时长：{durationLabel}</p>
            <p>
              来源：{sourceLabel}
              {sourceLabel && sourceLabel !== track.source
                ? `（${track.source}）`
                : ""}
            </p>
            <p>歌曲ID：{track.trackId ?? "未知"}</p>
            <p>文件大小：{formatFileSizeLabel(track.fileSizeKb)}</p>
            <p>播放音质：{formatBitrateLabel(track.bitrate)}</p>
            <div className="space-y-1">
              <p>
                歌词链接：
                {lyricLink ? (
                  <a
                    className="text-sky-600 hover:underline"
                    href={lyricLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    点击下载
                  </a>
                ) : (
                  "暂无"
                )}
              </p>
              <p>
                封面链接：
                {coverLink ? (
                  <a
                    className="text-sky-600 hover:underline"
                    href={coverLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    查看封面
                  </a>
                ) : (
                  "暂无"
                )}
              </p>
              <p>
                歌曲链接：
                {track.url ? (
                  <a
                    className="text-sky-600 hover:underline break-all"
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {track.url}
                  </a>
                ) : (
                  "暂无"
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">暂无歌曲信息</p>
        )}
      </div>
    </div>
  );
}
