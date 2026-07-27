import http from "node:http";
import type { NextApiRequest, NextApiResponse } from "next";

const MUSIC_API_HUB_BASE = "http://154.36.187.103:8787";
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "if-none-match",
  "if-modified-since",
  "range",
  "user-agent",
] as const;
const FORWARDED_RESPONSE_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
] as const;

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    responseLimit: false,
  },
};

function queryValues(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value === undefined ? [] : [value];
}

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse,
): void {
  const pathParts = queryValues(request.query.path);
  if (pathParts.length === 0) {
    response.status(400).json({ detail: "Missing Music API Hub path" });
    return;
  }

  const target = new URL(
    pathParts.map((part) => encodeURIComponent(part)).join("/"),
    `${MUSIC_API_HUB_BASE}/`,
  );
  for (const [key, value] of Object.entries(request.query)) {
    if (key === "path") continue;
    for (const item of queryValues(value)) {
      target.searchParams.append(key, item);
    }
  }

  const requestId = Math.random().toString(36).slice(2, 8);
  console.info(
    `[music-hub:${requestId}] ${request.method ?? "GET"} ${target.pathname}${target.search}`,
  );

  const headers: Record<string, string> = {};
  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers[headerName];
    if (typeof value === "string") headers[headerName] = value;
  }

  const upstreamRequest = http.request(
    target,
    {
      method: request.method ?? "GET",
      headers,
    },
    (upstreamResponse) => {
      response.statusCode = upstreamResponse.statusCode ?? 502;
      console.info(
        `[music-hub:${requestId}] upstream=${response.statusCode} content-type=${upstreamResponse.headers["content-type"] ?? "-"} content-range=${upstreamResponse.headers["content-range"] ?? "-"}`,
      );
      for (const headerName of FORWARDED_RESPONSE_HEADERS) {
        const value = upstreamResponse.headers[headerName];
        if (typeof value === "string") response.setHeader(headerName, value);
      }
      upstreamResponse.pipe(response);
    },
  );

  upstreamRequest.on("error", (error) => {
    console.error(`[music-hub:${requestId}] error=${error.message}`);
    if (response.headersSent) {
      response.end();
      return;
    }
    response.status(502).json({
      detail: `Music API Hub 请求失败：${error.message}`,
    });
  });
  request.on("aborted", () => upstreamRequest.destroy());

  if (request.method === "GET" || request.method === "HEAD") {
    upstreamRequest.end();
  } else {
    request.pipe(upstreamRequest);
  }
}
