import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Loading() {
  return (
    <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[var(--lime)] opacity-30 blur-3xl" />
      <div className="relative w-full max-w-lg rounded-[2rem] border border-[var(--line)] bg-[color:var(--card)] p-10 text-center shadow-[0_24px_80px_rgba(32,35,28,0.08)]">
        <Link className="brand mx-auto mb-8 w-fit" href="/" aria-label="Fieldkit home">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 36 36" fill="none">
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
          <span>
            fieldkit<span className="brand-period">.</span>
          </span>
        </Link>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--olive-dark)]" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Getting your gear ready
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          We&apos;re loading the latest equipment, prices, and availability.
        </p>
        <Link
          className={buttonVariants({ variant: "outline", className: "mt-8 rounded-full" })}
          href="/equipment"
        >
          Browse equipment
        </Link>
      </div>
    </main>
  );
}
