import type { Session } from "next-auth";
import { UnauthorizedError } from "@/lib/errors";
import type { CurrentUser } from "@/lib/types";

export function requireCurrentUser(session: Session | null): CurrentUser {
  const user = session?.user;
  if (!user?.id || !user.role) {
    throw new UnauthorizedError("You must be signed in");
  }

  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };
}
