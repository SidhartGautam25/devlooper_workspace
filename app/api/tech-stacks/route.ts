import { TechStackController } from "@/lib/controllers/TechStackController";

export function GET() {
  return TechStackController.list();
}

export function POST(request: Request) {
  return TechStackController.create(request);
}
