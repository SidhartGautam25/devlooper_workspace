import { randomUUID } from "crypto";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }

  let employeeId = session.user.employeeId;
  if (session.user.role === "EMPLOYEE") {
    if (!employeeId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { employeeId: true },
        });
        if (dbUser?.employeeId) {
          employeeId = dbUser.employeeId;
        } else {
          const newId = randomUUID();
          await prisma.user.update({
            where: { id: session.user.id },
            data: { employeeId: newId },
          });
          employeeId = newId;
        }
      } catch (err) {
        console.error("Failed to load or backfill employeeId:", err);
      }
    }
  }

  const currentUser = {
    ...session.user,
    employeeId: employeeId ?? session.user.employeeId ?? session.user.id,
  };

  return <AdminShell user={currentUser}>{children}</AdminShell>;
}
