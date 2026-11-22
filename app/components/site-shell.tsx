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
import { cn } from "@/lib/utils";
import { siteContent } from "../data/site-content";
import { AUTH_CHANGED_EVENT, clearAuth, type AuthUser } from "../lib/auth";
import { dashboardHref } from "../lib/dashboard-routes";
import { useToast } from "./toast-provider";

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Fieldkit home">
      <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-[#315c3c] to-[#6f8f4c] text-[#f6f7f2] shadow-[0_10px_24px_-14px_rgba(23,36,27,0.9)] transition-transform duration-200 group-hover:-translate-y-px">
        <svg viewBox="0 0 36 36" fill="none" className="size-5" aria-hidden="true">
          <path
            d="M7 25.5 18 7l11 18.5H7Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M12 25.5 18 15l6 10.5M18 7v5"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "text-[1.35rem] font-bold tracking-[-0.055em]",
          light ? "text-[#f6f7f2]" : "text-[#17241b]",
        )}
      >
        fieldkit<span className="text-[#7ba356]">.</span>
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
          : null,
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
      <div className="bg-[#17241b] text-[#edf1e9]">
        <div className="mx-auto flex min-h-10 max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-[11px] font-medium sm:px-6">
          <Sparkles className="size-3.5 shrink-0 text-[#d9ef94]" aria-hidden="true" />
          <span className="text-[#dce4d7]">{announcement.text}</span>
          <Link
            href={announcement.href}
            className="inline-flex items-center gap-1 font-semibold text-[#d9ef94] underline decoration-[#d9ef94]/35 underline-offset-4 transition-colors hover:text-white"
          >
            {announcement.linkLabel}
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#dfe6d8] bg-[#f6f7f2]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark />

          {authPage ? (
            <Link
              href="/"
              className={buttonVariants({
                size: "sm",
                variant: "ghost",
                className:
                  "rounded-full text-[#465448] hover:bg-[#e8efdc] hover:text-[#315c3c]",
              })}
            >
              {header.backToHome}
            </Link>
          ) : (
            <>
              <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
                {siteContent.navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3.5 py-2 text-[13px] font-medium text-[#526052] transition-colors hover:bg-[#edf3e2] hover:text-[#315c3c]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="hidden items-center gap-2 lg:flex">
                {role ? (
                  <>
                    <Badge className="rounded-full border border-[#dce7cd] bg-[#edf3e2] px-3 py-1 text-[#315c3c] hover:bg-[#edf3e2]">
                      {roleLabel}
                    </Badge>
                    <Link
                      href={dashboardPath}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                        className:
                          "rounded-full border-[#d7dfd1] bg-white text-[#315c3c] hover:bg-[#edf3e2]",
                      })}
                    >
                      {header.dashboard}
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={signOut}
                      className="rounded-full text-[#5c675c] hover:bg-[#f1f4ee] hover:text-[#17241b]"
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
                        className:
                          "rounded-full text-[#465448] hover:bg-[#edf3e2] hover:text-[#315c3c]",
                      })}
                    >
                      {header.signIn}
                    </Link>
                    <Link
                      href="/signup"
                      className={buttonVariants({
                        size: "sm",
                        className:
                          "rounded-full bg-[#315c3c] px-4 text-white shadow-[0_12px_28px_-18px_rgba(49,92,60,0.85)] hover:bg-[#27492f]",
                      })}
                    >
                      {header.getStarted}
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </>
                )}
              </div>

              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl border-[#d7dfd1] bg-white text-[#315c3c] hover:bg-[#edf3e2] lg:hidden"
                    />
                  }
                  aria-label={header.openMenu}
                >
                  <Menu className="size-4" aria-hidden="true" />
                </SheetTrigger>
                <SheetContent side="right" className="w-[86%] border-l-[#dfe6d8] bg-[#f6f7f2] p-0">
                  <SheetHeader className="border-b border-[#e0e6da] px-5 py-5">
                    <SheetTitle>
                      <BrandMark />
                    </SheetTitle>
                    <SheetDescription className="text-xs text-[#6d786d]">
                      {header.mobileDescription}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
                    {siteContent.navigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="rounded-xl px-4 py-3 text-sm font-semibold text-[#465448] transition-colors hover:bg-[#edf3e2] hover:text-[#315c3c]"
                      >
                        {item.label}
                      </Link>
                    ))}

                    {role && (
                      <Link
                        href={dashboardPath}
                        onClick={() => setMenuOpen(false)}
                        className="rounded-xl bg-[#edf3e2] px-4 py-3 text-sm font-semibold text-[#315c3c]"
                      >
                        {roleLabel} {header.dashboardSuffix}
                      </Link>
                    )}
                  </div>
                  <div className="space-y-2 border-t border-[#e0e6da] p-5">
                    {role ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={signOut}
                        className="w-full rounded-full border-[#d7dfd1] bg-white text-[#465448] hover:bg-[#edf3e2]"
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
                            className:
                              "w-full rounded-full border-[#d7dfd1] bg-white text-[#465448] hover:bg-[#edf3e2]",
                          })}
                        >
                          {header.signIn}
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setMenuOpen(false)}
                          className={buttonVariants({
                            className:
                              "w-full rounded-full bg-[#315c3c] text-white hover:bg-[#27492f]",
                          })}
                        >
                          {header.getStarted}
                          <ArrowUpRight className="size-4" aria-hidden="true" />
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
    <footer className="relative isolate overflow-hidden bg-[#17241b] pt-14 text-[#f6f7f2] sm:pt-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
        <div className="absolute -top-24 left-1/4 size-80 rounded-full bg-[#d9ef94]/10 blur-[120px]" />
        <div className="absolute -right-16 bottom-0 size-72 rounded-full bg-[#4c6d45]/30 blur-[110px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.15fr]">
        <div>
          <BrandMark light />
          <p className="mt-4 max-w-xs text-sm leading-7 text-[#c5d0c1]">{footer.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {siteContent.hero.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[10px] font-medium tracking-wide text-[#dbe4d6]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {footer.columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-[11px] font-bold tracking-[0.16em] text-[#d9ef94] uppercase">
              {column.title}
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[#c5d0c1] transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#d9ef94] uppercase">
            {footer.noteLabel}
          </p>
          <p className="mt-3 text-lg leading-7 font-semibold text-white">
            {footer.noteLead}
            <br />
            <span className="text-[#d9ef94]">{footer.noteAccent}</span>
          </p>
          <Link
            href="/equipment"
            className={buttonVariants({
              size: "sm",
              className:
                "mt-5 rounded-full bg-[#d9ef94] px-4 text-[#17241b] hover:bg-[#e6f5b1]",
            })}
          >
            {footer.ctaLabel}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-12 flex w-full max-w-7xl flex-col gap-3 border-t border-white/10 px-4 py-6 text-[11px] text-[#9eac99] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>{footer.copyright}</span>
        <div className="flex items-center gap-4">
          <span>{footer.signoff}</span>
          <a
            href="https://x.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Fieldkit on X"
            className="text-[#b8c6b3] transition-colors hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
