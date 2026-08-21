import "server-only";
import { auth } from "@/lib/auth";

export class AuthError extends Error {}
export class ForbiddenError extends Error {}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Throws if there is no authenticated user. Use at the top of every server action. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

/** Throws unless the authenticated user is an ADMIN. Use for admin-only mutations. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new ForbiddenError("Admin access required");
  return user;
}
