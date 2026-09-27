import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const taskGroupInclude = {
  businessType: {
    select: { id: true, name: true },
  },
  language: {
    select: { id: true, name: true },
  },
  region: {
    select: { id: true, name: true },
  },
  assignedTo: {
    select: { id: true, name: true, email: true, role: true },
  },
  _count: {
    select: { tasks: true },
  },
} satisfies Prisma.TaskGroupInclude;

export const TaskGroupRepository = {
  listAll() {
    return prisma.taskGroup.findMany({
      include: taskGroupInclude,
      orderBy: [{ name: "asc" }],
    });
  },

  findById(id: string) {
    return prisma.taskGroup.findUnique({
      where: { id },
      include: taskGroupInclude,
    });
  },

  findByName(name: string) {
    return prisma.taskGroup.findUnique({
      where: { name: name.trim() },
      include: taskGroupInclude,
    });
  },

  create(data: Prisma.TaskGroupCreateInput) {
    return prisma.taskGroup.create({
      data,
      include: taskGroupInclude,
    });
  },

  update(id: string, data: Prisma.TaskGroupUpdateInput) {
    return prisma.taskGroup.update({
      where: { id },
      data,
      include: taskGroupInclude,
    });
  },

  delete(id: string) {
    return prisma.taskGroup.delete({
      where: { id },
    });
  },
};
