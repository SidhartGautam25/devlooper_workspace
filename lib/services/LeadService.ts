import { Role, type LeadStatus } from "@prisma/client";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { LeadRepository } from "@/lib/repositories/LeadRepository";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { LeadNotificationService } from "@/lib/services/LeadNotificationService";
import type { CurrentUser } from "@/lib/types";
import type { LeadInquiryInput } from "@/lib/validation/lead-inquiry";

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

  async listAllInquiries() {
    return LeadRepository.listAll();
  },

  async createLead(data: LeadInquiryInput, currentUser?: CurrentUser | null) {
    const name = data.name.trim();
    const email = data.email?.trim().toLowerCase() || null;
    const phone = data.phone?.trim() || null;
    const company = data.company?.trim() || null;
    const selectedPackage = data.selectedPackage;
    const projectDetails = data.projectDetails?.trim() || null;
    const sourceUrl = data.sourceUrl?.trim() || null;
    const sourceComponent = data.sourceComponent?.trim() || null;
    const packageId = selectedPackage?.id ?? null;
    const packageName = selectedPackage?.name ?? null;
    const category = selectedPackage?.category?.trim() || null;
    const priceInr = selectedPackage?.priceInr ?? null;
    const source = data.source?.trim() || sourceUrl || sourceComponent || null;
    const service = data.service?.trim() || packageName || category || null;
    const budget =
      data.budget?.trim() ||
      (priceInr != null ? `₹${priceInr}` : null);
    const notes = data.notes?.trim() || null;

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

    const lead = await LeadRepository.create({
      name,
      email,
      phone,
      company,
      packageId,
      packageName,
      category,
      priceInr,
      projectDetails,
      sourceUrl,
      sourceComponent,
      source,
      service,
      budget,
      notes,
      internalNotes: notes,
      ...(assignedToId
        ? { assignedTo: { connect: { id: assignedToId } } }
        : {}),
    });

    if (!currentUser) {
      void LeadNotificationService.notifyNewLead({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        packageName: lead.packageName,
        category: lead.category,
        priceInr: lead.priceInr,
        projectDetails: lead.projectDetails,
        sourceUrl: lead.sourceUrl,
        sourceComponent: lead.sourceComponent,
      });
    }

    return lead;
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
      ...(notes !== undefined ? { notes, internalNotes: notes } : {}),
    });
  },
};
