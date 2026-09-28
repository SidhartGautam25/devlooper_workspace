import { Role } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { TechStackRepository } from "@/lib/repositories/TechStackRepository";
import { slugify } from "@/lib/articles/content";
import type { CurrentUser } from "@/lib/types";

function assertSuperuser(currentUser: CurrentUser) {
  if (currentUser.role !== Role.SUPERUSER) {
    throw new ForbiddenError("Only superusers can manage tech stacks");
  }
}

export const TechStackService = {
  listPublic() {
    return TechStackRepository.listAll();
  },

  async list(currentUser: CurrentUser) {
    if (!currentUser.id) {
      throw new ForbiddenError("Authentication required");
    }
    return TechStackRepository.listAll();
  },

  async create(currentUser: CurrentUser, rawName: string) {
    assertSuperuser(currentUser);
    const name = rawName?.trim();
    if (!name) {
      throw new BadRequestError("Tech stack name is required");
    }

    const slug = slugify(name);
    const existing = await TechStackRepository.findByName(name);
    if (existing) {
      throw new BadRequestError(`Tech stack "${name}" already exists`);
    }
    const slugTaken = await TechStackRepository.findBySlug(slug);
    if (slugTaken) {
      throw new BadRequestError(`Tech stack slug "${slug}" already exists`);
    }

    return TechStackRepository.create({ name, slug });
  },

  async delete(currentUser: CurrentUser, id: string) {
    assertSuperuser(currentUser);
    const existing = await TechStackRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Tech stack not found");
    }
    await TechStackRepository.delete(id);
    return { id, deleted: true };
  },
};
