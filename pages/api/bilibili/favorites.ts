import type { NextApiRequest, NextApiResponse } from "next";

const BILIBILI_API_ORIGIN = "https://api.bilibili.com";
const FOLDER_INFO_PATH = "/x/v3/fav/folder/info";
const RESOURCE_LIST_PATH = "/x/v3/fav/resource/list";
const PAGE_SIZE = 10;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function biliFetch<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  const url = new URL(path, BILIBILI_API_ORIGIN);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Referer: "https://www.bilibili.com/",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Bilibili API 请求失败（HTTP ${response.status}）`);
  }
  const body = (await response.json()) as { code: number; message?: string; data?: T };
  if (body.code !== 0) {
    throw new Error(body.message ?? "Bilibili API 请求失败");
  }
  return body.data as T;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const mediaId = String(request.query.media_id ?? "").trim();
  const page = Math.max(1, Number.parseInt(String(request.query.page ?? "1"), 10) || 1);
  if (!/^\d+$/.test(mediaId)) {
    response.status(400).json({ detail: "media_id 必须是数字" });
    return;
  }

  try {
    const info = await biliFetch<{
      title?: string;
      cover?: string;
      media_count?: number;
    }>(FOLDER_INFO_PATH, { media_id: mediaId });
    const mediaCount = Number(info?.media_count) || 0;

    const data = await biliFetch<{
      medias?: {
        bvid?: string;
        bv_id?: string;
        type?: number;
        title?: string;
        duration?: number;
        cover?: string;
        upper?: { name?: string };
        ugc?: { first_cid?: number | string };
      }[];
    }>(RESOURCE_LIST_PATH, {
      media_id: mediaId,
      platform: "web",
      pn: page,
      ps: PAGE_SIZE,
    });
    const medias = Array.isArray(data?.medias) ? data.medias : [];
    const tracks: {
      id: string;
      name: string;
      ar: { name: string }[];
      al: { name: string; picUrl?: string };
      dt?: number;
    }[] = [];

    for (const item of medias) {
      if (Number(item?.type) !== 2) continue;
      const bvid = String(item?.bvid || item?.bv_id || "").trim();
      const cid = item?.ugc?.first_cid;
      if (!bvid || cid === undefined || cid === null || cid === "") continue;
      tracks.push({
        id: `${bvid}:${cid}`,
        name: String(item?.title ?? bvid),
        ar: item?.upper?.name ? [{ name: String(item.upper.name) }] : [],
        al: {
          name: "",
          picUrl: item?.cover || undefined,
        },
        dt:
          typeof item?.duration === "number" && item.duration > 0
            ? item.duration * 1000
            : undefined,
      });
    }

    response.status(200).json({
      code: 0,
      playlist: {
        id: mediaId,
        name: info?.title || "Bilibili 收藏夹",
        coverImgUrl: info?.cover || undefined,
        trackCount: mediaCount,
        tracks,
      },
      page,
      hasMore: mediaCount > page * PAGE_SIZE,
    });
  } catch (error) {
    response.status(502).json({
      detail: error instanceof Error ? error.message : "Bilibili API 请求失败",
    });
  }
}
