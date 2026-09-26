import type { LeadStatus } from "@prisma/client";
import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { LeadService } from "@/lib/services/LeadService";

export const LeadController = {
  async list() {
    try {
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

      const body = (await request.json()) as {
        name?: string;
        email?: string;
        phone?: string;
        source?: string;
        service?: string;
        budget?: string;
        notes?: string;
        assignedToId?: string | null;
      };

      const lead = await LeadService.createLead(
        {
          name: body.name ?? "",
          email: body.email ?? "",
          phone: body.phone ?? "",
          source: body.source,
          service: body.service,
          budget: body.budget,
          notes: body.notes,
          assignedToId: body.assignedToId,
        },
        currentUser,
      );
      return jsonSuccess(lead, 201);
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
