"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Store,
  TriangleAlert,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "../lib/auth";
import { dashboardHref, type DashboardRole } from "../lib/dashboard-routes";

type NavItem = { label: string; href: string; icon: LucideIcon; hint?: string };

type Theme = {
  label: string;
  workspace: string;
  accent: string;
  sidebar: string;
  banner: string;
  soft: string;
  nav: NavItem[];
};

const themes: Record<DashboardRole, Theme> = {
  admin: {
    label: "Administrator",
    workspace: "Control center",
    accent: "#7c3aed",
    sidebar: "linear-gradient(180deg, #1e1b4b 0%, #312e81 45%, #0f172a 100%)",
    banner: "linear-gradient(120deg, #4f46e5 0%, #7c3aed 52%, #c026d3 100%)",
    soft: "#f5f3ff",
    nav: [
      { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "#analytics", icon: ChartNoAxesCombined, hint: "Marketplace" },
      { label: "Review queue", href: "#review", icon: ClipboardCheck, hint: "Pending" },
      { label: "Users & roles", href: "#users", icon: Users },
    ],
  },
  owner: {
    label: "Equipment owner",
    workspace: "Owner studio",
    accent: "#ea580c",
    sidebar: "linear-gradient(180deg, #431407 0%, #7c2d12 48%, #1c1917 100%)",
    banner: "linear-gradient(120deg, #f97316 0%, #ea580c 50%, #db2777 100%)",
    soft: "#fff7ed",
    nav: [
      { label: "Overview", href: "/owner/dashboard", icon: LayoutDashboard },
      { label: "Earnings", href: "#analytics", icon: ChartNoAxesCombined },
      { label: "My listings", href: "#inventory", icon: Package },
      { label: "Bookings", href: "#bookings", icon: CalendarDays },
    ],
  },
  customer: {
    label: "Renter",
    workspace: "My rental hub",
    accent: "#059669",
    sidebar: "linear-gradient(180deg, #052e2b 0%, #065f46 48%, #0f172a 100%)",
    banner: "linear-gradient(120deg, #0d9488 0%, #059669 52%, #65a30d 100%)",
    soft: "#ecfdf5",
    nav: [
      { label: "Overview", href: "/customer/dashboard", icon: LayoutDashboard },
      { label: "My rentals", href: "#rentals", icon: CalendarDays },
      { label: "Favorites", href: "#favorites", icon: Heart },
      { label: "Find equipment", href: "/equipment", icon: Store },
    ],
  },
};

function initialsFor(user: AuthUser | null) {
  if (!user?.name) return "FK";
  return user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardShell({
  role,
  user,
  title,
  description,
  isLoading = false,
  error = "",
  signOut,
  onRetry,
  children,
}: {
  role: DashboardRole;
  user: AuthUser | null;
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string;
  signOut: () => void;
  onRetry?: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHref, setActiveHref] = useState(dashboardHref(role));
  const theme = themes[role];

  const sidebar = (
    <div
      className="flex h-full flex-col overflow-hidden text-white"
      style={{ background: theme.sidebar }}
    >
      <Link
        href="/"
        className="flex items-center gap-3 px-6 pt-7 pb-8 text-xl font-bold tracking-tight"
      >
        <span
          className="grid size-10 place-items-center rounded-xl text-lg shadow-lg"
          style={{ background: theme.banner }}
        >
          <Wrench size={20} aria-hidden="true" />
        </span>
        <span>
          fieldkit<span style={{ color: "#a7f3d0" }}>.</span>
          <small className="block text-[10px] font-medium tracking-[0.22em] text-white/50">
            {theme.workspace.toUpperCase()}
          </small>
        </span>
      </Link>

      <p className="px-6 pb-2 text-[10px] font-semibold tracking-[0.2em] text-white/40">
        WORKSPACE
      </p>
      <nav className="flex flex-col gap-1 px-3" aria-label="Dashboard navigation">
        {theme.nav.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href || (!item.href.includes("#") && pathname === item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                setActiveHref(item.href);
                setMobileOpen(false);
              }}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg transition-colors"
                style={{ background: isActive ? theme.accent : "rgba(255,255,255,0.08)" }}
              >
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.hint ? (
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                  {item.hint}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span
            className="grid size-9 place-items-center rounded-xl"
            style={{ background: theme.banner }}
          >
            <LifeBuoy size={17} aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-semibold">Need a hand?</p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
           Browse the help center or get in touch with the Fieldkit team.
          </p>
          <Link
            href="/#how-it-works"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white"
          >
            Learn how it works <ExternalLink size={12} aria-hidden="true" />
          </Link>
        </div>
        <Link
          href="/"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          Back to marketplace <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f6f7fb] text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 lg:block">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[280px] shadow-2xl">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute top-4 right-3 z-10 grid size-9 place-items-center rounded-lg bg-white/10 text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                Workspace <ChevronRight size={11} aria-hidden="true" /> {theme.label}
              </div>
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-400 xl:flex">
              <Search size={15} aria-hidden="true" />
              <span>Search workspace</span>
              <kbd className="ml-6 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                ⌘K
              </kbd>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
            >
              <Bell size={17} aria-hidden="true" />
              <span
                className="absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-white"
                style={{ background: theme.accent }}
              />
            </button>
            <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pr-3 pl-1.5 sm:flex">
              <span
                className="grid size-8 place-items-center rounded-lg text-xs font-bold text-white"
                style={{ background: theme.accent }}
              >
                {initialsFor(user)}
              </span>
              <span className="max-w-[120px]">
                <span className="block truncate text-xs font-semibold text-slate-800">
                  {user?.name || "Your account"}
                </span>
                <span className="block truncate text-[10px] text-slate-400">
                  {user?.email || "Signing in..."}
                </span>
              </span>
            </div>
            <Badge className="hidden border-transparent md:inline-flex" style={{ background: theme.soft, color: theme.accent }}>
              {theme.label}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              onClick={signOut}
              className="gap-1.5 border border-rose-100 bg-rose-50 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700"
            >
              <LogOut size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <p className="text-sm text-slate-500">{description}</p>
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 text-rose-500" size={20} aria-hidden="true" />
                <div>
                  <h2 className="font-semibold text-rose-900">We couldn&apos;t load your workspace</h2>
                  <p className="mt-1 text-sm text-rose-700">{error}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {onRetry ? (
                      <Button
                        type="button"
                        onClick={onRetry}
                        className="bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Try again
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={signOut}>
                      Sign out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        <footer className="flex flex-col gap-2 border-t border-slate-200 bg-white/70 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 Fieldkit. Good gear. Better projects.</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link className="inline-flex items-center gap-1 hover:text-slate-800" href="/equipment">
              <Store size={13} aria-hidden="true" /> Browse equipment
            </Link>
            <Link className="inline-flex items-center gap-1 hover:text-slate-800" href="/account">
              <Settings size={13} aria-hidden="true" /> Account settings
            </Link>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={13} aria-hidden="true" /> Secure workspace
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
