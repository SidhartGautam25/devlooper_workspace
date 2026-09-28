import { TechStackController } from "@/lib/controllers/TechStackController";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return TechStackController.remove(id);
}
