import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

if (process.env.NODE_ENV === "development") {
  if (
    !process.env.AUTH_URL ||
    process.env.AUTH_URL.includes("workspace.devlooperstudio.com")
  ) {
    process.env.AUTH_URL = process.env.AUTH_URL_DEV || "http://localhost:3000";
    process.env.NEXTAUTH_URL = process.env.AUTH_URL;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        let employeeId = user.employeeId;
        if (!employeeId && user.role === Role.EMPLOYEE) {
          employeeId = randomUUID();
          await prisma.user
            .update({
              where: { id: user.id },
              data: { employeeId },
            })
            .catch(() => {});
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: employeeId ?? user.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.employeeId = user.employeeId;
      } else if (
        !token.employeeId &&
        token.role === Role.EMPLOYEE &&
        (token.id || token.sub)
      ) {
        const userId = String(token.id || token.sub);
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { employeeId: true },
          });
          if (dbUser?.employeeId) {
            token.employeeId = dbUser.employeeId;
          } else {
            const newId = randomUUID();
            await prisma.user.update({
              where: { id: userId },
              data: { employeeId: newId },
            });
            token.employeeId = newId;
          }
        } catch {
          token.employeeId = userId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.id === "string" ? token.id : (token.sub ?? "");
        session.user.role =
          token.role === "SUPERUSER" ||
          token.role === "EMPLOYEE" ||
          token.role === "USER"
            ? token.role
            : Role.USER;
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
        session.user.employeeId =
          typeof token.employeeId === "string" ? token.employeeId : null;
      }
      return session;
    },
  },
});
