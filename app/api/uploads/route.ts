import { UploadController } from "@/lib/controllers/UploadController";
import { applyCors, corsPreflight } from "@/lib/http/cors";

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  return applyCors(request, await UploadController.upload(request));
}

export async function DELETE(request: Request) {
  return applyCors(request, await UploadController.delete(request));
}
