import type { TaskPriority, TaskResult, TaskStatus } from "@prisma/client";
import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { TaskService } from "@/lib/services/TaskService";

export const TaskController = {
  async list() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const tasks = await TaskService.listTasks(currentUser);
      return jsonSuccess(tasks);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as {
        title?: string;
        description?: string;
        assignedToId?: string | null;
        priority?: TaskPriority;
        dueDate?: string | null;
        businessName?: string | null;
        businessTypeId?: string | null;
        languageId?: string | null;
        regionId?: string | null;
        contactDetail?: string | null;
        contactPhone?: string | null;
        contactEmail?: string | null;
      };
      const task = await TaskService.createTask(currentUser, {
        title: body.title ?? "",
        description: body.description,
        assignedToId: body.assignedToId,
        priority: body.priority,
        dueDate: body.dueDate,
        businessName: body.businessName,
        businessTypeId: body.businessTypeId,
        languageId: body.languageId,
        regionId: body.regionId,
        contactDetail: body.contactDetail,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
      });
      return jsonSuccess(task, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async update(request: Request, taskId: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as {
        status?: TaskStatus;
        title?: string;
        description?: string | null;
        assignedToId?: string | null;
        priority?: TaskPriority;
        dueDate?: string | null;
        businessName?: string | null;
        businessTypeId?: string | null;
        languageId?: string | null;
        regionId?: string | null;
        contactDetail?: string | null;
        contactPhone?: string | null;
        contactEmail?: string | null;
        callDuration?: string | null;
        callDetail?: string | null;
        result?: TaskResult | null;
      };

      const task = await TaskService.updateTask(currentUser, taskId, body);
      return jsonSuccess(task);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async remove(taskId: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const result = await TaskService.deleteTask(currentUser, taskId);
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
