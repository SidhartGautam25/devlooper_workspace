import type { ArticleStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const articleInclude = {
  authors: {
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  },
  techStacks: {
    include: {
      techStack: true,
    },
  },
  relatedFrom: {
    include: {
      related: {
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          heroImageUrl: true,
          status: true,
          publishedAt: true,
        },
      },
    },
  },
} satisfies Prisma.ArticleInclude;

export type ArticleRecord = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

export const ArticleRepository = {
  listAll() {
    return prisma.article.findMany({
      include: articleInclude,
      orderBy: [{ updatedAt: "desc" }],
    });
  },

  listPublished(filters: {
    techStack?: string;
    language?: string;
    query?: string;
    take?: number;
  }) {
    const techStack = filters.techStack?.trim();
    const language = filters.language?.trim();
    const query = filters.query?.trim();

    return prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        ...(language ? { language } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query } },
                { excerpt: { contains: query } },
              ],
            }
          : {}),
        ...(techStack
          ? {
              techStacks: {
                some: {
                  techStack: {
                    OR: [{ slug: techStack }, { name: techStack }],
                  },
                },
              },
            }
          : {}),
      },
      include: articleInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: filters.take ?? 50,
    });
  },

  findById(id: string) {
    return prisma.article.findUnique({
      where: { id },
      include: articleInclude,
    });
  },

  findBySlug(slug: string) {
    return prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });
  },

  findByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return prisma.article.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
  },

  async create(data: {
    slug: string;
    title: string;
    excerpt: string | null;
    heroImageUrl: string | null;
    language: string | null;
    authorName: string | null;
    content: Prisma.InputJsonValue;
    status: ArticleStatus;
    publishedAt: Date | null;
    techStackIds: string[];
    relatedIds: string[];
  }) {
    return prisma.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        heroImageUrl: data.heroImageUrl,
        language: data.language,
        authorName: data.authorName,
        content: data.content,
        status: data.status,
        publishedAt: data.publishedAt,
        techStacks: {
          create: data.techStackIds.map((techStackId) => ({ techStackId })),
        },
        relatedFrom: {
          create: data.relatedIds.map((relatedId) => ({ relatedId })),
        },
      },
      include: articleInclude,
    });
  },

  async update(
    id: string,
    data: {
      slug: string;
      title: string;
      excerpt: string | null;
      heroImageUrl: string | null;
      language: string | null;
      authorName: string | null;
      content: Prisma.InputJsonValue;
      status: ArticleStatus;
      publishedAt: Date | null;
      techStackIds: string[];
      relatedIds: string[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.articleTechStack.deleteMany({ where: { articleId: id } });
      await tx.articleRelation.deleteMany({ where: { articleId: id } });

      return tx.article.update({
        where: { id },
        data: {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          heroImageUrl: data.heroImageUrl,
          language: data.language,
          authorName: data.authorName,
          content: data.content,
          status: data.status,
          publishedAt: data.publishedAt,
          techStacks: {
            create: data.techStackIds.map((techStackId) => ({ techStackId })),
          },
          relatedFrom: {
            create: data.relatedIds.map((relatedId) => ({ relatedId })),
          },
        },
        include: articleInclude,
      });
    });
  },

  delete(id: string) {
    return prisma.article.delete({ where: { id } });
  },
};
