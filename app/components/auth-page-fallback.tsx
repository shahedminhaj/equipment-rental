import { SiteFooter, SiteHeader } from "./site-shell";

/** Shared placeholder while the URL-specific `next` param streams in. */
export function AuthPageFallback() {
  return (
    <>
      <SiteHeader authPage />
      <main className="account-page signup-page">
        <div
          className="mx-auto w-full max-w-md space-y-4 px-4 py-16"
          role="status"
          aria-label="Loading sign-in form"
        >
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-200/80" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
