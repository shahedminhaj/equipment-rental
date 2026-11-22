"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { appSurfaces, roleTones } from "../data/app-theme";
import type { AuthUser } from "../lib/auth";
import { dashboardHref, type DashboardRole } from "../lib/dashboard-routes";
import { AppToneProvider } from "./dashboard-ui";

type NavItem = { label: string; href: string; icon: LucideIcon; hint?: string };
type SearchItem = NavItem & { group: "Workspace" | "Quick links" };

type Theme = {
  label: string;
  workspace: string;
  nav: NavItem[];
};

const themes: Record<DashboardRole, Theme> = {
  admin: {
    label: "Administrator",
    workspace: "Control center",
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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHref, setActiveHref] = useState(dashboardHref(role));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const theme = themes[role];
  const tone = roleTones[role];

  const searchItems = useMemo<SearchItem[]>(() => {
    const workspaceItems: SearchItem[] = theme.nav.map((item) => ({ ...item, group: "Workspace" }));
    const quickLinks: SearchItem[] = [
      { label: "Account settings", href: "/account", icon: Settings, group: "Quick links" },
    ];
    return [
      ...workspaceItems,
      ...quickLinks.filter((link) => !workspaceItems.some((item) => item.href === link.href)),
    ];
  }, [theme]);

  const results = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return searchItems.slice(0, 6);
    return searchItems
      .filter((item) =>
        [item.label, item.hint, item.href].some((value) => value?.toLowerCase().includes(term)),
      )
      .slice(0, 6);
  }, [searchItems, searchQuery]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    }
    function closeOnOutsideClick(event: PointerEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    window.addEventListener("keydown", focusSearch);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("keydown", focusSearch);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, []);

  function goToResult(item: SearchItem) {
    setSearchOpen(false);
    setSearchQuery("");
    setActiveResult(0);
    setActiveHref(item.href);
    if (item.href.startsWith("#")) {
      document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
    router.push(item.href);
  }

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchOpen(true);
      setActiveResult((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchOpen(true);
      setActiveResult((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[activeResult];
      if (selected) goToResult(selected);
    } else if (event.key === "Escape") {
      setSearchOpen(false);
      searchInputRef.current?.blur();
    }
  }

  const sidebar = (
    <div className={cn("flex h-full flex-col overflow-hidden bg-linear-to-b text-white", tone.sidebar)}>
      <Link
        href="/"
        className="group flex items-center gap-3 px-6 pt-7 pb-8 text-xl font-bold tracking-tight"
      >
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl bg-linear-to-br text-lg shadow-lg shadow-slate-950/25 transition-transform group-hover:rotate-6",
            tone.banner,
          )}
        >
          <Wrench size={20} aria-hidden="true" />
        </span>
        <span>
          fieldkit<span className="text-emerald-300">.</span>
          <small className="block text-[10px] font-medium tracking-[0.22em] text-white/50">
            {theme.workspace.toUpperCase()}
          </small>
        </span>
      </Link>

      <p className="px-6 pb-2 text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase">
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
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              {isActive ? (
                <span
                  className={cn(
                    "absolute inset-y-2 right-0 w-0.5 rounded-full bg-linear-to-b",
                    tone.panelAccent,
                  )}
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                  isActive
                    ? cn("bg-linear-to-br text-white shadow-lg shadow-black/20", tone.gradient)
                    : "bg-white/10 text-white/80",
                )}
              >
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.hint ? (
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
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
            className={cn(
              "grid size-9 place-items-center rounded-xl bg-linear-to-br shadow-lg shadow-black/20",
              tone.banner,
            )}
          >
            <LifeBuoy size={17} aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-semibold text-white">Need a hand?</p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            Browse the help center or get in touch with the Fieldkit team.
          </p>
          <Link
            href="/#how-it-works"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90 transition-colors hover:text-white"
          >
            Learn how it works <ExternalLink size={12} aria-hidden="true" />
          </Link>
        </div>
        <Separator className="bg-white/10" />
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
    <AppToneProvider tone={tone}>
      <div className={cn(appSurfaces.page, "flex")}>
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                className="absolute top-4 right-3 z-10 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </Button>
              {sidebar}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={cn(
              "sticky top-0 z-30 flex h-[74px] items-center justify-between gap-3 border-b bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8",
              appSurfaces.divider,
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label="Open navigation"
                className="shrink-0 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={18} aria-hidden="true" />
              </Button>
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
              <div ref={searchContainerRef} className="relative hidden xl:block">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-1 transition-colors",
                    searchOpen
                      ? "border-slate-300 bg-white shadow-sm"
                      : "border-slate-200 bg-slate-50/80",
                  )}
                >
                  <Search size={15} aria-hidden="true" className="shrink-0 text-slate-400" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    role="combobox"
                    aria-label="Search workspace"
                    aria-expanded={searchOpen}
                    aria-controls="workspace-search-results"
                    aria-autocomplete="list"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setActiveResult(0);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search workspace"
                    className="h-8 w-40 border-0 bg-transparent px-0 text-xs text-slate-700 shadow-none focus-visible:border-0 focus-visible:ring-0"
                  />
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                    ⌘K
                  </kbd>
                </div>

                {searchOpen ? (
                  <div
                    id="workspace-search-results"
                    role="listbox"
                    aria-label="Workspace results"
                    className="absolute top-[calc(100%+8px)] right-0 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                  >
                    <p
                      className={cn(
                        "px-2 py-1.5 text-[10px] font-bold tracking-[0.16em] uppercase",
                        tone.accentText,
                      )}
                    >
                      {searchQuery.trim() ? "Results" : "Jump to"}
                    </p>
                    {results.length === 0 ? (
                      <p className="px-2 py-6 text-center text-xs text-slate-500">
                        No matches for “{searchQuery}”
                      </p>
                    ) : (
                      results.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={`${item.group}-${item.href}`}
                            type="button"
                            role="option"
                            aria-selected={index === activeResult}
                            onMouseEnter={() => setActiveResult(index)}
                            onClick={() => goToResult(item)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                              index === activeResult ? "bg-slate-100" : "hover:bg-slate-50",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-8 shrink-0 place-items-center rounded-lg",
                                tone.iconTile,
                              )}
                            >
                              <Icon size={15} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-slate-800">
                                {item.label}
                              </span>
                              <span className="block truncate text-[10px] text-slate-500">
                                {item.group}
                                {item.hint ? ` · ${item.hint}` : ""}
                              </span>
                            </span>
                            <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  aria-controls="dashboard-notifications"
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className="relative rounded-xl border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                >
                  <Bell size={17} aria-hidden="true" />
                  <span
                    className={cn(
                      "absolute top-2 right-2 size-2 rounded-full bg-linear-to-br ring-2 ring-white",
                      tone.gradient,
                    )}
                    aria-hidden="true"
                  />
                </Button>
                {notificationsOpen ? (
                  <section
                    id="dashboard-notifications"
                    aria-label="Platform notifications"
                    className="absolute top-12 right-0 z-50 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Platform updates</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">Static help and policy notes</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                      >
                        Close
                      </button>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      <li className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-800">Secure checkout</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">Payments are completed through Stripe Checkout.</p>
                      </li>
                      <li className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-800">Listing review</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">New owner listings become visible after admin approval.</p>
                      </li>
                      <li className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-800">Rental status</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">Track payment and booking status from your dashboard.</p>
                      </li>
                    </ul>
                  </section>
                ) : null}
              </div>
              <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pr-3 pl-1.5 sm:flex">
                <Avatar className={cn("size-8 rounded-lg after:rounded-lg", "bg-linear-to-br", tone.gradient)}>
                  {user?.photo ? <AvatarImage src={user.photo} alt={user.name || "Account"} /> : null}
                  <AvatarFallback className="rounded-lg bg-transparent text-xs font-bold text-white">
                    {initialsFor(user)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[120px]">
                  <span className="block truncate text-xs font-semibold text-slate-800">
                    {user?.name || "Your account"}
                  </span>
                  <span className="block truncate text-[10px] text-slate-400">
                    {user?.email || "Signing in..."}
                  </span>
                </span>
              </div>
              <Badge variant="secondary" className={cn("hidden border-transparent ring-1 md:inline-flex", tone.softBadge)}>
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

          <main className="relative flex-1 overflow-x-clip p-4 sm:p-6 lg:p-8">
            <span className={cn(appSurfaces.pageGlow, "opacity-60")} aria-hidden="true" />
            <div className="relative z-10 space-y-6">
              <p className={appSurfaces.body}>{description}</p>

              {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className={cn(appSurfaces.card, "space-y-4 p-5")}>
                      <div className="flex items-start justify-between">
                        <Skeleton
                          className={cn("size-11 rounded-xl opacity-40", "bg-linear-to-br", tone.gradient)}
                        />
                        <Skeleton className="h-4 w-10 rounded-full bg-slate-100" />
                      </div>
                      <Skeleton className="h-3 w-24 rounded-full bg-slate-100" />
                      <Skeleton className="h-8 w-20 rounded-lg bg-slate-100" />
                      <Skeleton className="h-3 w-32 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className={cn(appSurfaces.card, "border-rose-100 bg-rose-50/80 p-6")}>
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 shrink-0 text-rose-500" size={20} aria-hidden="true" />
                    <div>
                      <h2 className="font-semibold text-rose-900">We couldn&apos;t load your workspace</h2>
                      <p className="mt-1 text-sm leading-relaxed text-rose-700">{error}</p>
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
            </div>
          </main>

          <footer
            className={cn(
              "relative flex flex-col gap-2 border-t bg-white/70 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8",
              appSurfaces.divider,
            )}
          >
            <span
              className={cn("absolute inset-x-0 top-0 h-px bg-linear-to-r", tone.panelAccent)}
              aria-hidden="true"
            />
            <span>© 2026 Fieldkit. Good gear. Better projects.</span>
            <div className="flex flex-wrap items-center gap-4">
              <Link className="inline-flex items-center gap-1 transition-colors hover:text-slate-800" href="/equipment">
                <Store size={13} aria-hidden="true" /> Browse equipment
              </Link>
              <Link className="inline-flex items-center gap-1 transition-colors hover:text-slate-800" href="/account">
                <Settings size={13} aria-hidden="true" /> Account settings
              </Link>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={13} aria-hidden="true" /> Secure workspace
              </span>
            </div>
          </footer>
        </div>
      </div>
    </AppToneProvider>
  );
}
