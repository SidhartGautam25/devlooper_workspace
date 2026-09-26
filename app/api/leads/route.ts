import { LeadController } from "@/lib/controllers/LeadController";

export function GET() {
  return LeadController.list();
}

export function POST(request: Request) {
  return LeadController.create(request);
}
