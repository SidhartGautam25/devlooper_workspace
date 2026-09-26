export type Role = "SUPERUSER" | "EMPLOYEE" | "USER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "IN_DISCUSSION"
  | "QUALIFIED"
  | "CONVERTED"
  | "LOST";

export type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    assignedTasks: number;
    assignedLeads: number;
  };
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdById: string;
  assignedToId: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; email: string; role: Role };
  createdBy: { id: string; name: string; email: string; role: Role };
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string | null;
  service: string | null;
  status: LeadStatus;
  notes: string | null;
  budget: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
  } | null;
};

export type DashboardStats = {
  totalLeads: number;
  totalTasks: number;
  completedTasks: number;
  employeeCount: number | null;
};

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error: string };

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!payload.success) {
    throw new Error(payload.error || "Request failed");
  }
  return payload.data;
}
