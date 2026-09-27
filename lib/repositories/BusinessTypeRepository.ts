import { prisma } from "@/lib/db";

export const BusinessTypeRepository = {
  listAll() {
    return prisma.businessType.findMany({
      orderBy: [{ name: "asc" }],
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
  },

  findById(id: string) {
    return prisma.businessType.findUnique({
      where: { id },
    });
  },

  findByName(name: string) {
    return prisma.businessType.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
      },
    });
  },

  create(name: string) {
    return prisma.businessType.create({
      data: {
        name: name.trim(),
      },
    });
  },

  delete(id: string) {
    return prisma.businessType.delete({
      where: { id },
    });
  },
};
