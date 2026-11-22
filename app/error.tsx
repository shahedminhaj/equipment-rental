"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "./data/app-theme";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
        className="pointer-events-none absolute -right-32 -bottom-40 size-[26rem] rounded-full bg-[#d9ef94]/20 blur-[120px]"
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
            <TriangleAlert className="size-7" aria-hidden="true" />
          </span>
          <p className={cn(appSurfaces.eyebrow, "text-[#4c6d45]")}>Something went wrong</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            We couldn&apos;t load this page
          </h1>
          <p className={cn(appSurfaces.body, "mx-auto mt-4 max-w-md")}>
            The request may have timed out or the service is temporarily unavailable. Please try
            again, or head back to the catalog.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              className={cn(
                "h-10 rounded-full bg-linear-to-r px-6 text-white shadow-lg shadow-[#315c3c]/15",
                "hover:from-[#3a6a45] hover:via-[#5b8249] hover:to-[#8fb361]",
                publicTone.gradient,
              )}
              type="button"
              onClick={reset}
            >
              Try again
            </Button>
            <Link
              className={buttonVariants({
                variant: "outline",
                className:
                  "h-10 rounded-full border-slate-200 bg-white px-6 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
              })}
              href="/equipment"
            >
              Browse equipment
            </Link>
          </div>
          {error.digest ? (
            <p className="mt-6 text-xs text-slate-400">Reference: {error.digest}</p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
