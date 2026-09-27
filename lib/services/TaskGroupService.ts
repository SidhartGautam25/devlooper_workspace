import { Role, type TaskPriority } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { BusinessTypeRepository } from "@/lib/repositories/BusinessTypeRepository";
import { LanguageRepository } from "@/lib/repositories/LanguageRepository";
import { RegionRepository } from "@/lib/repositories/RegionRepository";
import { TaskGroupRepository } from "@/lib/repositories/TaskGroupRepository";
import { UserRepository } from "@/lib/repositories/UserRepository";
import type { CurrentUser } from "@/lib/types";

export const TaskGroupService = {
  async list(currentUser: CurrentUser) {
    if (
      currentUser.role !== Role.SUPERUSER &&
      currentUser.role !== Role.EMPLOYEE
    ) {
      throw new ForbiddenError("You cannot view task groups");
    }
    return TaskGroupRepository.listAll();
  },

  async create(
    currentUser: CurrentUser,
    data: {
      name: string;
      description?: string | null;
      priority?: TaskPriority | null;
      businessName?: string | null;
      businessTypeId?: string | null;
      languageId?: string | null;
      regionId?: string | null;
      assignedToId?: string | null;
    },
  ) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can create task groups");
    }

    const name = data.name?.trim();
    if (!name) {
      throw new BadRequestError("Task group name is required");
    }

    const existing = await TaskGroupRepository.findByName(name);
    if (existing) {
      throw new BadRequestError("A task group with this name already exists");
    }

    const businessTypeId = data.businessTypeId?.trim() || null;
    if (businessTypeId) {
      const bType = await BusinessTypeRepository.findById(businessTypeId);
      if (!bType) {
        throw new BadRequestError("Selected business type does not exist");
      }
    }

    const languageId = data.languageId?.trim() || null;
    if (languageId) {
      const lang = await LanguageRepository.findById(languageId);
      if (!lang) {
        throw new BadRequestError("Selected language does not exist");
      }
    }

    const regionId = data.regionId?.trim() || null;
    if (regionId) {
      const reg = await RegionRepository.findById(regionId);
      if (!reg) {
        throw new BadRequestError("Selected region does not exist");
      }
    }

    const assignedToId = data.assignedToId?.trim() || null;
    if (assignedToId) {
      const assignee = await UserRepository.findById(assignedToId);
      if (!assignee || assignee.role !== Role.EMPLOYEE) {
        throw new BadRequestError("Default assignee must be an employee");
      }
    }

    return TaskGroupRepository.create({
      name,
      description: data.description?.trim() || null,
      priority: data.priority ?? "MEDIUM",
      businessName: data.businessName?.trim() || null,
      ...(businessTypeId
        ? { businessType: { connect: { id: businessTypeId } } }
        : {}),
      ...(languageId ? { language: { connect: { id: languageId } } } : {}),
      ...(regionId ? { region: { connect: { id: regionId } } } : {}),
      ...(assignedToId
        ? { assignedTo: { connect: { id: assignedToId } } }
        : {}),
    });
  },

  async update(
    currentUser: CurrentUser,
    id: string,
    data: {
      name?: string;
      description?: string | null;
      priority?: TaskPriority | null;
      businessName?: string | null;
      businessTypeId?: string | null;
      languageId?: string | null;
      regionId?: string | null;
      assignedToId?: string | null;
    },
  ) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can update task groups");
    }

    const taskGroup = await TaskGroupRepository.findById(id);
    if (!taskGroup) {
      throw new NotFoundError("Task group not found");
    }

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new BadRequestError("Task group name cannot be empty");
      }
      const existing = await TaskGroupRepository.findByName(name);
      if (existing && existing.id !== id) {
        throw new BadRequestError("A task group with this name already exists");
      }
    }

    let bTypeUpdate = undefined;
    if (data.businessTypeId !== undefined) {
      const bId = data.businessTypeId?.trim() || null;
      if (bId) {
        const bType = await BusinessTypeRepository.findById(bId);
        if (!bType) {
          throw new BadRequestError("Selected business type does not exist");
        }
        bTypeUpdate = { connect: { id: bId } };
      } else {
        bTypeUpdate = { disconnect: true };
      }
    }

    let langUpdate = undefined;
    if (data.languageId !== undefined) {
      const lId = data.languageId?.trim() || null;
      if (lId) {
        const lang = await LanguageRepository.findById(lId);
        if (!lang) {
          throw new BadRequestError("Selected language does not exist");
        }
        langUpdate = { connect: { id: lId } };
      } else {
        langUpdate = { disconnect: true };
      }
    }

    let regUpdate = undefined;
    if (data.regionId !== undefined) {
      const rId = data.regionId?.trim() || null;
      if (rId) {
        const reg = await RegionRepository.findById(rId);
        if (!reg) {
          throw new BadRequestError("Selected region does not exist");
        }
        regUpdate = { connect: { id: rId } };
      } else {
        regUpdate = { disconnect: true };
      }
    }

    let assigneeUpdate = undefined;
    if (data.assignedToId !== undefined) {
      const aId = data.assignedToId?.trim() || null;
      if (aId) {
        const assignee = await UserRepository.findById(aId);
        if (!assignee || assignee.role !== Role.EMPLOYEE) {
          throw new BadRequestError("Default assignee must be an employee");
        }
        assigneeUpdate = { connect: { id: aId } };
      } else {
        assigneeUpdate = { disconnect: true };
      }
    }

    return TaskGroupRepository.update(id, {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.businessName !== undefined
        ? { businessName: data.businessName?.trim() || null }
        : {}),
      ...(bTypeUpdate ? { businessType: bTypeUpdate } : {}),
      ...(langUpdate ? { language: langUpdate } : {}),
      ...(regUpdate ? { region: regUpdate } : {}),
      ...(assigneeUpdate ? { assignedTo: assigneeUpdate } : {}),
    });
  },

  async delete(currentUser: CurrentUser, id: string) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can delete task groups");
    }

    const taskGroup = await TaskGroupRepository.findById(id);
    if (!taskGroup) {
      throw new NotFoundError("Task group not found");
    }

    await TaskGroupRepository.delete(id);
    return { id, deleted: true };
  },
};
