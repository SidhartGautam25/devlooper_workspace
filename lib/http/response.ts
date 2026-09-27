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

  console.error(error);
  return jsonError("Internal server error", 500);
}
