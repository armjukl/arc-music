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

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const requestId = Math.random().toString(36).slice(2, 8);

  try {
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

    console.info(
      `[music-hub:${requestId}] ${request.method ?? "GET"} ${target.pathname}${target.search}`,
    );

    const headers: Record<string, string> = {};
    for (const headerName of FORWARDED_REQUEST_HEADERS) {
      const value = request.headers[headerName];
      if (typeof value === "string") headers[headerName] = value;
    }

    const method = request.method ?? "GET";
    const hasBody = method !== "GET" && method !== "HEAD";
    const upstreamResponse = await fetch(target, {
      method,
      headers,
      redirect: "manual",
      ...(hasBody
        ? {
            body: request as unknown as BodyInit,
            duplex: "half" as const,
          }
        : {}),
    });

    response.statusCode = upstreamResponse.status;
    console.info(
      `[music-hub:${requestId}] upstream=${upstreamResponse.status} content-type=${upstreamResponse.headers.get("content-type") ?? "-"} content-range=${upstreamResponse.headers.get("content-range") ?? "-"}`,
    );
    for (const headerName of FORWARDED_RESPONSE_HEADERS) {
      const value = upstreamResponse.headers.get(headerName);
      if (value !== null) response.setHeader(headerName, value);
    }

    if (method === "HEAD" || !upstreamResponse.body) {
      response.end();
      return;
    }

    const body = await upstreamResponse.arrayBuffer();
    response.send(Buffer.from(body));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[music-hub:${requestId}] error=${message}`);
    if (response.headersSent) {
      response.end();
      return;
    }
    response.status(502).json({ detail: `Music API Hub request failed: ${message}` });
  }
}
