import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export const UserRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  listEmployees() {
    return prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        languageId: true,
        language: {
          select: { id: true, name: true },
        },
        regionId: true,
        region: {
          select: { id: true, name: true },
        },
        createdAt: true,
        _count: {
          select: {
            assignedTasks: true,
            assignedLeads: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  listActiveEmployees() {
    return prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
  },

  countByRole(role: Role) {
    return prisma.user.count({ where: { role } });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  },

  toggleActive(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  },
};
