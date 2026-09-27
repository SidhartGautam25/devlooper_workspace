import { EmployeeController } from "@/lib/controllers/EmployeeController";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  return EmployeeController.update(request, id);
}
