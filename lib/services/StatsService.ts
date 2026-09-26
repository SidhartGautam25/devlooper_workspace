import { Role } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";
import { LeadRepository } from "@/lib/repositories/LeadRepository";
import { TaskRepository } from "@/lib/repositories/TaskRepository";
import { UserRepository } from "@/lib/repositories/UserRepository";
import type { CurrentUser } from "@/lib/types";

export const StatsService = {
  async getOverview(currentUser: CurrentUser) {
    if (currentUser.role === Role.SUPERUSER) {
      const [totalLeads, totalTasks, completedTasks, employeeCount] =
        await Promise.all([
          LeadRepository.count(),
          TaskRepository.count(),
          TaskRepository.count({ status: "COMPLETED" }),
          UserRepository.countByRole(Role.EMPLOYEE),
        ]);

      return { totalLeads, totalTasks, completedTasks, employeeCount };
    }

    if (currentUser.role === Role.EMPLOYEE) {
      const scope = { assignedToId: currentUser.id };
      const [totalLeads, totalTasks, completedTasks] = await Promise.all([
        LeadRepository.count(scope),
        TaskRepository.count(scope),
        TaskRepository.count({ ...scope, status: "COMPLETED" }),
      ]);

      return {
        totalLeads,
        totalTasks,
        completedTasks,
        employeeCount: null,
      };
    }

    throw new ForbiddenError("You cannot view analytics");
  },
};
