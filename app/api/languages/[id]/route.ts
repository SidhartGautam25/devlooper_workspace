import { LanguageController } from "@/lib/controllers/LanguageController";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  return LanguageController.remove(id);
}
