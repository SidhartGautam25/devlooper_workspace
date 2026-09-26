import { Role, type TaskPriority, type TaskStatus } from "@prisma/client";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { TaskRepository } from "@/lib/repositories/TaskRepository";
import { UserRepository } from "@/lib/repositories/UserRepository";
import type { CurrentUser } from "@/lib/types";

export const TaskService = {
  async listTasks(currentUser: CurrentUser) {
    if (currentUser.role === Role.SUPERUSER) {
      return TaskRepository.listAll();
    }
    if (currentUser.role === Role.EMPLOYEE) {
      return TaskRepository.listByAssignee(currentUser.id);
    }
    throw new ForbiddenError("You cannot view tasks");
  },

  async createTask(
    currentUser: CurrentUser,
    data: {
      title: string;
      description?: string;
      assignedToId: string;
      priority?: TaskPriority;
      dueDate?: string | null;
    },
  ) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can create tasks");
    }

    const title = data.title?.trim();
    if (!title || !data.assignedToId) {
      throw new BadRequestError("Title and assignee are required");
    }

    const assignee = await UserRepository.findById(data.assignedToId);
    if (!assignee || assignee.role !== Role.EMPLOYEE) {
      throw new BadRequestError("Tasks can only be assigned to employees");
    }

    return TaskRepository.create({
      title,
      description: data.description?.trim() || null,
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdBy: { connect: { id: currentUser.id } },
      assignedTo: { connect: { id: data.assignedToId } },
    });
  },

  async updateTask(
    currentUser: CurrentUser,
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      assignedToId?: string;
      priority?: TaskPriority;
      dueDate?: string | null;
      status?: TaskStatus;
    },
  ) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can edit tasks");
    }

    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    if (data.assignedToId) {
      const assignee = await UserRepository.findById(data.assignedToId);
      if (!assignee || assignee.role !== Role.EMPLOYEE) {
        throw new BadRequestError("Tasks can only be assigned to employees");
      }
    }

    return TaskRepository.update(taskId, {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
        : {}),
      ...(data.assignedToId
        ? { assignedTo: { connect: { id: data.assignedToId } } }
        : {}),
    });
  },

  async updateTaskStatus(
    currentUser: CurrentUser,
    taskId: string,
    newStatus: TaskStatus,
  ) {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const isOwner = task.assignedToId === currentUser.id;
    const isSuperuser = currentUser.role === Role.SUPERUSER;

    if (!isSuperuser && !isOwner) {
      throw new ForbiddenError("You cannot update another employee's task");
    }

    if (!isSuperuser && currentUser.role !== Role.EMPLOYEE) {
      throw new ForbiddenError("You cannot update this task");
    }

    return TaskRepository.updateStatus(taskId, newStatus);
  },

  async deleteTask(currentUser: CurrentUser, taskId: string) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can delete tasks");
    }

    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await TaskRepository.delete(taskId);
    return { id: taskId, deleted: true };
  },
};
