import { LeadController } from "@/lib/controllers/LeadController";
import { applyCors, corsPreflight } from "@/lib/http/cors";

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  return applyCors(request, await LeadController.list(request));
}

export async function POST(request: Request) {
  return applyCors(request, await LeadController.create(request));
}
