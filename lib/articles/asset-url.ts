export function publicAssetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "";
  return `${base}${path}`;
}
