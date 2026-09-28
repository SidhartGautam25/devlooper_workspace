import { NextResponse } from "next/server";
import path from "path";
import { storageService } from "@/lib/storage/StorageService";

export async function handleAssetRequest(
  request: Request,
  pathSegments?: string[],
) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const rawFilename = pathSegments?.[pathSegments.length - 1];
  if (!rawFilename) {
    return new NextResponse("File not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  // Prevent directory traversal attacks
  const filename = path.basename(rawFilename);

  const file = await storageService.downloadFile(filename);
  if (!file) {
    return new NextResponse("File not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const headers = {
    "Content-Type": file.contentType,
    "Content-Length": String(file.buffer.length),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Access-Control-Allow-Origin": "*",
  };

  if (request.method === "HEAD") {
    return new NextResponse(null, {
      status: 200,
      headers,
    });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers,
  });
}
