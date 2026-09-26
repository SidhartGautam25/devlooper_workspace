import { TaskController } from "@/lib/controllers/TaskController";

export function GET() {
  return TaskController.list();
}

export function POST(request: Request) {
  return TaskController.create(request);
}
