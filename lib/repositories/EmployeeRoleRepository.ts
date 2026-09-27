import { prisma } from "@/lib/db";

export const EmployeeRoleRepository = {
  listAll() {
    return prisma.employeeRole.findMany({
      orderBy: [{ name: "asc" }],
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  },

  findById(id: string) {
    return prisma.employeeRole.findUnique({
      where: { id },
    });
  },

  findByName(name: string) {
    return prisma.employeeRole.findUnique({
      where: {
        name: name.trim(),
      },
    });
  },

  create(name: string) {
    return prisma.employeeRole.create({
      data: {
        name: name.trim(),
      },
    });
  },

  delete(id: string) {
    return prisma.employeeRole.delete({
      where: { id },
    });
  },
};
