"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { clearAuth, saveAuth, type AuthUser } from "../lib/auth";
import { dashboardHref, type DashboardRole } from "../lib/dashboard-routes";

type DashboardSession = {
  user: AuthUser | null;
  token: string;
  isLoading: boolean;
  error: string;
  signOut: () => void;
  refreshSession: () => void;
};

/**
 * Loads the current account from localStorage + the API and keeps users inside
 * the dashboard that belongs to their role.
 */
export function useDashboardSession(expectedRole?: DashboardRole): DashboardSession {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      setIsLoading(true);
      setError("");

      const storedToken = window.localStorage.getItem("fieldkit_token");
      if (!storedToken) {
        router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      try {
        const { user: currentUser } = await apiRequest<{ user: AuthUser }>("/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!active) return;

        saveAuth(storedToken, currentUser);
        if (expectedRole && currentUser.role !== expectedRole) {
          router.replace(dashboardHref(currentUser.role));
          return;
        }

        setToken(storedToken);
        setUser(currentUser);
      } catch (sessionError) {
        if (!active) return;
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Could not verify your account.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, [expectedRole, router, sessionKey]);

  const signOut = useCallback(() => {
    clearAuth();
    router.replace("/");
  }, [router]);

  const refreshSession = useCallback(() => setSessionKey((key) => key + 1), []);

  return { user, token, isLoading, error, signOut, refreshSession };
}
