import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { RegionService } from "@/lib/services/RegionService";

export const RegionController = {
  async list() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const regions = await RegionService.listRegions(currentUser);
      return jsonSuccess(regions);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as { name?: string };
      const region = await RegionService.createRegion(
        currentUser,
        body.name ?? "",
      );
      return jsonSuccess(region, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async remove(id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const result = await RegionService.deleteRegion(currentUser, id);
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
