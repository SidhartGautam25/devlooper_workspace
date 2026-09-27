import { Role } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { EmployeeRoleRepository } from "@/lib/repositories/EmployeeRoleRepository";
import type { CurrentUser } from "@/lib/types";

export const EmployeeRoleService = {
  async listRoles(currentUser: CurrentUser) {
    if (!currentUser.id) {
      throw new ForbiddenError("Authentication required");
    }
    return EmployeeRoleRepository.listAll();
  },

  async createRole(currentUser: CurrentUser, rawName: string) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can create roles");
    }

    const name = rawName?.trim();
    if (!name) {
      throw new BadRequestError("Role name is required");
    }

    if (name.length > 50) {
      throw new BadRequestError("Role name cannot exceed 50 characters");
    }

    const existing = await EmployeeRoleRepository.findByName(name);
    if (existing) {
      throw new BadRequestError(`Role "${name}" already exists`);
    }

    return EmployeeRoleRepository.create(name);
  },

  async deleteRole(currentUser: CurrentUser, id: string) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can delete roles");
    }

    const existing = await EmployeeRoleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Role not found");
    }

    await EmployeeRoleRepository.delete(id);
    return { id, deleted: true };
  },
};
