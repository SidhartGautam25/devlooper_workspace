import { LanguageController } from "@/lib/controllers/LanguageController";

export function GET() {
  return LanguageController.list();
}

export function POST(request: Request) {
  return LanguageController.create(request);
}
