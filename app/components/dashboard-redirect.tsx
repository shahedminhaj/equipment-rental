"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
    <div className="grid min-h-screen place-items-center bg-[#f6f7fb]">
      <div className="flex flex-col items-center gap-3 text-slate-500" role="status">
        <span className="size-7 animate-spin rounded-full border-[3px] border-slate-300 border-t-emerald-600" />
        <p className="text-sm font-medium">Opening your dashboard...</p>
      </div>
    </div>
  );
}
