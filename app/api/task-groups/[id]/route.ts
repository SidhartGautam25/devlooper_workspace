import { TaskGroupController } from "@/lib/controllers/TaskGroupController";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  return TaskGroupController.update(request, id);
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  return TaskGroupController.remove(id);
}
