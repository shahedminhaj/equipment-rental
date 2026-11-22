import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "./data/app-theme";

export default function Loading() {
  return (
    <main
      className={cn(
        appSurfaces.page,
        "relative isolate flex min-h-[70vh] items-center justify-center overflow-hidden px-6 py-24",
      )}
    >
      <div aria-hidden="true" className={appSurfaces.pageGlow} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -bottom-40 size-[26rem] rounded-full bg-sky-200/50 blur-[120px]"
      />
      <Card
        className={cn(
          appSurfaces.card,
          "relative w-full max-w-lg gap-0 overflow-hidden text-center",
        )}
      >
        <div
          aria-hidden="true"
          className={cn("h-1 w-full bg-linear-to-r", publicTone.gradient)}
        />
        <CardContent className="px-8 pt-9 pb-10 sm:px-12">
          <Link href="/" aria-label="Fieldkit home" className="mx-auto mb-8 inline-flex w-fit items-center gap-2">
            <span
              className={cn(
                "grid size-10 place-items-center rounded-2xl bg-linear-to-br text-white shadow-md",
                publicTone.gradient,
              )}
            >
              <svg viewBox="0 0 36 36" fill="none" className="size-5" aria-hidden="true">
                <path
                  d="M7 25.5 18 7l11 18.5H7Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 25.5 18 15l6 10.5M18 7v5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              fieldkit<span className="text-[#4c6d45]">.</span>
            </span>
          </Link>

          <span
            className={cn(
              "mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-linear-to-br text-white shadow-lg",
              publicTone.gradient,
            )}
          >
            <PackageOpen className="size-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Getting your gear ready
          </h1>
          <p className={cn(appSurfaces.body, "mx-auto mt-3 max-w-md")}>
            We&apos;re loading the latest equipment, prices, and availability.
          </p>
          <div className="mx-auto mt-8 max-w-sm space-y-3" role="status" aria-label="Loading page">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-4/5 rounded-full" />
            <Skeleton className="h-3 w-2/3 rounded-full" />
          </div>
          <Link
            className={buttonVariants({
              variant: "outline",
              className:
                "mt-8 h-10 rounded-full border-slate-200 bg-white px-6 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
            })}
            href="/equipment"
          >
            Browse equipment
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
