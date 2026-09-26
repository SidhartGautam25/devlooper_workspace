import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const leadInclude = {
  assignedTo: {
    select: { id: true, name: true, email: true, role: true, isActive: true },
  },
} satisfies Prisma.LeadInclude;

export const LeadRepository = {
  listAll() {
    return prisma.lead.findMany({
      include: leadInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  listByAssignee(employeeId: string) {
    return prisma.lead.findMany({
      where: { assignedToId: employeeId },
      include: leadInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.lead.findUnique({
      where: { id },
      include: leadInclude,
    });
  },

  create(data: Prisma.LeadCreateInput) {
    return prisma.lead.create({
      data,
      include: leadInclude,
    });
  },

  update(id: string, data: Prisma.LeadUpdateInput) {
    return prisma.lead.update({
      where: { id },
      data,
      include: leadInclude,
    });
  },

  count(where?: Prisma.LeadWhereInput) {
    return prisma.lead.count({ where });
  },
};
