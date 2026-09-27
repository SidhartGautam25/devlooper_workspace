import { AppError } from "@/lib/errors";

export function jsonSuccess<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function jsonError(error: string, status: number) {
  return Response.json({ success: false, error }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return jsonError(error.message, error.statusCode);
  }

  // Handle known Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as {
      code: string;
      message: string;
      meta?: Record<string, unknown>;
    };

    if (prismaError.code === "P2002") {
      return jsonError("A record with this name already exists", 400);
    }

    if (prismaError.code === "P2021") {
      return jsonError(
        "Database table does not exist yet. Please run `pnpm db:seed` in your terminal to push the schema to MySQL.",
        500,
      );
    }

    if (prismaError.code === "P2003") {
      return jsonError("Referenced record does not exist", 400);
    }
  }

  console.error("Unhandled API Error:", error);
  const message = error instanceof Error ? error.message : "Internal server error";
  return jsonError(message, 500);
}
