"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { apiRequest } from "../lib/api";
import {
  clearAuth,
  getStoredRole,
  getStoredToken,
  saveAuth,
  type AuthUser,
} from "../lib/auth";
import { dashboardHref } from "../lib/dashboard-routes";

// Public entry pages a signed-in user should never see again until sign out.
const ENTRY_ROUTES = new Set(["/", "/login", "/signup", "/get-started"]);

/**
 * Keeps signed-in users inside the dashboard for their role. Because the
 * session lives in localStorage, this runs on the client and also reacts to
 * browser back/forward navigation through usePathname.
 */
export function AuthGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ENTRY_ROUTES.has(pathname)) return;

    let active = true;
    const token = getStoredToken();
    if (!token) return;

    function redirectToDashboard(role: AuthUser["role"]) {
      const target = dashboardHref(role);
      if (target !== pathname) {
        router.replace(target);
      }
    }

    const storedRole = getStoredRole();
    if (storedRole) {
      redirectToDashboard(storedRole);
      return;
    }

    // The token is present but the cached role is missing or invalid.
    void apiRequest<{ user: AuthUser }>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ user }) => {
        if (!active) return;
        saveAuth(token, user);
        redirectToDashboard(user.role);
      })
      .catch(() => {
        // Expired/invalid token: treat the visitor as signed out.
        if (active) {
          clearAuth();
        }
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  return null;
}
