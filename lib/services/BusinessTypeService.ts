import { Role } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { BusinessTypeRepository } from "@/lib/repositories/BusinessTypeRepository";
import type { CurrentUser } from "@/lib/types";

export const BusinessTypeService = {
  async listBusinessTypes(currentUser: CurrentUser) {
    if (!currentUser.id) {
      throw new ForbiddenError("Authentication required");
    }
    return BusinessTypeRepository.listAll();
  },

  async createBusinessType(currentUser: CurrentUser, rawName: string) {
    if (currentUser.role !== Role.SUPERUSER && currentUser.role !== Role.EMPLOYEE) {
      throw new ForbiddenError("You must be an employee or superuser to create business types");
    }

    const name = rawName?.trim();
    if (!name) {
      throw new BadRequestError("Business type name is required");
    }

    if (name.length > 50) {
      throw new BadRequestError(
        "Business type name cannot exceed 50 characters",
      );
    }

    const existing = await BusinessTypeRepository.findByName(name);
    if (existing) {
      throw new BadRequestError(`Business type "${name}" already exists`);
    }

    return BusinessTypeRepository.create(name);
  },

  async deleteBusinessType(currentUser: CurrentUser, id: string) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can delete business types");
    }

    const existing = await BusinessTypeRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Business type not found");
    }

    await BusinessTypeRepository.delete(id);
    return { id, deleted: true };
  },
};
