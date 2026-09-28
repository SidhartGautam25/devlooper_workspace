import { applyCors, corsPreflight } from "@/lib/http/cors";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { ArticleService } from "@/lib/services/ArticleService";
import { TechStackService } from "@/lib/services/TechStackService";

export const PublicArticleController = {
  async list(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const articles = await ArticleService.listPublished({
        techStack: searchParams.get("techStack") ?? undefined,
        language: searchParams.get("language") ?? undefined,
        query: searchParams.get("q") ?? searchParams.get("query") ?? undefined,
      });
      return applyCors(request, jsonSuccess(articles));
    } catch (error) {
      return applyCors(request, handleRouteError(error));
    }
  },

  async getBySlug(request: Request, slug: string) {
    try {
      const article = await ArticleService.getPublishedBySlug(slug);
      return applyCors(request, jsonSuccess(article));
    } catch (error) {
      return applyCors(request, handleRouteError(error));
    }
  },

  async techStacks(request: Request) {
    try {
      const stacks = await TechStackService.listPublic();
      return applyCors(request, jsonSuccess(stacks));
    } catch (error) {
      return applyCors(request, handleRouteError(error));
    }
  },
};

export function publicArticlesOptions(request: Request) {
  return corsPreflight(request);
}
