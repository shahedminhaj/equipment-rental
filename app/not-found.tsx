import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-[#e8ebdf] opacity-70 blur-3xl" />
      <div className="relative w-full max-w-xl rounded-[2rem] border border-[var(--line)] bg-[color:var(--card)] p-10 text-center shadow-[0_24px_80px_rgba(32,35,28,0.08)]">
        <p className="text-7xl font-semibold tracking-tight text-[var(--olive)]">404</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--ink)]">
          This page has wandered off
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          We couldn&apos;t find what you were looking for. The equipment may have been removed, or
          the link may be out of date.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className={buttonVariants({ className: "rounded-full" })} href="/">
            Back to home
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
            href="/equipment"
          >
            Explore equipment
          </Link>
        </div>
      </div>
    </main>
  );
}
