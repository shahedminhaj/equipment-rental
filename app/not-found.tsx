import Link from "next/link";
import { Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "./data/app-theme";

export default function NotFound() {
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
          "relative w-full max-w-xl gap-0 overflow-hidden text-center",
        )}
      >
        <div
          aria-hidden="true"
          className={cn("h-1 w-full bg-linear-to-r", publicTone.gradient)}
        />
        <CardContent className="px-8 pt-9 pb-10 sm:px-12">
          <span
            className={cn(
              "mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-linear-to-br text-white shadow-lg",
              publicTone.gradient,
            )}
          >
            <Compass className="size-7" aria-hidden="true" />
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "mx-auto mb-5 h-auto rounded-full px-3 py-1 text-xs font-bold tracking-[0.16em] ring-1",
              publicTone.softBadge,
            )}
          >
            404
          </Badge>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            This page has wandered off
          </h1>
          <p className={cn(appSurfaces.body, "mx-auto mt-4 max-w-md")}>
            We couldn&apos;t find what you were looking for. The equipment may have been removed, or
            the link may be out of date.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              className={cn(
                buttonVariants({ className: "h-10 rounded-full px-6 text-white shadow-lg shadow-fuchsia-500/20" }),
                "bg-linear-to-r hover:from-violet-500 hover:via-fuchsia-500 hover:to-rose-400",
                publicTone.gradient,
              )}
              href="/"
            >
              Back to home
            </Link>
            <Link
              className={buttonVariants({
                variant: "outline",
                className:
                  "h-10 rounded-full border-slate-200 bg-white px-6 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
              })}
              href="/equipment"
            >
              Explore equipment
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
