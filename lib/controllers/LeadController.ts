import type { LeadStatus } from "@prisma/client";
import { auth } from "@/auth";
import { isValidAdminApiKey } from "@/lib/http/api-key";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { LeadService } from "@/lib/services/LeadService";
import { parseLeadInquiry } from "@/lib/validation/lead-inquiry";

const PUBLIC_INQUIRY_MESSAGE =
  "Inquiry received successfully. Our team will contact you within 24 hours.";

export const LeadController = {
  async list(request: Request) {
    try {
      if (isValidAdminApiKey(request)) {
        const leads = await LeadService.listAllInquiries();
        return jsonSuccess(leads);
      }

      const currentUser = requireCurrentUser(await auth());
      const leads = await LeadService.listLeads(currentUser);
      return jsonSuccess(leads);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      let currentUser = null;
      try {
        currentUser = requireCurrentUser(await auth());
      } catch {
        currentUser = null;
      }

      const body = (await request.json()) as unknown;
      const parsed = parseLeadInquiry(body);
      const lead = await LeadService.createLead(parsed, currentUser);

      if (currentUser) {
        return jsonSuccess(lead, 201);
      }

      return jsonSuccess(
        {
          leadId: lead.id,
          createdAt: lead.createdAt,
        },
        201,
        { message: PUBLIC_INQUIRY_MESSAGE },
      );
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async update(request: Request, leadId: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as {
        assignedToId?: string | null;
        status?: LeadStatus;
        notes?: string | null;
      };

      if (body.assignedToId !== undefined && body.status === undefined && body.notes === undefined) {
        const lead = await LeadService.assignLead(
          currentUser,
          leadId,
          body.assignedToId,
        );
        return jsonSuccess(lead);
      }

      if (body.assignedToId !== undefined) {
        await LeadService.assignLead(currentUser, leadId, body.assignedToId);
      }

      const lead = await LeadService.updateLeadStatusAndNotes(
        currentUser,
        leadId,
        body.status,
        body.notes,
      );
      return jsonSuccess(lead);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
