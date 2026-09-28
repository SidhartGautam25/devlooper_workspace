import { AppError, ValidationError } from "@/lib/errors";

export function jsonSuccess<T>(data: T, status = 200, extra?: Record<string, unknown>) {
  return Response.json({ success: true, ...extra, data }, { status });
}

export function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ success: false, error, ...extra }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ValidationError) {
    return jsonError(error.message, error.statusCode, { details: error.details });
  }

  if (error instanceof AppError) {
    return jsonError(error.message, error.statusCode);
  }

  console.error(error);
  return jsonError("Internal server error", 500);
}
