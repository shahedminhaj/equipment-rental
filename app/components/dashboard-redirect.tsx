"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "../data/app-theme";
import { dashboardHref, type DashboardRole } from "../lib/dashboard-routes";

export function DashboardRedirect({ role }: { role?: DashboardRole }) {
  const router = useRouter();

  useEffect(() => {
    const storedRole = window.localStorage.getItem("fieldkit_user_role");
    const token = window.localStorage.getItem("fieldkit_token");
    const targetRole = role || storedRole;

    if (!token || !targetRole) {
      router.replace("/login?next=/dashboard");
      return;
    }
    router.replace(dashboardHref(targetRole));
  }, [role, router]);

  return (
    <main className={cn(appSurfaces.page, "relative isolate flex items-center justify-center overflow-hidden px-6 py-20")}>
      <div aria-hidden="true" className={appSurfaces.pageGlow} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -bottom-40 size-[26rem] rounded-full bg-sky-200/50 blur-[120px]"
      />
      <Card
        className={cn(
          appSurfaces.card,
          "relative w-full max-w-sm gap-0 p-8 text-center sm:p-10",
        )}
      >
        <CardContent className="flex flex-col items-center px-0">
          <span
            className={cn(
              "mb-6 grid size-14 place-items-center rounded-2xl bg-linear-to-br text-white shadow-lg",
              publicTone.gradient,
            )}
          >
            <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
          </span>
          <p className={cn(appSurfaces.eyebrow, "text-violet-600")}>DASHBOARD ACCESS</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Opening your dashboard...
          </h1>
          <p className={cn(appSurfaces.body, "mt-3")}>
            Just a moment while we get the right workspace ready for you.
          </p>
          <div className="mt-7 w-full space-y-3" role="status" aria-label="Loading dashboard">
            <Skeleton className="h-3 w-3/4 rounded-full" />
            <Skeleton className="h-3 w-1/2 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
