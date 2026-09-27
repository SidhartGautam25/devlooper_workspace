import type { TaskPriority } from "@prisma/client";
import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { TaskGroupService } from "@/lib/services/TaskGroupService";

export const TaskGroupController = {
  async list() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const groups = await TaskGroupService.list(currentUser);
      return jsonSuccess(groups);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as {
        name?: string;
        description?: string | null;
        priority?: TaskPriority | null;
        businessName?: string | null;
        businessTypeId?: string | null;
        languageId?: string | null;
        regionId?: string | null;
        assignedToId?: string | null;
      };

      const group = await TaskGroupService.create(currentUser, {
        name: body.name ?? "",
        description: body.description,
        priority: body.priority,
        businessName: body.businessName,
        businessTypeId: body.businessTypeId,
        languageId: body.languageId,
        regionId: body.regionId,
        assignedToId: body.assignedToId,
      });

      return jsonSuccess(group, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async update(request: Request, id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as {
        name?: string;
        description?: string | null;
        priority?: TaskPriority | null;
        businessName?: string | null;
        businessTypeId?: string | null;
        languageId?: string | null;
        regionId?: string | null;
        assignedToId?: string | null;
      };

      const group = await TaskGroupService.update(currentUser, id, body);
      return jsonSuccess(group);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async remove(id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const result = await TaskGroupService.delete(currentUser, id);
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
