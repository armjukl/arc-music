import https from "node:https";
import type { NextApiRequest, NextApiResponse } from "next";

const GDSTUDIO_API_BASE = "https://music-api.gdstudio.xyz/api.php";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    responseLimit: false,
  },
};

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse,
): void {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).end();
    return;
  }

  const target = new URL(GDSTUDIO_API_BASE);
  for (const [key, value] of Object.entries(request.query)) {
    if (typeof value === "string") target.searchParams.set(key, value);
    else if (Array.isArray(value)) {
      value.forEach((item) => target.searchParams.append(key, item));
    }
  }

  const requestId = Math.random().toString(36).slice(2, 8);
  console.info(
    `[gdstudio-api:${requestId}] GET types=${target.searchParams.get("types") ?? "-"} source=${target.searchParams.get("source") ?? "-"} id=${target.searchParams.get("id") ?? "-"}`,
  );

  const upstreamRequest = https.get(target, (upstreamResponse) => {
    response.statusCode = upstreamResponse.statusCode ?? 502;
    console.info(
      `[gdstudio-api:${requestId}] upstream=${response.statusCode} content-type=${upstreamResponse.headers["content-type"] ?? "-"}`,
    );
    const contentType = upstreamResponse.headers["content-type"];
    if (typeof contentType === "string") response.setHeader("Content-Type", contentType);
    upstreamResponse.pipe(response);
  });

  upstreamRequest.on("error", (error) => {
    console.error(`[gdstudio-api:${requestId}] error=${error.message}`);
    if (!response.headersSent) {
      response.status(502).json({ detail: `GDStudio API 请求失败：${error.message}` });
    } else {
      response.end();
    }
  });
  request.on("aborted", () => upstreamRequest.destroy());
}
