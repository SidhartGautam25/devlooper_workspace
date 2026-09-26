import type { Role } from "@prisma/client";

export type CurrentUser = {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
};
