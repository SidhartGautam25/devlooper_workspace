export function isValidAdminApiKey(request: Request) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;

  const headerKey = request.headers.get("x-api-key");
  const bearer = request.headers.get("authorization");
  const token = bearer?.toLowerCase().startsWith("bearer ")
    ? bearer.slice(7).trim()
    : bearer;

  return headerKey === expected || token === expected;
}
