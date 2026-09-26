import { Role, type LeadStatus } from "@prisma/client";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { LeadRepository } from "@/lib/repositories/LeadRepository";
import { UserRepository } from "@/lib/repositories/UserRepository";
import type { CurrentUser } from "@/lib/types";

export const LeadService = {
  async listLeads(currentUser: CurrentUser) {
    if (currentUser.role === Role.SUPERUSER) {
      return LeadRepository.listAll();
    }
    if (currentUser.role === Role.EMPLOYEE) {
      return LeadRepository.listByAssignee(currentUser.id);
    }
    throw new ForbiddenError("You cannot view leads");
  },

  async createLead(
    data: {
      name: string;
      email: string;
      phone: string;
      source?: string;
      service?: string;
      budget?: string;
      notes?: string;
      assignedToId?: string | null;
    },
    currentUser?: CurrentUser | null,
  ) {
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const phone = data.phone?.trim();

    if (!name || !email || !phone) {
      throw new BadRequestError("Name, email, and phone are required");
    }

    const assignedToId = data.assignedToId ?? null;
    if (assignedToId) {
      if (currentUser?.role !== Role.SUPERUSER) {
        throw new ForbiddenError("Only superusers can assign leads");
      }
      const employee = await UserRepository.findById(assignedToId);
      if (!employee || employee.role !== Role.EMPLOYEE) {
        throw new BadRequestError("Leads can only be assigned to employees");
      }
    }

    return LeadRepository.create({
      name,
      email,
      phone,
      source: data.source?.trim() || null,
      service: data.service?.trim() || null,
      budget: data.budget?.trim() || null,
      notes: data.notes?.trim() || null,
      ...(assignedToId
        ? { assignedTo: { connect: { id: assignedToId } } }
        : {}),
    });
  },

  async assignLead(
    currentUser: CurrentUser,
    leadId: string,
    employeeId: string | null,
  ) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can assign leads");
    }

    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      throw new NotFoundError("Lead not found");
    }

    if (employeeId) {
      const employee = await UserRepository.findById(employeeId);
      if (!employee || employee.role !== Role.EMPLOYEE) {
        throw new BadRequestError("Leads can only be assigned to employees");
      }
    }

    return LeadRepository.update(leadId, {
      assignedTo: employeeId
        ? { connect: { id: employeeId } }
        : { disconnect: true },
    });
  },

  async updateLeadStatusAndNotes(
    currentUser: CurrentUser,
    leadId: string,
    status?: LeadStatus,
    notes?: string | null,
  ) {
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      throw new NotFoundError("Lead not found");
    }

    const isSuperuser = currentUser.role === Role.SUPERUSER;
    const isAssignee = lead.assignedToId === currentUser.id;

    if (!isSuperuser && !isAssignee) {
      throw new ForbiddenError("You cannot update another employee's lead");
    }

    if (!isSuperuser && currentUser.role !== Role.EMPLOYEE) {
      throw new ForbiddenError("You cannot update this lead");
    }

    return LeadRepository.update(leadId, {
      ...(status !== undefined ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
    });
  },
};
