import { LeadController } from "@/lib/controllers/LeadController";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return LeadController.update(request, id);
}
