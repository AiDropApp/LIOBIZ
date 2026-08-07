export type RedirectRule = {
  from: string;
  to: string;
  permanent?: boolean;
};

export const defaultRedirects: RedirectRule[] = [];

/** Normalize path for redirect lookup */
export function normalizeRedirectPath(path: string): string {
  if (!path.startsWith("/")) return `/${path}`;
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function findRedirect(
  pathname: string,
  rules: RedirectRule[],
): RedirectRule | undefined {
  const normalized = normalizeRedirectPath(pathname);
  return rules.find((r) => normalizeRedirectPath(r.from) === normalized);
}
