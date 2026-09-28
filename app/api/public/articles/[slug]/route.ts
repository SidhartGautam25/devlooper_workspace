import {
  PublicArticleController,
  publicArticlesOptions,
} from "@/lib/controllers/PublicArticleController";

export function OPTIONS(request: Request) {
  return publicArticlesOptions(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return PublicArticleController.getBySlug(request, slug);
}
