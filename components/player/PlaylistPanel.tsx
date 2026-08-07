import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { ListMusic, Plus, Trash2, X } from "lucide-react";
import type { SavedPlaylist } from "./types";

type PlaylistPanelProps = {
  playlists: SavedPlaylist[];
  loading: boolean;
  error: string | null;
  onAdd: (type: "netease" | "bilibili", input: string) => Promise<boolean>;
  onDelete: (playlist: SavedPlaylist) => void;
  onOpen: (playlist: SavedPlaylist) => void;
  onBack: () => void;
};

type AddType = "netease" | "bilibili";

function formatPlayCount(value?: number): string {
  if (!value || value <= 0) return "";
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return String(value);
}

export function PlaylistPanel({
  playlists,
  loading,
  error,
  onAdd,
  onDelete,
  onOpen,
  onBack,
}: PlaylistPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const [addType, setAddType] = useState<AddType>("netease");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    setModalError(null);
  }, [modalInput, addType]);

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setModalError(null);
  };

  const handleConfirm = async () => {
    if (!modalInput.trim() || submitting) return;
    setSubmitting(true);
    setModalError(null);
    const ok = await onAdd(addType, modalInput);
    setSubmitting(false);
    if (ok) {
      setModalOpen(false);
      setModalInput("");
    } else {
      setModalError(error ?? "添加歌单失败，请稍后重试");
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pt-4 md:pt-5 pb-52 md:pb-0 px-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between mb-3 pr-2 text-sm text-slate-600 dark:text-slate-300">
        <span>歌单列表</span>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1 rounded-md border border-slate-300 text-xs text-slate-600 transition-colors hover:bg-white dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          返回曲库
        </button>
      </div>

      {!modalOpen && error && (
        <div className="mb-4 text-sm text-red-500">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(playlist)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen(playlist);
              }
            }}
            className="group relative cursor-pointer select-none"
          >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-sky-400/40 to-blue-500/40">
              {playlist.cover ? (
                <img
                  src={playlist.cover}
                  alt={playlist.name}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ListMusic size={32} className="text-white/70" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              {typeof playlist.trackCount === "number" && (
                <span className="absolute bottom-1.5 right-2 text-[11px] text-white/90 drop-shadow">
                  {playlist.trackCount}首
                </span>
              )}
              <button
                type="button"
                aria-label={`删除歌单 ${playlist.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(playlist);
                }}
                className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p
              className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300 leading-5 line-clamp-1"
              title={playlist.name}
            >
              {playlist.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {[playlist.creatorName, formatPlayCount(playlist.playCount)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        ))}

        {/* 添加歌单大方块 */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setModalOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setModalOpen(true);
            }
          }}
          className="group cursor-pointer select-none"
        >
          <div className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-800/40 transition-colors group-hover:border-sky-400 group-hover:text-sky-500">
            <Plus size={32} />
            <span className="text-sm">添加歌单</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 mt-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
          正在加载…
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                添加歌单
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="关闭"
                className="text-slate-400 hover:text-slate-600 transition-colors dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              歌单类型
            </label>
            <div
              role="radiogroup"
              aria-label="歌单类型"
              className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600 mb-4"
            >
              {([
                ["netease", "网易云歌单"],
                ["bilibili", "Bilibili 收藏夹"],
              ] as const).map(([type, label]) => {
                const selected = addType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAddType(type)}
                    className={`flex h-9 items-center justify-center gap-1 text-sm transition-colors ${
                      selected
                        ? "bg-sky-500 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              {addType === "bilibili"
                ? "Bilibili 收藏夹链接或 media_id"
                : "网易云歌单链接或ID"}
            </label>
            <input
              type="text"
              value={modalInput}
              onChange={(event) => setModalInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleConfirm();
                }
              }}
              placeholder={
                addType === "bilibili"
                  ? "如 3660145764 或 https://www.bilibili.com/medialist/detail/ml3660145764"
                  : "如 3778678 或 https://music.163.com/#/playlist?id=3778678"
              }
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/70 text-slate-800 placeholder-slate-500 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200 dark:placeholder-slate-400"
            />
            {modalError && (
              <p className="mt-2 text-sm text-red-500">{modalError}</p>
            )}
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 rounded-md border border-slate-300 text-sm text-slate-600 hover:bg-white transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={submitting || !modalInput.trim()}
                className={clsx(
                  "inline-flex items-center gap-1 px-4 py-2 rounded-md bg-gradient-to-r from-sky-400 to-blue-500 text-white text-sm hover:shadow-md transition-shadow",
                  (submitting || !modalInput.trim()) && "opacity-60 cursor-not-allowed",
                )}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                ) : (
                  "确认添加"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
