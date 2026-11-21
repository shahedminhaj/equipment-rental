import type { AuthUser } from "./auth";

export type DashboardRole = AuthUser["role"];

export function dashboardHref(role?: DashboardRole | string | null): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "owner") return "/owner/dashboard";
  if (role === "customer") return "/customer/dashboard";
  return "/login";
}

export function dashboardRoleLabel(role?: DashboardRole | string | null): string {
  if (role === "admin") return "Administrator";
  if (role === "owner") return "Equipment owner";
  if (role === "customer") return "Renter";
  return "Guest";
}

/**
 * After sign-in, send the user back to the page they came from (for example a
 * `View details` link). Only local paths are allowed so `next` cannot be used
 * for an open redirect to another site.
 */
export function postAuthHref(
  role?: DashboardRole | string | null,
  next?: string | string[] | null,
): string {
  const fallback = dashboardHref(role);
  const target = Array.isArray(next) ? next[0] : next;
  if (!target || !target.startsWith("/") || /^\/[\\/]/.test(target)) return fallback;
  return target;
}
