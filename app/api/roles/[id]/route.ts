import { EmployeeRoleController } from "@/lib/controllers/EmployeeRoleController";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  return EmployeeRoleController.remove(id);
}
