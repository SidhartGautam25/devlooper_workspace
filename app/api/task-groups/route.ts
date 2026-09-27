import { TaskGroupController } from "@/lib/controllers/TaskGroupController";

export function GET() {
  return TaskGroupController.list();
}

export function POST(request: Request) {
  return TaskGroupController.create(request);
}
