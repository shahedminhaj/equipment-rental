"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getStoredToken } from "../lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

export function PrivateRouteGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setAllowed(true);
  }, [pathname, router]);

  if (!allowed) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="aspect-[16/10] w-full rounded-3xl" />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
