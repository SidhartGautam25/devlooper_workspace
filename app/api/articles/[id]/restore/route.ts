import { ArticleController } from "@/lib/controllers/ArticleController";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return ArticleController.restore(id);
}
