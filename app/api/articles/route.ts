import { ArticleController } from "@/lib/controllers/ArticleController";

export function GET(request: Request) {
  return ArticleController.list(request);
}

export function POST(request: Request) {
  return ArticleController.create(request);
}
