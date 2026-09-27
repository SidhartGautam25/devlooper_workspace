import { BusinessTypeController } from "@/lib/controllers/BusinessTypeController";

export function GET() {
  return BusinessTypeController.list();
}

export function POST(request: Request) {
  return BusinessTypeController.create(request);
}
