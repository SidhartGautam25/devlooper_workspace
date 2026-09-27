import { RegionController } from "@/lib/controllers/RegionController";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  return RegionController.remove(id);
}
