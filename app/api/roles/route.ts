import { EmployeeRoleController } from "@/lib/controllers/EmployeeRoleController";

export function GET() {
  return EmployeeRoleController.list();
}

export function POST(request: Request) {
  return EmployeeRoleController.create(request);
}
