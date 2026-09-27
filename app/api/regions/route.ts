import { RegionController } from "@/lib/controllers/RegionController";

export function GET() {
  return RegionController.list();
}

export function POST(request: Request) {
  return RegionController.create(request);
}
