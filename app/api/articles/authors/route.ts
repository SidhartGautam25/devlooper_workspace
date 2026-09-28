import { ArticleController } from "@/lib/controllers/ArticleController";

export function GET() {
  return ArticleController.authors();
}
