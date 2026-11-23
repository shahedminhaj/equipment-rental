"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Star,
  Package,
  Search,
  Send,
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
import { getStoredToken, type AuthUser } from "../lib/auth";
import { apiRequest } from "../lib/api";
import { dashboardHref, type DashboardRole } from "../lib/dashboard-routes";
import { AppToneProvider } from "./dashboard-ui";

type NavItem = { label: string; href: string; icon: LucideIcon; hint?: string };
type SearchItem = NavItem & { group: "Workspace" | "Quick links" };
type DashboardNotification = {
  id: string;
  messageId: string;
  type: string;
  direction: "sent" | "received";
  senderName: string;
  senderRole: DashboardRole;
  recipientName: string;
  recipientRole: DashboardRole;
  subject: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
};
type NotificationRecipient = Pick<AuthUser, "id" | "name" | "email" | "role"> & { disabled?: boolean };

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
      { label: "Analytics", href: "/admin/dashboard/analytics", icon: ChartNoAxesCombined, hint: "Marketplace" },
      { label: "Review queue", href: "/admin/dashboard/review", icon: ClipboardCheck, hint: "Pending" },
      { label: "Users & roles", href: "/admin/dashboard/users", icon: Users },
      { label: "Equipment", href: "/admin/dashboard/equipment", icon: Package },
      { label: "Rentals", href: "/admin/dashboard/rentals", icon: CalendarDays },
      { label: "Profile", href: "/account/profile", icon: Settings },
    ],
  },
  owner: {
    label: "Equipment owner",
    workspace: "Owner studio",
    nav: [
      { label: "Overview", href: "/owner/dashboard", icon: LayoutDashboard },
      { label: "Earnings", href: "/owner/dashboard/earnings", icon: ChartNoAxesCombined },
      { label: "My listings", href: "/owner/dashboard/listings", icon: Package },
      { label: "Bookings", href: "/owner/dashboard/bookings", icon: CalendarDays },
      { label: "Profile", href: "/account/profile", icon: Settings },
    ],
  },
  customer: {
    label: "Renter",
    workspace: "My rental hub",
    nav: [
      { label: "Overview", href: "/customer/dashboard", icon: LayoutDashboard },
      { label: "My rentals", href: "/account/rentals", icon: CalendarDays },
      { label: "Reviews", href: "/account/reviews", icon: Star },
      { label: "Favorites", href: "/account/favorites", icon: Heart },
      { label: "Find equipment", href: "/equipment", icon: Store },
      { label: "Profile", href: "/account/profile", icon: Settings },
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationNotice, setNotificationNotice] = useState("");
  const [notificationRecipients, setNotificationRecipients] = useState<NotificationRecipient[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [notificationSubject, setNotificationSubject] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const theme = themes[role];
  const tone = roleTones[role];
  const userId = user?.id;

  useEffect(() => {
    const dashboardPath = dashboardHref(role);
    const syncActiveLink = () =>
      setActiveHref(
        pathname === dashboardPath ? window.location.hash || dashboardPath : dashboardPath,
      );
    syncActiveLink();
    window.addEventListener("hashchange", syncActiveLink);
    return () => window.removeEventListener("hashchange", syncActiveLink);
  }, [pathname, role]);

  const searchItems = useMemo<SearchItem[]>(() => {
    const workspaceItems: SearchItem[] = theme.nav.map((item) => ({ ...item, group: "Workspace" }));
    const quickLinks: SearchItem[] = [
      { label: "Profile", href: "/account/profile", icon: Settings, group: "Quick links" },
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
      const target = event.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }

    window.addEventListener("keydown", focusSearch);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("keydown", focusSearch);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    let refreshing = false;
    const token = getStoredToken();
    if (!token) return;

    async function refreshInbox() {
      if (refreshing) return;
      refreshing = true;
      try {
        const response = await apiRequest<{ items: DashboardNotification[]; unreadCount: number }>("/notifications/mine?limit=30", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        const unread = response.items.filter((item) => !item.readAt);
        setNotifications(response.items);
        if (notificationsOpen && response.unreadCount > 0) {
          await apiRequest("/notifications/read-all", {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!active) return;
          const checkedAt = new Date().toISOString();
          const unreadIds = new Set(unread.map((item) => item.id));
          setNotifications((items) => items.map((item) =>
            unreadIds.has(item.id) ? { ...item, readAt: checkedAt } : item,
          ));
          setUnreadCount(0);
        } else {
          setUnreadCount(response.unreadCount);
        }
        if (notificationsOpen) setNotificationError("");
      } catch (loadError) {
        if (active && notificationsOpen) {
          setNotificationError(loadError instanceof Error ? loadError.message : "Could not load notifications.");
        }
      } finally {
        refreshing = false;
        if (active && notificationsOpen) setNotificationLoading(false);
      }
    }

    void refreshInbox();
    const timer = window.setInterval(() => void refreshInbox(), 20_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [notificationsOpen, userId]);

  useEffect(() => {
    if (!notificationsOpen || role !== "admin") return;
    let active = true;
    const token = getStoredToken();
    if (!token) return;
    apiRequest<{ items: NotificationRecipient[] }>("/admin/users?limit=100", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ items }) => {
        if (!active) return;
        const recipients = items.filter((item) => item.role !== "admin" && !item.disabled);
        setNotificationRecipients(recipients);
        setRecipientId((current) => current || recipients[0]?.id || "");
      })
      .catch((loadError) => {
        if (active) setNotificationError(loadError instanceof Error ? loadError.message : "Could not load users.");
      });
    return () => {
      active = false;
    };
  }, [notificationsOpen, role]);

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
      setNotificationsOpen(false);
      setProfileOpen(false);
      searchInputRef.current?.blur();
    }
  }

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) {
      setNotificationError("Please sign in again to send a message.");
      return;
    }
    setIsSendingNotification(true);
    setNotificationError("");
    setNotificationNotice("");
    try {
      const { notification } = await apiRequest<{ notification: DashboardNotification }>("/notifications", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: notificationSubject.trim(),
          message: notificationMessage.trim(),
          ...(role === "admin" ? { recipientId } : {}),
        }),
      });
      setNotifications((items) => [notification, ...items.filter((item) => item.id !== notification.id)]);
      setNotificationLoading(false);
      setNotificationSubject("");
      setNotificationMessage("");
      setNotificationNotice("Message sent and saved in your activity history.");
    } catch (sendError) {
      setNotificationError(sendError instanceof Error ? sendError.message : "Could not send your message.");
    } finally {
      setIsSendingNotification(false);
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
            "grid size-10 place-items-center rounded-xl bg-linear-to-br text-lg shadow-lg shadow-black/20 transition-transform group-hover:-translate-y-px",
            tone.gradient,
          )}
        >
          <Wrench size={20} aria-hidden="true" />
        </span>
        <span>
          fieldkit<span className="text-[#d9ef94]">.</span>
          <small className="block text-[10px] font-medium tracking-[0.22em] text-white/55">
            {theme.workspace.toUpperCase()}
          </small>
        </span>
      </Link>

      <p className="px-6 pb-2 text-[10px] font-semibold tracking-[0.2em] text-white/45 uppercase">
        WORKSPACE
      </p>
      <nav className="flex flex-col gap-1 px-3" aria-label="Dashboard navigation">
        {theme.nav.map((item) => {
          const Icon = item.icon;
          const isSectionLink = item.href.startsWith("#");
          const isEquipmentLink = item.href === "/equipment";
          const isDashboardHomeLink = item.href === dashboardHref(role);
          const isActive = isSectionLink
            ? pathname === dashboardHref(role) && activeHref === item.href
            : isEquipmentLink
              ? pathname === item.href || pathname.startsWith(`${item.href}/`)
              : isDashboardHomeLink
                ? pathname === item.href && activeHref === item.href
                : pathname === item.href;
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
                  ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                  : "text-white/72 hover:bg-white/8 hover:text-white",
              )}
            >
              {isActive ? (
                <span
                  className="absolute inset-y-2 right-0 w-0.5 rounded-full bg-[#d9ef94]"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                  isActive ? "bg-white/14 text-[#d9ef94]" : "bg-white/8 text-white/80",
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
        <Separator className="bg-white/10" />
        <Link
          href="/"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-white/65 transition-colors hover:bg-white/8 hover:text-white"
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
              className="absolute inset-0 bg-[#17241b]/55 backdrop-blur-sm"
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
          <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between gap-3 border-b border-white/10 bg-linear-to-r from-[#17291d] via-[#1b3224] to-[#244733] px-4 shadow-md shadow-[#102017]/15 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label="Open navigation"
                className="shrink-0 rounded-xl border-[#d7dfd1] bg-white text-[#315c3c] hover:bg-[#edf3e2] lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={18} aria-hidden="true" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/60 uppercase">
                  Workspace <ChevronRight size={11} className="text-white/35" aria-hidden="true" /> <span className="text-[#d9ef94]">{theme.label}</span>
                </div>
                <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
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
                      ? "border-[#c7d4c0] bg-white shadow-sm"
                      : "border-[#dfe6d8] bg-[#fbfcf8]",
                  )}
                >
                  <Search size={15} aria-hidden="true" className="shrink-0 text-[#6d786d]" />
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
                    className="h-8 w-40 border-0 bg-transparent px-0 text-xs text-[#17241b] shadow-none focus-visible:border-0 focus-visible:ring-0"
                  />
                  <kbd className="rounded border border-[#dfe6d8] bg-white px-1.5 py-0.5 text-[10px] text-[#6d786d]">
                    ⌘K
                  </kbd>
                </div>

                {searchOpen ? (
                  <div
                    id="workspace-search-results"
                    role="listbox"
                    aria-label="Workspace results"
                    className="absolute top-[calc(100%+8px)] right-0 z-50 w-72 overflow-hidden rounded-2xl border border-[#dfe6d8] bg-white p-2 shadow-xl"
                  >
                    <p className={cn("px-2 py-1.5 text-[10px] font-bold tracking-[0.16em] uppercase", tone.accentText)}>
                      {searchQuery.trim() ? "Results" : "Jump to"}
                    </p>
                    {results.length === 0 ? (
                      <p className="px-2 py-6 text-center text-xs text-[#6d786d]">
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
                              index === activeResult ? "bg-[#f1f4ee]" : "hover:bg-[#f8faf6]",
                            )}
                          >
                            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tone.iconTile)}>
                              <Icon size={15} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-[#17241b]">
                                {item.label}
                              </span>
                              <span className="block truncate text-[10px] text-[#6d786d]">
                                {item.group}
                                {item.hint ? ` · ${item.hint}` : ""}
                              </span>
                            </span>
                            <ChevronRight size={14} className="text-[#8a978a]" aria-hidden="true" />
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>

              <div className="relative" ref={notificationContainerRef}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  aria-controls="dashboard-notifications"
                  onClick={() => {
                    setProfileOpen(false);
                    const nextOpen = !notificationsOpen;
                    if (nextOpen) setNotificationLoading(true);
                    setNotificationsOpen(nextOpen);
                  }}
                  className="relative rounded-xl border-[#d7dfd1] bg-white text-[#526052] hover:bg-[#edf3e2]"
                >
                  <Bell size={17} aria-hidden="true" />
                  {unreadCount > 0 ? (
                    <span className="absolute top-1.5 right-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white" aria-label={`${unreadCount} unread notifications`}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </Button>
                {notificationsOpen ? (
                  <section
                    id="dashboard-notifications"
                    aria-label="Notifications and messages"
                    className="absolute top-12 right-0 z-50 max-h-[min(42rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-[#dfe6d8] bg-white text-left shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-[#edf1e9] px-4 py-3">
                      <div>
                        <h2 className="text-sm font-bold text-[#17241b]">Messages</h2>
                        <p className="mt-0.5 text-[11px] text-[#6d786d]">{role === "admin" ? "Inbox and user messages" : "Inbox and admin support"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-[#315c3c] hover:bg-[#edf3e2]"
                      >
                        Close
                      </button>
                    </div>
                    {notificationError ? (
                      <p className="mx-4 mt-3 rounded-xl border border-[#f0d6d3] bg-[#fff7f6] px-3 py-2 text-xs text-[#9a3f37]" role="alert">{notificationError}</p>
                    ) : null}
                    {notificationNotice ? (
                      <p className="mx-4 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800" role="status">{notificationNotice}</p>
                    ) : null}
                    <div className="border-b border-[#edf1e9] px-4 py-3">
                      <h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#526052]">
                        <MessageSquareText size={14} aria-hidden="true" /> Messages & activity
                      </h3>
                      {notificationLoading ? (
                        <p className="py-4 text-center text-xs text-[#6d786d]">Loading messages...</p>
                      ) : notifications.length === 0 ? (
                        <p className="rounded-xl bg-[#f8faf6] px-3 py-4 text-center text-xs text-[#6d786d]">No messages yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {notifications.map((notification) => {
                            const activityLabel: Record<string, string> = {
                              message: "Message",
                              booking_request: "Rental request",
                              booking_status: "Booking update",
                              equipment_request: "Listing request",
                              equipment_status: "Listing update",
                              account_role: "Account update",
                              account_status: "Account update",
                            };
                            const dateLabel = new Intl.DateTimeFormat(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(notification.createdAt));
                            return (
                              <li key={notification.id} className="rounded-xl border border-[#e1e9dc] bg-linear-to-br from-white to-[#f5f8ef] p-3 shadow-sm shadow-[#1b3224]/5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <p className="truncate text-xs font-bold text-[#17241b]">{notification.subject}</p>
                                      <Badge variant="secondary" className="h-auto rounded-full bg-[#eaf2e5] px-2 py-0.5 text-[9px] font-semibold text-[#426543]">
                                        {activityLabel[notification.type] || "Activity"}
                                      </Badge>
                                    </div>
                                    <p className="mt-1 text-[10px] text-[#6d786d]">
                                      {notification.direction === "sent"
                                        ? `Sent to ${notification.recipientName || (role === "admin" ? "user" : "admin team")}`
                                        : `From ${notification.senderName} · ${notification.senderRole}`}
                                    </p>
                                  </div>
                                  {notification.direction === "received" && !notification.readAt ? <span className="mt-1 size-2 shrink-0 rounded-full bg-rose-500" aria-label="Unread" /> : null}
                                </div>
                                <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-[#425145]">{notification.message}</p>
                                <time className="mt-2 block text-[10px] font-medium text-[#788578]" dateTime={notification.createdAt}>
                                  {dateLabel}
                                </time>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <form onSubmit={sendNotification} className="space-y-2.5 p-4">
                      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#526052]">
                        <Send size={13} aria-hidden="true" /> {role === "admin" ? "Send to a user" : "Contact admin"}
                      </h3>
                      {role === "admin" ? (
                        <select
                          required
                          value={recipientId}
                          onChange={(event) => setRecipientId(event.target.value)}
                          className="h-9 w-full rounded-lg border border-[#dfe6d8] bg-white px-2.5 text-xs text-[#17241b] outline-none focus-visible:ring-2 focus-visible:ring-[#cfe0bf]"
                        >
                          <option value="">Choose a customer or owner</option>
                          {notificationRecipients.map((recipient) => (
                            <option key={recipient.id} value={recipient.id}>{recipient.name} · {recipient.role}</option>
                          ))}
                        </select>
                      ) : null}
                      <Input
                        value={notificationSubject}
                        onChange={(event) => setNotificationSubject(event.target.value)}
                        minLength={3}
                        maxLength={100}
                        required
                        placeholder="Subject"
                        className="h-9 rounded-lg border-[#dfe6d8] bg-white text-xs text-[#17241b]"
                      />
                      <textarea
                        value={notificationMessage}
                        onChange={(event) => setNotificationMessage(event.target.value)}
                        minLength={2}
                        maxLength={1500}
                        required
                        rows={3}
                        placeholder={role === "admin" ? "Write a message to this user..." : "Write a message to the admin team..."}
                        className="w-full resize-y rounded-lg border border-[#dfe6d8] bg-white px-3 py-2 text-xs text-[#17241b] outline-none placeholder:text-[#8a978a] focus-visible:ring-2 focus-visible:ring-[#cfe0bf]"
                      />
                      <Button type="submit" size="sm" disabled={isSendingNotification || (role === "admin" && !recipientId)} className={cn("w-full rounded-lg text-white", tone.gradient)}>
                        {isSendingNotification ? "Sending..." : "Send message"}
                      </Button>
                    </form>
                  </section>
                ) : null}
              </div>

              <div className="relative" ref={profileContainerRef}>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  aria-controls="dashboard-profile-menu"
                  onClick={() => {
                    setNotificationsOpen(false);
                    setProfileOpen((open) => !open);
                  }}
                  className="h-11 cursor-pointer gap-2 rounded-xl border-[#dfe6d8] bg-white py-1.5 pr-2.5 pl-1.5 text-left hover:bg-[#f8faf6] focus-visible:ring-2 focus-visible:ring-[#cfe0bf]"
                >
                  <Avatar className={cn("size-10 rounded-full after:rounded-full bg-linear-to-br", tone.gradient)}>
                    {user?.photo ? <AvatarImage src={user.photo} alt={user.name || "Account"} /> : null}
                    <AvatarFallback className="rounded-full bg-transparent text-xs font-bold text-white">{initialsFor(user)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[150px] sm:block">
                    <span className="block truncate text-xs font-semibold text-[#17241b]">{user?.name || "Your account"}</span>
                    <span className="block max-w-[140px] truncate text-[10px] text-[#6d786d]">{user?.email || "Signing in..."}</span>
                  </span>
                </Button>
                {profileOpen ? (
                  <section id="dashboard-profile-menu" aria-label="Profile menu" className="absolute top-13 right-0 z-50 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#dfe6d8] bg-white shadow-xl">
                    <div className="flex items-center gap-3 border-b border-[#edf1e9] bg-[#fbfcf8] p-4">
                      <Avatar className={cn("size-11 rounded-xl bg-linear-to-br", tone.gradient)}>
                        {user?.photo ? <AvatarImage src={user.photo} alt={user.name || "Account"} /> : null}
                        <AvatarFallback className="rounded-xl bg-transparent text-sm font-bold text-white">{initialsFor(user)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#17241b]">{user?.name || "Your account"}</p>
                        <a href={user?.email ? `mailto:${user.email}` : undefined} className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[#6d786d] hover:text-[#315c3c]">
                          <Mail size={12} aria-hidden="true" /> {user?.email || "Email not available"}
                        </a>
                        <Badge variant="secondary" className={cn("mt-2 h-auto rounded-full px-2 py-0.5 text-[10px] capitalize", tone.softBadge)}>{role}</Badge>
                      </div>
                    </div>
                    <div className="grid gap-1 p-2">
                      <Link
                        href="/account/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#465448] hover:bg-[#edf3e2] hover:text-[#315c3c]"
                      >
                        <Settings size={15} aria-hidden="true" /> Profile
                      </Link>
                      <Button type="button" variant="ghost" onClick={signOut} className="justify-start gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#9a3f37] hover:bg-[#fff7f6] hover:text-[#8f352d]">
                        <LogOut size={15} aria-hidden="true" /> Sign out
                      </Button>
                    </div>
                  </section>
                ) : null}
              </div>
              <Badge variant="secondary" className={cn("hidden border-transparent ring-1 md:inline-flex", tone.softBadge)}>
                {theme.label}
              </Badge>
            </div>
          </header>

          <main className="relative flex-1 overflow-x-clip p-4 sm:p-6 lg:p-8">
            <span className={cn(appSurfaces.pageGlow, "opacity-70")} aria-hidden="true" />
            <div className="relative z-10 space-y-6">
              <p className={appSurfaces.body}>{description}</p>

              {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className={cn(appSurfaces.card, "space-y-4 p-5")}>
                      <div className="flex items-start justify-between">
                        <Skeleton className={cn("size-11 rounded-xl opacity-35", "bg-linear-to-br", tone.gradient)} />
                        <Skeleton className="h-4 w-10 rounded-full bg-[#edf1e9]" />
                      </div>
                      <Skeleton className="h-3 w-24 rounded-full bg-[#edf1e9]" />
                      <Skeleton className="h-8 w-20 rounded-lg bg-[#edf1e9]" />
                      <Skeleton className="h-3 w-32 rounded-full bg-[#edf1e9]" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className={cn(appSurfaces.card, "border-[#f0d6d3] bg-[#fff9f8] p-6")}>
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 shrink-0 text-[#b45247]" size={20} aria-hidden="true" />
                    <div>
                      <h2 className="font-semibold text-[#7d332d]">We couldn&apos;t load your workspace</h2>
                      <p className="mt-1 text-sm leading-relaxed text-[#8f352d]">{error}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {onRetry ? (
                          <Button
                            type="button"
                            onClick={onRetry}
                            className="bg-[#315c3c] text-white hover:bg-[#27492f]"
                          >
                            Try again
                          </Button>
                        ) : null}
                        <Button type="button" variant="outline" onClick={signOut} className="border-[#d7dfd1]">
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

          <footer className="relative flex flex-col gap-2 border-t border-white/10 bg-linear-to-r from-[#17291d] via-[#1b3224] to-[#244733] px-4 py-4 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#d9ef94]/60 to-transparent" aria-hidden="true" />
            <span>© 2026 Fieldkit. Good gear. Better projects.</span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1 text-[#d9ef94]">
                <ShieldCheck size={13} aria-hidden="true" /> Secure workspace
              </span>
            </div>
          </footer>
        </div>
      </div>
    </AppToneProvider>
  );
}
