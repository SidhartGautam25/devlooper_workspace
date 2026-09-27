import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { UserService } from "@/lib/services/UserService";

export const EmployeeController = {
  async list() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const employees = await UserService.listEmployees(currentUser);
      return jsonSuccess(employees);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as {
        name?: string;
        email?: string;
        password?: string;
        phone?: string;
        languageId?: string | null;
        regionId?: string | null;
        employeeRoleId?: string | null;
      };
      const employee = await UserService.createEmployee(currentUser, {
        name: body.name ?? "",
        email: body.email ?? "",
        password: body.password ?? "",
        phone: body.phone,
        languageId: body.languageId,
        regionId: body.regionId,
        employeeRoleId: body.employeeRoleId,
      });
      return jsonSuccess(employee, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async update(request: Request, employeeId: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as {
        name?: string;
        phone?: string | null;
        languageId?: string | null;
        regionId?: string | null;
        employeeRoleId?: string | null;
      };
      const updated = await UserService.updateEmployee(
        currentUser,
        employeeId,
        body,
      );
      return jsonSuccess(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async resetPassword(request: Request, employeeId: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as { password?: string };
      const result = await UserService.resetEmployeePassword(
        currentUser,
        employeeId,
        body.password ?? "",
      );
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async toggleStatus(request: Request, employeeId: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as { isActive?: boolean };
      const result = await UserService.toggleEmployeeActive(
        currentUser,
        employeeId,
        Boolean(body.isActive),
      );
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
