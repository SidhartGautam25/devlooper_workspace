import { Role } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { RegionRepository } from "@/lib/repositories/RegionRepository";
import type { CurrentUser } from "@/lib/types";

export const RegionService = {
  async listRegions(currentUser: CurrentUser) {
    if (!currentUser.id) {
      throw new ForbiddenError("Authentication required");
    }
    return RegionRepository.listAll();
  },

  async createRegion(currentUser: CurrentUser, rawName: string) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can create regions");
    }

    const name = rawName?.trim();
    if (!name) {
      throw new BadRequestError("Region name is required");
    }

    if (name.length > 50) {
      throw new BadRequestError("Region name cannot exceed 50 characters");
    }

    const existing = await RegionRepository.findByName(name);
    if (existing) {
      throw new BadRequestError(`Region "${name}" already exists`);
    }

    return RegionRepository.create(name);
  },

  async deleteRegion(currentUser: CurrentUser, id: string) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can delete regions");
    }

    const existing = await RegionRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Region not found");
    }

    await RegionRepository.delete(id);
    return { id, deleted: true };
  },
};
