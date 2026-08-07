import type { NextApiRequest, NextApiResponse } from "next";

const YUAFENG_PARSE_API =
  "https://api.yuafeng.cn/API/ly/bilibili_jx.php";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const url = String(request.query.url ?? "").trim();
  if (!url) {
    response.status(400).json({ detail: "缺少 url 参数" });
    return;
  }

  try {
    const apiUrl = new URL(YUAFENG_PARSE_API);
    apiUrl.searchParams.set("url", url);
    const upstream = await fetch(apiUrl, { cache: "no-store" });
    if (!upstream.ok) {
      throw new Error(`解析接口请求失败（HTTP ${upstream.status}）`);
    }
    const body = (await upstream.json()) as {
      code?: number;
      msg?: string;
      data?: { video?: string; title?: string; cover?: string };
    };
    if (body.code !== 0 || !body.data?.video) {
      throw new Error(body.msg || "视频解析失败");
    }
    response.status(200).json({
      code: 0,
      url: body.data.video,
      title: body.data.title ?? "",
      cover: body.data.cover ?? "",
    });
  } catch (error) {
    response.status(502).json({
      detail: error instanceof Error ? error.message : "视频解析失败",
    });
  }
}
