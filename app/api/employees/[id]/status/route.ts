import { EmployeeController } from "@/lib/controllers/EmployeeController";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return EmployeeController.toggleStatus(request, id);
}
