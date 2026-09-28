/**
 * Comma-separated allowlist from AUTH_ALLOWED_EMAILS (case-insensitive).
 * Example: AUTH_ALLOWED_EMAILS=aszalvarez@gmail.com,other@motusdao.com
 */
export function getAllowedEmails(): string[] {
  const raw = process.env.AUTH_ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getAllowedEmails();
  if (allowed.length === 0) {
    // Fail closed in production; allow any email in development when unset.
    if (process.env.NODE_ENV === "production") return false;
    return true;
  }
  return allowed.includes(normalizeEmail(email));
}
