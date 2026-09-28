import { prisma } from "@/lib/db";

export const TechStackRepository = {
  listAll() {
    return prisma.techStack.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { articles: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.techStack.findUnique({ where: { id } });
  },

  findBySlug(slug: string) {
    return prisma.techStack.findUnique({ where: { slug } });
  },

  findByName(name: string) {
    return prisma.techStack.findUnique({ where: { name } });
  },

  create(data: { name: string; slug: string }) {
    return prisma.techStack.create({ data });
  },

  delete(id: string) {
    return prisma.techStack.delete({ where: { id } });
  },
};
