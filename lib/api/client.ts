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

export type TaskResult = "PASS" | "FAIL";

export type BusinessType = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    tasks: number;
  };
};

export type Language = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    tasks: number;
    employees: number;
  };
};

export type Region = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    tasks: number;
    employees: number;
  };
};

export type EmployeeRole = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    employees: number;
  };
};

export type Employee = {
  id: string;
  employeeId?: string | null;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  languageId?: string | null;
  language?: { id: string; name: string } | null;
  regionId?: string | null;
  region?: { id: string; name: string } | null;
  employeeRoleId?: string | null;
  employeeRole?: { id: string; name: string } | null;
  createdAt: string;
  _count: {
    assignedTasks: number;
    assignedLeads: number;
  };
};

export type TaskGroup = {
  id: string;
  name: string;
  description: string | null;
  priority: TaskPriority | null;
  businessName: string | null;
  businessTypeId: string | null;
  businessType: { id: string; name: string } | null;
  languageId: string | null;
  language: { id: string; name: string } | null;
  regionId: string | null;
  region: { id: string; name: string } | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string; role: Role } | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  taskGroupId?: string | null;
  taskGroup?: { id: string; name: string } | null;
  businessName: string | null;
  businessTypeId: string | null;
  businessType: { id: string; name: string } | null;
  languageId: string | null;
  language: { id: string; name: string } | null;
  regionId: string | null;
  region: { id: string; name: string } | null;
  contactDetail: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  callDuration: string | null;
  callDetail: string | null;
  result: TaskResult | null;
  createdById: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; email: string; role: Role } | null;
  createdBy: { id: string; name: string; email: string; role: Role };
};

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  packageId: string | null;
  packageName: string | null;
  category: string | null;
  priceInr: number | null;
  projectDetails: string | null;
  sourceUrl: string | null;
  sourceComponent: string | null;
  source: string | null;
  service: string | null;
  status: LeadStatus;
  notes: string | null;
  internalNotes: string | null;
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

export type ArticleStatus = "DRAFT" | "PUBLISHED";
export type HeadingLevel = 1 | 2 | 3 | 4;

export type ArticleBlock =
  | { id: string; type: "heading"; level: HeadingLevel; text: string; tocLabel?: string }
  | { id: string; type: "paragraph"; html: string }
  | { id: string; type: "code"; language: string; code: string }
  | { id: string; type: "image"; url: string; alt: string; caption?: string };

export type ArticleTocItem = {
  id: string;
  title: string;
  level: HeadingLevel;
};

export type TechStack = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  _count?: { articles: number };
};

export type ArticleAuthor = {
  id?: string;
  name: string;
  email?: string;
};

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  heroImageUrl: string | null;
  language: string | null;
  authorName?: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authors: ArticleAuthor[];
  techStacks: TechStack[];
  toc: ArticleTocItem[];
};

export type Article = ArticleSummary & {
  content: { blocks: ArticleBlock[] };
  relatedArticles: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    heroImageUrl: string | null;
    status?: ArticleStatus;
  }>;
  relatedIds?: string[];
  techStackIds?: string[];
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
