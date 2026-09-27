import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { EmployeeRoleService } from "@/lib/services/EmployeeRoleService";

export const EmployeeRoleController = {
  async list() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const roles = await EmployeeRoleService.listRoles(currentUser);
      return jsonSuccess(roles);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as { name?: string };
      const role = await EmployeeRoleService.createRole(
        currentUser,
        body.name ?? "",
      );
      return jsonSuccess(role, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async remove(id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const result = await EmployeeRoleService.deleteRole(currentUser, id);
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
