import { prisma } from "@/lib/db";

export const RegionRepository = {
  listAll() {
    return prisma.region.findMany({
      orderBy: [{ name: "asc" }],
      include: {
        _count: {
          select: { tasks: true, employees: true },
        },
      },
    });
  },

  findById(id: string) {
    return prisma.region.findUnique({
      where: { id },
    });
  },

  findByName(name: string) {
    return prisma.region.findUnique({
      where: {
        name: name.trim(),
      },
    });
  },

  create(name: string) {
    return prisma.region.create({
      data: {
        name: name.trim(),
      },
    });
  },

  delete(id: string) {
    return prisma.region.delete({
      where: { id },
    });
  },
};
