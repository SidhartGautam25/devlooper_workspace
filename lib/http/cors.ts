function allowedOrigins() {
  const configured = [
    process.env.ALLOWED_FRONTEND_ORIGIN,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return [...new Set(configured)];
}

export function getAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const normalized = origin.replace(/\/$/, "");
  return allowedOrigins().includes(normalized) ? normalized : null;
}

export function corsHeaders(request: Request) {
  const origin = getAllowedOrigin(request);
  if (!origin) return null;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  } as const;
}

export function applyCors(request: Request, response: Response) {
  const origin = request.headers.get("origin");
  if (origin && !getAllowedOrigin(request)) {
    return Response.json(
      { success: false, error: "Origin not allowed" },
      { status: 403 },
    );
  }

  const headers = corsHeaders(request);
  if (!headers) return response;

  const next = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) {
    next.headers.set(key, value);
  }
  return next;
}

export function corsPreflight(request: Request) {
  const headers = corsHeaders(request);
  if (!headers) {
    return Response.json(
      { success: false, error: "Origin not allowed" },
      { status: 403 },
    );
  }
  return new Response(null, { status: 204, headers });
}
