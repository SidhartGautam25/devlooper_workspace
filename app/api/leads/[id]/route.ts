import { LeadController } from "@/lib/controllers/LeadController";
import { applyCors, corsPreflight } from "@/lib/http/cors";

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return applyCors(request, await LeadController.update(request, id));
}
