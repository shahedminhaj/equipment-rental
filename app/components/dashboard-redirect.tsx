"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { apiRequest } from "../lib/api";
import { clearAuth, getStoredRole, getStoredToken, saveAuth, type AuthUser } from "../lib/auth";
import { dashboardHref, type DashboardRole } from "../lib/dashboard-routes";
import { DashboardPreview } from "./dashboard-preview";

/**
 * Signed-in visitors are sent to the dashboard for their role. Without a
 * session, the same responsive shell stays visible as an interactive layout
 * preview so the Customer, Owner, and Admin workspaces can be explored.
 */
export function DashboardRedirect({ role }: { role?: DashboardRole }) {
  const router = useRouter();
  const previewRole: DashboardRole = role || "customer";

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    let active = true;
    const fallbackRole = getStoredRole() || role;

    apiRequest<{ user: AuthUser }>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ user }) => {
        if (!active) return;
        saveAuth(token, user);
        router.replace(dashboardHref(user.role));
      })
      .catch(() => {
        if (!active) return;
        if (fallbackRole) {
          router.replace(dashboardHref(fallbackRole));
          return;
        }
        clearAuth();
        router.replace("/login?next=/dashboard");
      });

    return () => {
      active = false;
    };
  }, [role, router]);

  return <DashboardPreview initialRole={previewRole} />;
}
