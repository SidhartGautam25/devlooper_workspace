import { EmployeeController } from "@/lib/controllers/EmployeeController";

export function GET() {
  return EmployeeController.list();
}

export function POST(request: Request) {
  return EmployeeController.create(request);
}
