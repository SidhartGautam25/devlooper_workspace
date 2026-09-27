import type { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const taskInclude = {
  assignedTo: {
    select: { id: true, name: true, email: true, role: true },
  },
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  businessType: {
    select: { id: true, name: true },
  },
  language: {
    select: { id: true, name: true },
  },
  region: {
    select: { id: true, name: true },
  },
  taskGroup: {
    select: { id: true, name: true },
  },
} satisfies Prisma.TaskInclude;

export const TaskRepository = {
  listAll() {
    return prisma.task.findMany({
      include: taskInclude,
      orderBy: [{ createdAt: "desc" }],
    });
  },

  listByAssignee(employeeId: string) {
    return prisma.task.findMany({
      where: { assignedToId: employeeId },
      include: taskInclude,
      orderBy: [{ createdAt: "desc" }],
    });
  },

  findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });
  },

  create(data: Prisma.TaskCreateInput) {
    return prisma.task.create({
      data,
      include: taskInclude,
    });
  },

  update(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
  },

  updateStatus(id: string, status: TaskStatus) {
    return prisma.task.update({
      where: { id },
      data: { status },
      include: taskInclude,
    });
  },

  delete(id: string) {
    return prisma.task.delete({ where: { id } });
  },

  count(where?: Prisma.TaskWhereInput) {
    return prisma.task.count({ where });
  },
};
