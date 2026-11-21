"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "../data/app-theme";
import type { AuthUser } from "../lib/auth";
import { clearAuth, getStoredRole, getStoredToken } from "../lib/auth";
import { apiRequest } from "../lib/api";
import type { DashboardRole } from "../lib/dashboard-routes";
import { DashboardShell } from "./dashboard-shell";
import { EquipmentBrowser } from "./equipment-browser";
import { SiteFooter, SiteHeader } from "./site-shell";

function BrowserFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className={cn(appSurfaces.softCard, "overflow-hidden p-5 shadow-sm")}>
        <div aria-hidden="true" className={cn("h-0.5 w-full bg-linear-to-r", publicTone.panelAccent)} />
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="size-8 rounded-xl" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="mt-5 h-12 w-full rounded-2xl" />
        <Skeleton className="mt-3 h-10 w-full rounded-xl sm:w-2/3" />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={cn(appSurfaces.card, "gap-0 overflow-hidden border-0")}>
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Separator className="my-4" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        <main>
          <Suspense fallback={<BrowserFallback />}>
            <EquipmentBrowser />
          </Suspense>
        </main>
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
      <Suspense fallback={<BrowserFallback />}>
        <EquipmentBrowser />
      </Suspense>
    </DashboardShell>
  );
}
