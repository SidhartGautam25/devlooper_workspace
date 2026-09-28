import { ArticleStatus, Role } from "@prisma/client";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import {
  buildToc,
  collectImageUrls,
  normalizeContent,
  slugify,
  type ArticleBlock,
} from "@/lib/articles/content";
import {
  ArticleRepository,
  type ArticleRecord,
} from "@/lib/repositories/ArticleRepository";
import { TechStackRepository } from "@/lib/repositories/TechStackRepository";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { storageService } from "@/lib/storage/StorageService";
import type { CurrentUser } from "@/lib/types";

function assertSuperuser(currentUser: CurrentUser) {
  if (currentUser.role !== Role.SUPERUSER) {
    throw new ForbiddenError("Only superusers can manage articles");
  }
}

export type ArticleInput = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  heroImageUrl?: string | null;
  language?: string | null;
  content?: unknown;
  status?: ArticleStatus | "DRAFT" | "PUBLISHED";
  authorName?: string | null;
  techStackIds?: string[];
  relatedIds?: string[];
};

function articleAuthorList(article: ArticleRecord) {
  const named = article.authorName?.trim();
  if (named) return [{ name: named }];
  return article.authors
    .map((entry) => ({ name: entry.user.name }))
    .filter((entry) => entry.name);
}

function toPublicArticle(article: ArticleRecord) {
  const blocks = normalizeContent(article.content);
  const authors = articleAuthorList(article);
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    heroImageUrl: article.heroImageUrl,
    language: article.language,
    authorName: authors[0]?.name ?? null,
    status: article.status,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    authors,
    techStacks: article.techStacks.map((entry) => ({
      id: entry.techStack.id,
      name: entry.techStack.name,
      slug: entry.techStack.slug,
    })),
    relatedArticles: article.relatedFrom
      .filter((entry) => entry.related.status === "PUBLISHED")
      .map((entry) => ({
        id: entry.related.id,
        slug: entry.related.slug,
        title: entry.related.title,
        excerpt: entry.related.excerpt,
        heroImageUrl: entry.related.heroImageUrl,
      })),
    toc: buildToc(blocks),
    content: { blocks },
  };
}

function publicSummary(article: ArticleRecord) {
  const full = toPublicArticle(article);
  return {
    id: full.id,
    slug: full.slug,
    title: full.title,
    excerpt: full.excerpt,
    heroImageUrl: full.heroImageUrl,
    language: full.language,
    authorName: full.authorName,
    status: full.status,
    publishedAt: full.publishedAt,
    createdAt: full.createdAt,
    updatedAt: full.updatedAt,
    authors: full.authors,
    techStacks: full.techStacks,
    relatedArticles: full.relatedArticles,
    toc: full.toc,
  };
}

function toAdminArticle(article: ArticleRecord) {
  const publicArticle = toPublicArticle(article);
  return {
    ...publicArticle,
    relatedIds: article.relatedFrom.map((entry) => entry.related.id),
    relatedArticles: article.relatedFrom.map((entry) => ({
      id: entry.related.id,
      slug: entry.related.slug,
      title: entry.related.title,
      excerpt: entry.related.excerpt,
      heroImageUrl: entry.related.heroImageUrl,
      status: entry.related.status,
    })),
    techStackIds: article.techStacks.map((entry) => entry.techStack.id),
  };
}

async function uniqueSlug(title: string, preferred?: string, excludeId?: string) {
  const base = slugify(preferred || title);
  let slug = base;
  let suffix = 2;
  while (true) {
    const existing = await ArticleRepository.findBySlug(slug);
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function resolveInput(data: ArticleInput, currentUser: CurrentUser, existing?: ArticleRecord) {
  const title = data.title?.trim();
  if (!title) {
    throw new BadRequestError("Title is required");
  }

  const blocks: ArticleBlock[] = normalizeContent(data.content);
  const status =
    data.status === "PUBLISHED" ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT;

  const authorName =
    data.authorName?.trim() ||
    existing?.authorName?.trim() ||
    currentUser.name ||
    null;

  const techStackIds = [...new Set(data.techStackIds?.filter(Boolean) ?? [])];
  const stacks = await Promise.all(
    techStackIds.map((id) => TechStackRepository.findById(id)),
  );
  if (stacks.some((stack) => !stack)) {
    throw new BadRequestError("One or more tech stacks were not found");
  }

  const relatedIds = [...new Set((data.relatedIds ?? []).filter(Boolean))];
  if (existing) {
    const self = relatedIds.indexOf(existing.id);
    if (self >= 0) relatedIds.splice(self, 1);
  }
  const related = await ArticleRepository.findByIds(relatedIds);
  if (related.length !== relatedIds.length) {
    throw new BadRequestError("One or more related article IDs were not found");
  }

  const publishedAt =
    status === ArticleStatus.PUBLISHED
      ? existing?.publishedAt ?? new Date()
      : existing?.publishedAt ?? null;

  return {
    title,
    slug: await uniqueSlug(title, data.slug, existing?.id),
    excerpt: data.excerpt?.trim() || null,
    heroImageUrl: data.heroImageUrl?.trim() || null,
    language: data.language?.trim() || null,
    authorName,
    content: { blocks },
    status,
    publishedAt,
    techStackIds,
    relatedIds,
  };
}

export const ArticleService = {
  async list(currentUser: CurrentUser) {
    assertSuperuser(currentUser);
    const articles = await ArticleRepository.listAll();
    return articles.map(toAdminArticle);
  },

  async listAuthors(currentUser: CurrentUser) {
    assertSuperuser(currentUser);
    return UserRepository.listAuthors();
  },

  async getById(currentUser: CurrentUser, id: string) {
    assertSuperuser(currentUser);
    const article = await ArticleRepository.findById(id);
    if (!article) throw new NotFoundError("Article not found");
    return toAdminArticle(article);
  },

  listPublished(filters: {
    techStack?: string;
    language?: string;
    query?: string;
  }) {
    return ArticleRepository.listPublished(filters).then((articles) =>
      articles.map((article) => publicSummary(article)),
    );
  },

  async getPublishedBySlug(slug: string) {
    const article = await ArticleRepository.findBySlug(slug);
    if (!article || article.status !== ArticleStatus.PUBLISHED) {
      throw new NotFoundError("Article not found");
    }
    return toPublicArticle(article);
  },

  async getPublishedById(id: string) {
    const article = await ArticleRepository.findById(id);
    if (!article || article.status !== ArticleStatus.PUBLISHED) {
      throw new NotFoundError("Article not found");
    }
    return toPublicArticle(article);
  },

  async create(currentUser: CurrentUser, data: ArticleInput) {
    assertSuperuser(currentUser);
    const payload = await resolveInput(data, currentUser);
    const article = await ArticleRepository.create(payload);
    return toAdminArticle(article);
  },

  async update(currentUser: CurrentUser, id: string, data: ArticleInput) {
    assertSuperuser(currentUser);
    const existing = await ArticleRepository.findById(id);
    if (!existing) throw new NotFoundError("Article not found");
    const payload = await resolveInput(data, currentUser, existing);
    const article = await ArticleRepository.update(id, payload);
    return toAdminArticle(article);
  },

  async delete(currentUser: CurrentUser, id: string) {
    assertSuperuser(currentUser);
    const existing = await ArticleRepository.findById(id);
    if (!existing) throw new NotFoundError("Article not found");

    const blocks = normalizeContent(existing.content);
    const urls = collectImageUrls(blocks, existing.heroImageUrl);
    await ArticleRepository.delete(id);
    await Promise.all(urls.map((url) => storageService.deleteFile(url)));
    return { id, deleted: true };
  },
};
