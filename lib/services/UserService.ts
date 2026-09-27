import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
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
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      languageId?: string | null;
      regionId?: string | null;
      employeeRoleId?: string | null;
    },
  ) {
    assertSuperuser(currentUser);

    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const password = data.password ?? "";
    const phone = data.phone?.trim() || null;
    const languageId = data.languageId?.trim() || null;
    const regionId = data.regionId?.trim() || null;
    const employeeRoleId = data.employeeRoleId?.trim() || null;

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
      employeeId: randomUUID(),
      name,
      email,
      phone,
      passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
      ...(languageId ? { language: { connect: { id: languageId } } } : {}),
      ...(regionId ? { region: { connect: { id: regionId } } } : {}),
      ...(employeeRoleId
        ? { employeeRole: { connect: { id: employeeRoleId } } }
        : {}),
    });

    return {
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      languageId: employee.languageId,
      regionId: employee.regionId,
      employeeRoleId: employee.employeeRoleId,
      isActive: employee.isActive,
      role: employee.role,
    };
  },

  async updateEmployee(
    currentUser: CurrentUser,
    employeeId: string,
    data: {
      name?: string;
      phone?: string | null;
      languageId?: string | null;
      regionId?: string | null;
      employeeRoleId?: string | null;
    },
  ) {
    assertSuperuser(currentUser);

    const employee = await UserRepository.findById(employeeId);
    if (!employee || employee.role !== Role.EMPLOYEE) {
      throw new NotFoundError("Employee not found");
    }

    const updateData: Parameters<typeof UserRepository.update>[1] = {};

    if (typeof data.name === "string" && data.name.trim()) {
      updateData.name = data.name.trim();
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone?.trim() || null;
    }
    if (data.languageId !== undefined) {
      const lid = data.languageId?.trim() || null;
      updateData.language = lid
        ? { connect: { id: lid } }
        : { disconnect: true };
    }
    if (data.regionId !== undefined) {
      const rid = data.regionId?.trim() || null;
      updateData.region = rid ? { connect: { id: rid } } : { disconnect: true };
    }
    if (data.employeeRoleId !== undefined) {
      const erid = data.employeeRoleId?.trim() || null;
      updateData.employeeRole = erid
        ? { connect: { id: erid } }
        : { disconnect: true };
    }

    const updated = await UserRepository.update(employeeId, updateData);
    return {
      id: updated.id,
      employeeId: updated.employeeId,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      languageId: updated.languageId,
      regionId: updated.regionId,
      employeeRoleId: updated.employeeRoleId,
      isActive: updated.isActive,
      role: updated.role,
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
