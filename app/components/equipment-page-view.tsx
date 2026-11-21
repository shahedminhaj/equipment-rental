"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "../lib/auth";
import { clearAuth, getStoredRole, getStoredToken } from "../lib/auth";
import { apiRequest } from "../lib/api";
import type { DashboardRole } from "../lib/dashboard-routes";
import { DashboardShell } from "./dashboard-shell";
import { EquipmentBrowser } from "./equipment-browser";
import { SiteFooter, SiteHeader } from "./site-shell";

export function EquipmentPageView() {
  const router = useRouter();
  const [role, setRole] = useState<DashboardRole | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const storedRole = getStoredRole();
    if (!token || !storedRole) return;

    let active = true;
    setRole(storedRole);
    apiRequest<{ user: AuthUser }>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        setRole(currentUser.role);
      })
      .catch(() => {
        // Keep the catalog available if session verification is temporarily unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  function signOut() {
    clearAuth();
    router.replace("/");
  }

  if (!role) {
    return (
      <>
        <SiteHeader />
        <main><EquipmentBrowser /></main>
        <SiteFooter />
      </>
    );
  }

  return (
    <DashboardShell
      role={role}
      user={user}
      title="Find equipment"
      description="Browse local gear, compare rental options, and choose what fits your next project."
      signOut={signOut}
    >
      <EquipmentBrowser />
    </DashboardShell>
  );
}
