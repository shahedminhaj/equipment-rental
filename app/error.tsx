"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

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
    <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-[var(--lime)] opacity-25 blur-3xl" />
      <div className="relative w-full max-w-xl rounded-[2rem] border border-[var(--line)] bg-[color:var(--card)] p-10 text-center shadow-[0_24px_80px_rgba(32,35,28,0.08)]">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fdece6] text-3xl text-[#9a4a2f]">
          !
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--olive)]">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)]">
          We couldn&apos;t load this page
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          The request may have timed out or the service is temporarily unavailable. Please try
          again, or head back to the catalog.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} className="rounded-full">
            Try again
          </Button>
          <Link
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
            href="/equipment"
          >
            Browse equipment
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs text-[var(--muted)]">Reference: {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
