import { handleAssetRequest } from "@/lib/storage/asset-handler";

export async function OPTIONS(request: Request) {
  return handleAssetRequest(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleAssetRequest(request, path);
}

export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleAssetRequest(request, path);
}
