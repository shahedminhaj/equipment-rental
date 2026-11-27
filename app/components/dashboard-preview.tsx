"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Heart,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { appSurfaces, roleTones } from "../data/app-theme";
import type { AuthUser } from "../lib/auth";
import type { DashboardRole } from "../lib/dashboard-routes";
import { cn } from "@/lib/utils";
import { DashboardShell } from "./dashboard-shell";

type PreviewNavItem = { label: string; href: string; icon: LucideIcon };

type PreviewRole = {
  label: string;
  user: AuthUser;
  title: string;
  description: string;
  nav: PreviewNavItem[];
  highlights: { title: string; description: string; icon: LucideIcon }[];
};

const previewRoles: Record<DashboardRole, PreviewRole> = {
  customer: {
    label: "Customer",
    user: {
      id: "preview-customer",
      name: "Renta Friend",
      email: "customer@preview.fieldkit",
      role: "customer",
    },
    title: "My rental overview",
    description:
      "A renter workspace with quick access to bookings, favorites, reviews, and the equipment catalog.",
    nav: [
      { label: "Overview", href: "/customer/dashboard", icon: LayoutDashboard },
      { label: "My rentals", href: "/account/rentals", icon: CalendarDays },
      { label: "Reviews", href: "/account/reviews", icon: Star },
      { label: "Favorites", href: "/account/favorites", icon: Heart },
      { label: "Find equipment", href: "/equipment", icon: Package },
      { label: "Profile", href: "/account/profile", icon: Settings },
    ],
    highlights: [
      {
        title: "Track every rental",
        description: "See pending, confirmed, and completed bookings in one place.",
        icon: CalendarDays,
      },
      {
        title: "Save what you love",
        description: "Keep favorite equipment close while you compare options.",
        icon: Heart,
      },
      {
        title: "Shop with confidence",
        description: "Browse approved listings from verified local owners.",
        icon: ShieldCheck,
      },
    ],
  },
  owner: {
    label: "Owner",
    user: {
      id: "preview-owner",
      name: "Gear Owner",
      email: "owner@preview.fieldkit",
      role: "owner",
    },
    title: "Owner overview",
    description:
      "An owner studio for managing listings, responding to bookings, and following rental earnings.",
    nav: [
      { label: "Overview", href: "/owner/dashboard", icon: LayoutDashboard },
      { label: "Earnings", href: "/owner/dashboard/earnings", icon: Wallet },
      { label: "My listings", href: "/owner/dashboard/listings", icon: Package },
      { label: "Bookings", href: "/owner/dashboard/bookings", icon: CalendarDays },
      { label: "Profile", href: "/account/profile", icon: Settings },
    ],
    highlights: [
      {
        title: "Manage inventory",
        description: "Create, update, and retire equipment listings with clear status.",
        icon: Package,
      },
      {
        title: "Answer requests",
        description: "Review paid booking requests and keep renters up to date.",
        icon: CalendarDays,
      },
      {
        title: "Follow earnings",
        description: "Monitor completed rentals and monthly income at a glance.",
        icon: Wallet,
      },
    ],
  },
  admin: {
    label: "Admin",
    user: {
      id: "preview-admin",
      name: "Fieldkit Admin",
      email: "admin@preview.fieldkit",
      role: "admin",
    },
    title: "Admin overview",
    description:
      "A control center for approvals, marketplace analytics, user roles, equipment, and rentals.",
    nav: [
      { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/dashboard/analytics", icon: Wallet },
      { label: "Review queue", href: "/admin/dashboard/review", icon: Check },
      { label: "Users & roles", href: "/admin/dashboard/users", icon: Users },
      { label: "Equipment", href: "/admin/dashboard/equipment", icon: Package },
      { label: "Rentals", href: "/admin/dashboard/rentals", icon: CalendarDays },
      { label: "Profile", href: "/account/profile", icon: Settings },
    ],
    highlights: [
      {
        title: "Review submissions",
        description: "Approve or reject new equipment before it appears publicly.",
        icon: Check,
      },
      {
        title: "Understand the market",
        description: "Track bookings, revenue, and category growth over time.",
        icon: Wallet,
      },
      {
        title: "Manage access",
        description: "Adjust account roles and keep the marketplace trustworthy.",
        icon: Users,
      },
    ],
  },
};

const roleOrder: DashboardRole[] = ["customer", "owner", "admin"];

export function DashboardPreview({ initialRole = "customer" }: { initialRole?: DashboardRole }) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<DashboardRole>(initialRole);
  const preview = previewRoles[activeRole];
  const tone = roleTones[activeRole];

  return (
    <DashboardShell
      role={activeRole}
      user={preview.user}
      title={preview.title}
      description={preview.description}
      signOut={() => router.push("/login")}
    >
      <section aria-labelledby="dashboard-preview-heading">
        <div className={cn(appSurfaces.card, "relative overflow-hidden p-6 sm:p-8")}>
          <div className={cn(appSurfaces.pageGlow, "opacity-60")} aria-hidden="true" />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className={appSurfaces.eyebrow}>ROLE-BASED DASHBOARD LAYOUT</p>
              <h2
                id="dashboard-preview-heading"
                className="mt-2 text-2xl font-bold tracking-tight text-[#17241b] sm:text-3xl"
              >
                One responsive workspace. Three role-aware views.
              </h2>
              <p className={cn(appSurfaces.body, "mt-3")}>
                Switch between Customer, Owner, and Admin. The sidebar navigation, topbar badge,
                accent color, and page content all update with the selected role.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Preview dashboard role">
              {roleOrder.map((role) => (
                <Button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  variant={role === activeRole ? "default" : "outline"}
                  className={cn(
                    "rounded-xl px-4",
                    role === activeRole
                      ? cn("border-transparent bg-linear-to-r text-white", tone.gradient)
                      : "border-[#d7dfd1] bg-white text-[#465448] hover:bg-[#f4f7f0]",
                  )}
                >
                  {previewRoles[role].label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className={cn(appSurfaces.card, "gap-0 overflow-hidden")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={appSurfaces.eyebrow}>SIDEBAR NAVIGATION</p>
                  <h3 className="mt-1 text-lg font-bold text-[#17241b]">
                    {preview.label} workspace links
                  </h3>
                </div>
                <Badge variant="secondary" className={cn("rounded-full", tone.softBadge)}>
                  {preview.nav.length} links
                </Badge>
              </div>
              <nav className="mt-5 grid gap-2 sm:grid-cols-2" aria-label={`${preview.label} preview navigation`}>
                {preview.nav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-xl border border-[#e3e9df] bg-[#fbfcf8] px-3 py-3 text-sm font-semibold text-[#465448] transition-colors hover:border-[#cfe0bf] hover:bg-white"
                    >
                      <span className={cn("grid size-8 place-items-center rounded-lg", tone.iconTile)}>
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span className="flex-1">{item.label}</span>
                      <ArrowUpRight
                        size={14}
                        className="text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          <Card className={cn(appSurfaces.card, "gap-0 overflow-hidden")}>
            <CardContent className="p-6">
              <p className={appSurfaces.eyebrow}>RESPONSIVE SHELL</p>
              <h3 className="mt-1 text-lg font-bold text-[#17241b]">
                Built for every screen
              </h3>
              <ul className="mt-5 space-y-4">
                {[
                  "Fixed sidebar on desktop with role-specific sections",
                  "Topbar with search, inbox, and account menu",
                  "Slide-out navigation drawer on mobile and tablets",
                  "Role badge and accent color that follow the active workspace",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#5c675c]">
                    <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", tone.iconTile)}>
                      <Check size={13} aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-center gap-2 rounded-xl bg-[#f4f7f0] px-3 py-2.5 text-xs text-[#5c675c]">
                <Menu size={14} aria-hidden="true" />
                Resize the browser to see the mobile menu button appear.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {preview.highlights.map((highlight) => {
            const Icon = highlight.icon;
            return (
              <Card key={highlight.title} className={cn(appSurfaces.card, "gap-0")}>
                <CardContent className="p-6">
                  <span
                    className={cn(
                      "grid size-11 place-items-center rounded-xl bg-linear-to-br text-white shadow-md",
                      tone.gradient,
                    )}
                  >
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-[#17241b]">{highlight.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#5c675c]">{highlight.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}
