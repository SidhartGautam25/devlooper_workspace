import {
  Role,
  type TaskPriority,
  type TaskResult,
  type TaskStatus,
} from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { BusinessTypeRepository } from "@/lib/repositories/BusinessTypeRepository";
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
      description?: string | null;
      assignedToId?: string | null;
      priority?: TaskPriority;
      dueDate?: string | null;
      businessName?: string | null;
      businessTypeId?: string | null;
      contactDetail?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
    },
  ) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can create tasks");
    }

    const title = data.title?.trim();
    if (!title) {
      throw new BadRequestError("Title is required");
    }

    const assignedToId = data.assignedToId?.trim() || null;
    if (assignedToId) {
      const assignee = await UserRepository.findById(assignedToId);
      if (!assignee || assignee.role !== Role.EMPLOYEE) {
        throw new BadRequestError("Tasks can only be assigned to employees");
      }
    }

    const businessTypeId = data.businessTypeId?.trim() || null;
    if (businessTypeId) {
      const bType = await BusinessTypeRepository.findById(businessTypeId);
      if (!bType) {
        throw new BadRequestError("Selected business type does not exist");
      }
    }

    return TaskRepository.create({
      title,
      description: data.description?.trim() || null,
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      businessName: data.businessName?.trim() || null,
      contactDetail: data.contactDetail?.trim() || null,
      contactPhone: data.contactPhone?.trim() || null,
      contactEmail: data.contactEmail?.trim()?.toLowerCase() || null,
      // During creation, call details and result must be null (provided by employee)
      callDuration: null,
      callDetail: null,
      result: null,
      createdBy: { connect: { id: currentUser.id } },
      ...(assignedToId
        ? { assignedTo: { connect: { id: assignedToId } } }
        : {}),
      ...(businessTypeId
        ? { businessType: { connect: { id: businessTypeId } } }
        : {}),
    });
  },

  async updateTask(
    currentUser: CurrentUser,
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      assignedToId?: string | null;
      priority?: TaskPriority;
      dueDate?: string | null;
      status?: TaskStatus;
      businessName?: string | null;
      businessTypeId?: string | null;
      contactDetail?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
      callDuration?: string | null;
      callDetail?: string | null;
      result?: TaskResult | null;
    },
  ) {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const isSuperuser = currentUser.role === Role.SUPERUSER;
    const isAssignedEmployee =
      currentUser.role === Role.EMPLOYEE &&
      task.assignedToId === currentUser.id;

    if (!isSuperuser && !isAssignedEmployee) {
      throw new ForbiddenError("You are not authorized to update this task");
    }

    // If an assigned employee is updating:
    // They can ONLY update callDuration, callDetail, result, and status.
    if (!isSuperuser && isAssignedEmployee) {
      const hasRestrictedEdits =
        data.title !== undefined ||
        data.assignedToId !== undefined ||
        data.businessName !== undefined ||
        data.businessTypeId !== undefined ||
        data.priority !== undefined ||
        data.dueDate !== undefined ||
        data.contactDetail !== undefined ||
        data.contactPhone !== undefined ||
        data.contactEmail !== undefined;

      if (hasRestrictedEdits) {
        throw new ForbiddenError(
          "Assigned employees can only update call duration, call details, result, and status",
        );
      }

      return TaskRepository.update(taskId, {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.callDuration !== undefined
          ? { callDuration: data.callDuration?.trim() || null }
          : {}),
        ...(data.callDetail !== undefined
          ? { callDetail: data.callDetail?.trim() || null }
          : {}),
        ...(data.result !== undefined ? { result: data.result } : {}),
      });
    }

    // Superuser can update all fields, including assigning/reassigning or unassigning
    let assignedToUpdate = undefined;
    if (data.assignedToId !== undefined) {
      const newAssigneeId = data.assignedToId?.trim() || null;
      if (newAssigneeId) {
        const assignee = await UserRepository.findById(newAssigneeId);
        if (!assignee || assignee.role !== Role.EMPLOYEE) {
          throw new BadRequestError("Tasks can only be assigned to employees");
        }
        assignedToUpdate = { connect: { id: newAssigneeId } };
      } else {
        assignedToUpdate = { disconnect: true };
      }
    }

    let businessTypeUpdate = undefined;
    if (data.businessTypeId !== undefined) {
      const newBTypeId = data.businessTypeId?.trim() || null;
      if (newBTypeId) {
        const bType = await BusinessTypeRepository.findById(newBTypeId);
        if (!bType) {
          throw new BadRequestError("Selected business type does not exist");
        }
        businessTypeUpdate = { connect: { id: newBTypeId } };
      } else {
        businessTypeUpdate = { disconnect: true };
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
      ...(data.businessName !== undefined
        ? { businessName: data.businessName?.trim() || null }
        : {}),
      ...(data.contactDetail !== undefined
        ? { contactDetail: data.contactDetail?.trim() || null }
        : {}),
      ...(data.contactPhone !== undefined
        ? { contactPhone: data.contactPhone?.trim() || null }
        : {}),
      ...(data.contactEmail !== undefined
        ? { contactEmail: data.contactEmail?.trim()?.toLowerCase() || null }
        : {}),
      ...(data.callDuration !== undefined
        ? { callDuration: data.callDuration?.trim() || null }
        : {}),
      ...(data.callDetail !== undefined
        ? { callDetail: data.callDetail?.trim() || null }
        : {}),
      ...(data.result !== undefined ? { result: data.result } : {}),
      ...(assignedToUpdate ? { assignedTo: assignedToUpdate } : {}),
      ...(businessTypeUpdate ? { businessType: businessTypeUpdate } : {}),
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
