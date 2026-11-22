import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, LayoutDashboard, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "../data/app-theme";
import { SiteFooter, SiteHeader } from "../components/site-shell";

export const metadata: Metadata = {
  title: "Get Started | Fieldkit",
  description: "Create a Fieldkit account or sign in to start renting equipment.",
};

const primaryCtaClass = cn(
  "h-12 rounded-full px-6 text-sm font-semibold text-white shadow-lg shadow-[#315c3c]/20 transition-all hover:-translate-y-0.5",
  "bg-linear-to-r",
  publicTone.gradient,
  "hover:from-[#3a6a45] hover:via-[#5b8249] hover:to-[#8fb361]",
);

const secondaryCtaClass =
  "h-12 rounded-full border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-[#edf3e2] hover:text-[#315c3c]";

const steps = [
  {
    icon: Search,
    title: "Find your gear",
    detail: "Browse live listings and compare equipment near you.",
  },
  {
    icon: ShieldCheck,
    title: "Book securely",
    detail: "Checkout with Stripe and get confirmation in one place.",
  },
  {
    icon: LayoutDashboard,
    title: "Track every rental",
    detail: "Manage bookings, favorites, and your profile anytime.",
  },
] as const;

export default function GetStartedPage() {
  return (
    <>
      <SiteHeader />
      <main className={cn(appSurfaces.page, "get-started-page relative isolate flex-1 overflow-hidden")}>
        <div aria-hidden="true" className={appSurfaces.pageGlow} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 bottom-0 size-[30rem] rounded-full bg-[#d9ef94]/20 blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 left-1/2 size-[24rem] -translate-x-1/2 rounded-full bg-sky-200/40 blur-[120px]"
        />
        <div className="landing-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Badge
                variant="outline"
                className={cn(
                  "h-auto gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] uppercase",
                  publicTone.softBadge,
                )}
              >
                <Sparkles className="size-3.5" />
                Get started
              </Badge>

              <h1 className="mt-7 text-[clamp(2.8rem,6vw,4.6rem)] leading-[0.98] font-bold tracking-[-0.055em] text-slate-900">
                Good gear is
                <br />
                <span className="bg-linear-to-r from-[#315c3c] via-[#4c6d45] to-[#7ba356] bg-clip-text text-transparent">
                  one click away.
                </span>
              </h1>

              <p className={cn("mt-6 max-w-xl text-base leading-8", appSurfaces.body)}>
                Join Fieldkit to find trusted equipment, book with secure checkout, and keep every rental
                organized in one calm little corner of the internet.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/signup" className={buttonVariants({ size: "lg", className: cn(primaryCtaClass, "cta-green-link") })}>
                  Create your account
                  <ArrowUpRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className={buttonVariants({ size: "lg", variant: "outline", className: secondaryCtaClass })}
                >
                  I already have an account
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-slate-200/80 pt-7">
                <AvatarGroup>
                  {["AK", "JM", "RS", "PL"].map((initials) => (
                    <Avatar key={initials} className="size-9 ring-2 ring-white">
                      <AvatarFallback
                        className={cn(
                          "text-[10px] font-bold",
                          initials === "PL"
                            ? "bg-slate-800 text-white"
                            : "bg-linear-to-br from-[#e8efdc] to-[#d9ef94] text-[#315c3c]",
                        )}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroup>
                <p className="text-xs leading-5 text-slate-500">
                  Makers, crews, and weekend builders already rent with Fieldkit.
                </p>
              </div>
            </div>

            <Card className={cn(appSurfaces.card, "gap-0 [--card-spacing:0px]")}>
              <div className={cn("h-1.5 w-full rounded-t-3xl bg-linear-to-r", publicTone.panelAccent)} />
              <CardHeader className="p-7 pb-0 sm:p-8 sm:pb-0">
                <p className={cn(appSurfaces.eyebrow, publicTone.accentText)}>Your path</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  Three steps to your next rental
                </h2>
                <p className={cn("mt-2", appSurfaces.body)}>
                  No long setup. Just the gear you need and a clear record of every booking.
                </p>
              </CardHeader>
              <CardContent className="p-7 pt-5 sm:p-8 sm:pt-6">
                <div className="grid gap-3">
                  {steps.map((step, index) => (
                    <div
                      key={step.title}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm"
                    >
                      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", publicTone.iconTile)}>
                        <step.icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                          Step 0{index + 1}
                        </p>
                        <h3 className="mt-1 text-sm font-bold text-slate-900">{step.title}</h3>
                        <p className={cn("mt-1", appSurfaces.body)}>{step.detail}</p>
                      </div>
                      <Check className="ml-auto size-4 shrink-0 text-emerald-500" />
                    </div>
                  ))}
                </div>

                <Separator className="my-6 bg-slate-200/80" />

                <div className="rounded-2xl border border-[#dfe6d8] bg-[#f3f7ee]/80 p-4">
                  <p className="text-sm font-bold text-slate-900">Just browsing?</p>
                  <p className={cn("mt-1", appSurfaces.body)}>
                    Explore the catalog first. You can create an account when you are ready to book.
                  </p>
                  <Link
                    href="/equipment"
                    className={cn(appSurfaces.link, "mt-3 inline-flex items-center gap-1 text-sm hover:underline")}
                  >
                    Browse equipment <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
