import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { UserRepository } from "@/lib/repositories/UserRepository";
import type { CurrentUser } from "@/lib/types";

function assertSuperuser(currentUser: CurrentUser) {
  if (currentUser.role !== Role.SUPERUSER) {
    throw new ForbiddenError("Only superusers can manage employees");
  }
}

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new BadRequestError("Password must be at least 8 characters");
  }
}

export const UserService = {
  async listEmployees(currentUser: CurrentUser) {
    assertSuperuser(currentUser);
    return UserRepository.listEmployees();
  },

  async listActiveEmployees(currentUser: CurrentUser) {
    if (currentUser.role !== Role.SUPERUSER) {
      throw new ForbiddenError("Only superusers can list employees");
    }
    return UserRepository.listActiveEmployees();
  },

  async createEmployee(
    currentUser: CurrentUser,
    data: { name: string; email: string; password: string; phone?: string },
  ) {
    assertSuperuser(currentUser);

    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const password = data.password ?? "";
    const phone = data.phone?.trim() || null;

    if (!name || !email || !password) {
      throw new BadRequestError("Name, email, and password are required");
    }

    validatePassword(password);

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestError("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await UserRepository.create({
      name,
      email,
      phone,
      passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
    });

    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      isActive: employee.isActive,
      role: employee.role,
    };
  },

  async resetEmployeePassword(
    currentUser: CurrentUser,
    employeeId: string,
    newPassword: string,
  ) {
    assertSuperuser(currentUser);
    validatePassword(newPassword);

    const employee = await UserRepository.findById(employeeId);
    if (!employee || employee.role !== Role.EMPLOYEE) {
      throw new NotFoundError("Employee not found");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await UserRepository.updatePassword(employeeId, passwordHash);
    return { id: employeeId, reset: true };
  },

  async toggleEmployeeActive(
    currentUser: CurrentUser,
    employeeId: string,
    isActive: boolean,
  ) {
    assertSuperuser(currentUser);

    const employee = await UserRepository.findById(employeeId);
    if (!employee || employee.role !== Role.EMPLOYEE) {
      throw new NotFoundError("Employee not found");
    }

    const updated = await UserRepository.toggleActive(employeeId, isActive);
    return {
      id: updated.id,
      isActive: updated.isActive,
    };
  },
};
