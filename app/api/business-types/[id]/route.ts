import { BusinessTypeController } from "@/lib/controllers/BusinessTypeController";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  return BusinessTypeController.remove(id);
}
