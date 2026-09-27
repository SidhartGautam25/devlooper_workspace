import { Role } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { LanguageRepository } from "@/lib/repositories/LanguageRepository";
import type { CurrentUser } from "@/lib/types";

export const LanguageService = {
  async listLanguages(currentUser: CurrentUser) {
    if (!currentUser.id) {
      throw new ForbiddenError("Authentication required");
    }
    return LanguageRepository.listAll();
  },

  async createLanguage(currentUser: CurrentUser, rawName: string) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can create languages");
    }

    const name = rawName?.trim();
    if (!name) {
      throw new BadRequestError("Language name is required");
    }

    if (name.length > 50) {
      throw new BadRequestError("Language name cannot exceed 50 characters");
    }

    const existing = await LanguageRepository.findByName(name);
    if (existing) {
      throw new BadRequestError(`Language "${name}" already exists`);
    }

    return LanguageRepository.create(name);
  },

  async deleteLanguage(currentUser: CurrentUser, id: string) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can delete languages");
    }

    const existing = await LanguageRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Language not found");
    }

    await LanguageRepository.delete(id);
    return { id, deleted: true };
  },
};
