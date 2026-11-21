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
