import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { BusinessTypeService } from "@/lib/services/BusinessTypeService";

export const BusinessTypeController = {
  async list() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const businessTypes =
        await BusinessTypeService.listBusinessTypes(currentUser);
      return jsonSuccess(businessTypes);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as { name?: string };
      const businessType = await BusinessTypeService.createBusinessType(
        currentUser,
        body.name ?? "",
      );
      return jsonSuccess(businessType, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async remove(id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const result = await BusinessTypeService.deleteBusinessType(
        currentUser,
        id,
      );
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
