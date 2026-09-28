import { ArticleController } from "@/lib/controllers/ArticleController";

export function GET() {
  return ArticleController.list();
}

export function POST(request: Request) {
  return ArticleController.create(request);
}
