"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteContent } from "../data/site-content";
import { AUTH_CHANGED_EVENT, clearAuth, type AuthUser } from "../lib/auth";
import { dashboardHref } from "../lib/dashboard-routes";
import { useToast } from "./toast-provider";

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Fieldkit home">
      <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-violet-600 via-fuchsia-600 to-rose-500 text-white shadow-lg shadow-fuchsia-500/25 transition-transform group-hover:rotate-6">
        <svg viewBox="0 0 36 36" fill="none" className="size-5">
          <path
            d="M7 25.5 18 7l11 18.5H7Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M12 25.5 18 15l6 10.5M18 7v5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={`text-xl font-black tracking-[-0.06em] ${light ? "text-white" : "text-slate-900"}`}
      >
        fieldkit<span className="text-violet-500">.</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ authPage = false }: { authPage?: boolean }) {
  const router = useRouter();
  const { notify } = useToast();
  const [role, setRole] = useState<AuthUser["role"] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function syncRole() {
      const storedRole = window.localStorage.getItem("fieldkit_user_role");
      setRole(
        storedRole === "customer" || storedRole === "owner" || storedRole === "admin"
          ? storedRole
          : null
      );
    }

    syncRole();
    window.addEventListener(AUTH_CHANGED_EVENT, syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  function signOut() {
    clearAuth();
    setMenuOpen(false);
    router.push("/");
    notify("You have been signed out.", "info");
  }

  const dashboardPath = dashboardHref(role);
  const header = siteContent.header;
  const roleLabel = role ? header.roles[role] : header.roles.customer;
  const announcement = siteContent.announcement;

  return (
    <>
      <div className="relative overflow-hidden bg-linear-to-r from-violet-700 via-fuchsia-600 to-rose-500 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative mx-auto flex min-h-9 max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-6 py-2 text-center text-[11px] font-medium">
          <Sparkles className="size-3.5 shrink-0 text-amber-200" aria-hidden="true" />
          <span>{announcement.text}</span>
          <Link href={announcement.href} className="inline-flex items-center gap-1 font-bold underline underline-offset-4">
            {announcement.linkLabel}
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
          <BrandMark />

          {authPage ? (
            <Link
              href="/"
              className={buttonVariants({
                size: "sm",
                variant: "ghost",
                className: "rounded-full text-slate-600",
              })}
            >
              ← {header.backToHome}
            </Link>
          ) : (
            <>
              <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
                {siteContent.navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3 py-2 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-700"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="hidden items-center gap-2 lg:flex">
                {role ? (
                  <>
                    <Badge className="rounded-full bg-violet-100 text-violet-700 hover:bg-violet-100">
                      {roleLabel}
                    </Badge>
                    <Link
                      href={dashboardPath}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                        className: "rounded-full",
                      })}
                    >
                      {header.dashboard}
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={signOut}
                      className="rounded-full text-slate-600"
                    >
                      {header.signOut}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={buttonVariants({
                        size: "sm",
                        variant: "ghost",
                        className: "rounded-full text-slate-700",
                      })}
                    >
                      {header.signIn}
                    </Link>
                    <Link
                      href="/signup"
                      className={buttonVariants({
                        size: "sm",
                        className:
                          "rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20 hover:from-violet-500 hover:to-fuchsia-500",
                      })}
                    >
                      {header.getStarted}
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </>
                )}
              </div>

              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger
                  render={<Button variant="outline" size="icon" className="rounded-xl lg:hidden" />}
                  aria-label={header.openMenu}
                >
                  <Menu className="size-4" />
                </SheetTrigger>
                <SheetContent side="right" className="w-[86%] bg-white p-0">
                  <SheetHeader className="border-b border-slate-100 px-5 py-5">
                    <SheetTitle>
                      <BrandMark />
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      {header.mobileDescription}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
                    {siteContent.navigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-violet-50 hover:text-violet-700"
                      >
                        {item.label}
                      </Link>
                    ))}

                    {role && (
                      <Link
                        href={dashboardPath}
                        onClick={() => setMenuOpen(false)}
                        className="rounded-xl px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                      >
                        {roleLabel} {header.dashboardSuffix}
                      </Link>
                    )}
                  </div>
                  <div className="space-y-2 border-t border-slate-100 p-5">
                    {role ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={signOut}
                        className="w-full rounded-full"
                      >
                        {header.signOut}
                      </Button>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setMenuOpen(false)}
                          className={buttonVariants({
                            variant: "outline",
                            className: "w-full rounded-full",
                          })}
                        >
                          {header.signIn}
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setMenuOpen(false)}
                          className={buttonVariants({
                            className:
                              "w-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white",
                          })}
                        >
                          {header.getStarted}
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  const footer = siteContent.footer;

  return (
    <footer className="relative isolate overflow-hidden bg-[#0b1020] pt-16 text-white">
      <div className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-fuchsia-600/15 blur-[110px]" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <BrandMark light />
          <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">{footer.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {siteContent.hero.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium text-slate-300"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {footer.columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-xs font-bold tracking-[0.16em] text-violet-300 uppercase">
              {column.title}
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-violet-500/15 to-fuchsia-500/10 p-5">
          <p className="text-[10px] font-bold tracking-[0.18em] text-violet-300">
            {footer.noteLabel}
          </p>
          <p className="mt-3 text-lg leading-7 font-bold">
            {footer.noteLead}
            <br />
            <span className="bg-linear-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              {footer.noteAccent}
            </span>
          </p>
          <Link
            href="/equipment"
            className={buttonVariants({
              size: "sm",
              className: "mt-5 rounded-full bg-white text-slate-900 hover:bg-slate-100",
            })}
          >
            {footer.ctaLabel}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-14 flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-6 text-[11px] text-slate-500">
        <span>{footer.copyright}</span>
        <span>{footer.signoff}</span>
      </div>
    </footer>
  );
}
