import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { TechStackService } from "@/lib/services/TechStackService";

export const TechStackController = {
  async list() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const stacks = await TechStackService.list(currentUser);
      return jsonSuccess(stacks);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as { name?: string };
      const stack = await TechStackService.create(currentUser, body.name ?? "");
      return jsonSuccess(stack, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async remove(id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const result = await TechStackService.delete(currentUser, id);
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
