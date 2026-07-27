import http from "node:http";
import https from "node:https";
import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_HOST_SUFFIXES = [".music.126.net", ".music.163.com"];

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    responseLimit: false,
  },
};

function isAllowedAudioUrl(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    ALLOWED_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))
  );
}

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse,
): void {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    response.status(405).end();
    return;
  }

  const rawUrl = request.query.url;
  if (typeof rawUrl !== "string") {
    response.status(400).json({ detail: "Missing GDStudio audio URL" });
    return;
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    response.status(400).json({ detail: "Invalid GDStudio audio URL" });
    return;
  }
  if (!isAllowedAudioUrl(target)) {
    response.status(403).json({ detail: "Audio host is not allowed" });
    return;
  }

  const client = target.protocol === "https:" ? https : http;
  const upstreamRequest = client.get(
    target,
    {
      headers: {
        ...(typeof request.headers.range === "string"
          ? { range: request.headers.range }
          : {}),
        "user-agent": request.headers["user-agent"] ?? "arc-music-audio-proxy",
      },
    },
    (upstreamResponse) => {
      response.statusCode = upstreamResponse.statusCode ?? 502;
      const contentType = upstreamResponse.headers["content-type"];
      response.setHeader(
        "Content-Type",
        typeof contentType === "string" && contentType.startsWith("audio/")
          ? contentType.split(";", 1)[0]
          : "audio/mpeg",
      );
      for (const headerName of [
        "accept-ranges",
        "content-length",
        "content-range",
      ] as const) {
        const value = upstreamResponse.headers[headerName];
        if (typeof value === "string") response.setHeader(headerName, value);
      }
      response.setHeader("Cache-Control", "no-store");
      upstreamResponse.pipe(response);
    },
  );

  upstreamRequest.on("error", (error) => {
    if (response.headersSent) {
      response.end();
      return;
    }
    response.status(502).json({ detail: `GDStudio 音频代理失败：${error.message}` });
  });
  request.on("aborted", () => upstreamRequest.destroy());
}
