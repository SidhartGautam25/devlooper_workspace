import { prisma } from "@/lib/db";

export const LanguageRepository = {
  listAll() {
    return prisma.language.findMany({
      orderBy: [{ name: "asc" }],
      include: {
        _count: {
          select: { tasks: true, employees: true },
        },
      },
    });
  },

  findById(id: string) {
    return prisma.language.findUnique({
      where: { id },
    });
  },

  findByName(name: string) {
    return prisma.language.findUnique({
      where: {
        name: name.trim(),
      },
    });
  },

  create(name: string) {
    return prisma.language.create({
      data: {
        name: name.trim(),
      },
    });
  },

  delete(id: string) {
    return prisma.language.delete({
      where: { id },
    });
  },
};
