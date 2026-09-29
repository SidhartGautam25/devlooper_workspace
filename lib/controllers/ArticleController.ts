import { ArticleStatus } from "@prisma/client";
import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import {
  ArticleService,
  type ArticleInput,
} from "@/lib/services/ArticleService";

function bodyToInput(body: Record<string, unknown>): ArticleInput {
  return {
    title: String(body.title ?? ""),
    slug: typeof body.slug === "string" ? body.slug : undefined,
    excerpt: typeof body.excerpt === "string" ? body.excerpt : null,
    heroImageUrl:
      typeof body.heroImageUrl === "string" ? body.heroImageUrl : null,
    language: typeof body.language === "string" ? body.language : null,
    content: body.content,
    status:
      body.status === ArticleStatus.PUBLISHED || body.status === "PUBLISHED"
        ? ArticleStatus.PUBLISHED
        : ArticleStatus.DRAFT,
    authorName: typeof body.authorName === "string" ? body.authorName : null,
    techStackIds: Array.isArray(body.techStackIds)
      ? body.techStackIds.map(String)
      : undefined,
    relatedIds: Array.isArray(body.relatedIds)
      ? body.relatedIds.map(String)
      : undefined,
  };
}

export const ArticleController = {
  async list(request?: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const url = request ? new URL(request.url) : null;
      const isTrash = url?.searchParams.get("trash") === "true";
      const articles = await ArticleService.list(currentUser, {
        trash: isTrash,
      });
      return jsonSuccess(articles);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async authors() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const authors = await ArticleService.listAuthors(currentUser);
      return jsonSuccess(authors);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async get(id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const article = await ArticleService.getById(currentUser, id);
      return jsonSuccess(article);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as Record<string, unknown>;
      const article = await ArticleService.create(
        currentUser,
        bodyToInput(body),
      );
      return jsonSuccess(article, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async update(request: Request, id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as Record<string, unknown>;
      const article = await ArticleService.update(
        currentUser,
        id,
        bodyToInput(body),
      );
      return jsonSuccess(article);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async remove(request: Request, id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const url = new URL(request.url);
      const typeParam = url.searchParams.get("type");
      const type = typeParam === "hard" ? "hard" : "soft";
      const result = await ArticleService.delete(currentUser, id, { type });
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async restore(id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const result = await ArticleService.restore(currentUser, id);
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
