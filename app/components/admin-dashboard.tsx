"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ClipboardCheck,
  Clock3,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { appSurfaces, roleTones } from "../data/app-theme";
import { apiRequest, formatCurrency, type EquipmentListing } from "../lib/api";
import type { AuthUser } from "../lib/auth";
import { AdminEquipmentDialog, type AdminEquipmentForm } from "./admin-equipment-dialog";
import { DashboardShell } from "./dashboard-shell";
import {
  EmptyState,
  HeroBanner,
  MiniBars,
  Panel,
  PanelError,
  PanelLoading,
  StatCard,
  StatusPill,
} from "./dashboard-ui";
import { useToast } from "./toast-provider";
import { useDashboardSession } from "./use-dashboard-session";

type ManagedEquipment = EquipmentListing & { status: "pending" | "approved" | "rejected" };
type ManagedUser = AuthUser & { disabled?: boolean; createdAt?: string; phone?: string; address?: string; photo?: string };
type AdminBooking = {
  id: string;
  rentalStartDate: string;
  rentalEndDate: string;
  quantity?: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  customer?: { name?: string; email?: string };
  owner?: { name?: string; email?: string };
  equipment?: { name?: string };
};
type AdminAnalytics = {
  totalUsers: number;
  totalEquipment: number;
  totalBookings: number;
  pendingApprovals: number;
  completedRentals: number;
  totalRevenue: number;
  monthlyBookings: { month: string; bookings: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
};

const tone = roleTones.admin;
const statGradient = "linear-gradient(135deg, #315c3c, #4c6d45, #7ba356)";
const statSoft = "#edf3e2";
const statPalettes = [
  { gradient: "linear-gradient(135deg, #315c3c, #6f9b5c)", soft: "#edf5e8" },
  { gradient: "linear-gradient(135deg, #285d8d, #5c9bc5)", soft: "#edf5fb" },
  { gradient: "linear-gradient(135deg, #70479b, #a66dc3)", soft: "#f4eef9" },
];
const heroGlow = "linear-gradient(135deg, #1b3224, #315c3c, #4c6d45)";

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
function monthLabel(month: string) {
  const date = new Date(`${month}-01T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? month : monthFormatter.format(date);
}

export function AdminDashboard({ section = "overview" }: { section?: "overview" | "analytics" | "review" | "users" | "equipment" | "rentals" }) {
  const { user, token, isLoading, error, signOut, refreshSession } = useDashboardSession("admin");
  const { notify } = useToast();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [pending, setPending] = useState<ManagedEquipment[]>([]);
  const [allEquipment, setAllEquipment] = useState<ManagedEquipment[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [equipmentDialog, setEquipmentDialog] = useState<{ mode: "create" } | { mode: "edit"; item: ManagedEquipment } | null>(null);
  const [equipmentDialogError, setEquipmentDialogError] = useState("");
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);
  useEffect(() => {
    if (!token) return;
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };

    async function loadAdminData() {
      setDataLoading(true);
      setDataError("");
      const [analyticsResult, pendingResult, allEquipmentResult, usersResult, bookingsResult] = await Promise.allSettled([
        apiRequest<AdminAnalytics>("/analytics/admin", { headers }),
        apiRequest<{ items: ManagedEquipment[] }>("/admin/equipment?status=pending&limit=50", { headers }),
        apiRequest<{ items: ManagedEquipment[] }>("/admin/equipment?limit=50", { headers }),
        apiRequest<{ items: ManagedUser[] }>("/admin/users?limit=50", { headers }),
        apiRequest<{ items: AdminBooking[] }>("/bookings/admin", { headers }),
      ]);

      if (!active) return;
      const failures: string[] = [];
      const failureDetail = (result: PromiseSettledResult<unknown>) =>
        result.status === "rejected" && result.reason instanceof Error
          ? `: ${result.reason.message}`
          : "";
      if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value);
      else failures.push(`marketplace analytics${failureDetail(analyticsResult)}`);
      if (pendingResult.status === "fulfilled") setPending(pendingResult.value.items);
      else failures.push(`review queue${failureDetail(pendingResult)}`);
      if (allEquipmentResult.status === "fulfilled") setAllEquipment(allEquipmentResult.value.items);
      else failures.push(`equipment list${failureDetail(allEquipmentResult)}`);
      if (usersResult.status === "fulfilled") setUsers(usersResult.value.items);
      else failures.push(`user directory${failureDetail(usersResult)}`);
      if (bookingsResult.status === "fulfilled") setBookings(bookingsResult.value.items);
      else failures.push(`rentals${failureDetail(bookingsResult)}`);

      if (failures.length > 0) {
        setDataError(
          `Could not load ${failures.join(", ")}. Check the API connection and try again.`,
        );
      }
      setDataLoading(false);
    }

    void loadAdminData();
    return () => {
      active = false;
    };
  }, [token, refreshKey]);

  async function updateRequest(path: string, body: object, message: string, id: string) {
    if (!token || busyId) return;
    setBusyId(id);
    setDataError("");
    try {
      await apiRequest(path, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      notify(message);
      setRefreshKey((key) => key + 1);
    } catch (actionError) {
      const messageText = actionError instanceof Error ? actionError.message : "Action failed";
      notify(messageText, "error");
      setDataError(messageText);
    } finally {
      setBusyId("");
    }
  }

  async function deleteEquipment(id: string) {
    if (!token || busyId) return;
    if (!window.confirm("Delete this equipment listing?")) return;
    setBusyId(id);
    setDataError("");
    try {
      await apiRequest(`/equipment/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      notify("Equipment deleted.");
      setRefreshKey((key) => key + 1);
    } catch (actionError) {
      const messageText = actionError instanceof Error ? actionError.message : "Could not delete equipment";
      notify(messageText, "error");
      setDataError(messageText);
    } finally {
      setBusyId("");
    }
  }

  async function saveEquipment(values: AdminEquipmentForm) {
    if (!token || isSavingEquipment || !equipmentDialog) return;
    setIsSavingEquipment(true);
    setEquipmentDialogError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (equipmentDialog.mode === "edit") {
        const { item } = await apiRequest<{ item: ManagedEquipment }>(`/equipment/${equipmentDialog.item.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(values),
        });
        setAllEquipment((current) => current.map((existing) => existing.id === item.id ? item : existing));
        setPending((current) => current.map((existing) => existing.id === item.id ? item : existing));
        notify("Equipment details updated.");
      } else {
        const { item } = await apiRequest<{ item: ManagedEquipment }>("/admin/equipment", {
          method: "POST",
          headers,
          body: JSON.stringify(values),
        });
        setAllEquipment((current) => [item, ...current]);
        notify("Equipment added and published to the marketplace.");
      }
      setEquipmentDialog(null);
    } catch (saveError) {
      setEquipmentDialogError(saveError instanceof Error ? saveError.message : "Could not save equipment.");
    } finally {
      setIsSavingEquipment(false);
    }
  }

  const statStyle = { gradient: statGradient, soft: statSoft };
  const stats = [
    {
      label: "Registered users",
      value: new Intl.NumberFormat("en-BD").format(analytics?.totalUsers ?? 0),
      hint: "Accounts on Fieldkit",
      icon: Users,
      ...statStyle,
    },
    {
      label: "Equipment listings",
      value: new Intl.NumberFormat("en-BD").format(analytics?.totalEquipment ?? 0),
      hint: "Across all categories",
      icon: Package,
      ...statStyle,
    },
    {
      label: "Total bookings",
      value: new Intl.NumberFormat("en-BD").format(analytics?.totalBookings ?? 0),
      hint: `${analytics?.completedRentals ?? 0} completed rentals`,
      icon: ClipboardCheck,
      ...statStyle,
    },
    {
      label: "Awaiting review",
      value: new Intl.NumberFormat("en-BD").format(analytics?.pendingApprovals ?? pending.length),
      hint: "Listings need a decision",
      icon: Clock3,
      ...statStyle,
    },
    {
      label: "Paid revenue",
      value: formatCurrency(analytics?.totalRevenue ?? 0),
      hint: "Confirmed payments",
      icon: Wallet,
      ...statStyle,
    },
    {
      label: "Your access",
      value: "Admin",
      hint: user?.email || "Full marketplace control",
      icon: ShieldCheck,
      ...statStyle,
    },
  ];

  return (
    <DashboardShell
      role="admin"
      user={user}
      title={section === "overview" ? "Admin overview" : section === "analytics" ? "Marketplace analytics" : section === "review" ? "Listing review queue" : section === "users" ? "Users & roles" : section === "equipment" ? "Equipment management" : "Rental management"}
      description={section === "overview" ? "A quick snapshot of Fieldkit and shortcuts to your admin tools." : section === "analytics" ? "Track bookings and paid revenue across the marketplace." : section === "review" ? "Approve or reject equipment submitted by owners." : section === "users" ? "Manage account roles and access." : section === "equipment" ? "Review, update, and remove marketplace listings." : "Monitor rental booking activity."}
      isLoading={isLoading}
      error={error}
      signOut={signOut}
      onRetry={refreshSession}
    >
      <HeroBanner
        gradient={heroGlow}
        eyebrow={section === "overview" ? "ADMIN CONTROL CENTER" : "ADMIN WORKSPACE"}
        title={section === "overview" ? `Welcome back, ${user?.name?.split(" ")[0] || "admin"}.` : section === "analytics" ? "Marketplace at a glance" : section === "review" ? "Give new gear a review" : section === "users" ? "Manage workspace access" : section === "equipment" ? "Manage all equipment" : "All rental bookings"}
        description={section === "overview" ? "Your workspace is organized by task. Choose a section from the sidebar to get started." : section === "analytics" ? "Bookings and confirmed revenue over the last 12 months." : section === "review" ? "Review owner submissions and decide what becomes available." : section === "users" ? "Update user roles and account access." : section === "equipment" ? "Approve, reject, edit, or remove equipment listings." : "Review booking status and marketplace activity."}
        action={section === "overview" ? (
          <Link
            href="/admin/dashboard/review"
            className={`dashboard-hero-cta inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5 ${tone.accentText}`}
          >
            Review pending listings <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ) : null}
      />

      {dataError ? <PanelError message={dataError} /> : null}

      {dataLoading ? (
        <PanelLoading label="Loading marketplace analytics..." />
      ) : (
        <>
          <div className={section === "overview" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "hidden"}>
            {stats.map((stat, index) => (
              <StatCard key={stat.label} {...stat} {...statPalettes[index % statPalettes.length]} />
            ))}
          </div>

          <div className={section === "overview" || section === "analytics" ? "grid gap-5 xl:grid-cols-3" : "hidden"}>
            <Panel
              id="analytics"
              title="Marketplace analytics"
              subtitle="Bookings and paid revenue over the last 12 months"
              icon={TrendingUp}
              soft={tone.iconTile}
              accent={tone.panelAccent}
              className={section === "analytics" ? "xl:col-span-3" : "hidden"}
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className={`${appSurfaces.eyebrow} mb-3`}>Monthly bookings</p>
                  <MiniBars
                    color={tone.bar}
                    items={(analytics?.monthlyBookings ?? []).map(({ month, bookings }) => ({
                      label: monthLabel(month),
                      value: bookings,
                    }))}
                  />
                </div>
                <div>
                  <p className={`${appSurfaces.eyebrow} mb-3`}>Monthly revenue</p>
                  <MiniBars
                    color={tone.bar}
                    formatValue={(value) => formatCurrency(value)}
                    items={(analytics?.monthlyRevenue ?? []).map(({ month, revenue }) => ({
                      label: monthLabel(month),
                      value: revenue,
                    }))}
                  />
                </div>
              </div>
            </Panel>

            <Panel title="Quick actions" subtitle="Jump into your most used tools" icon={ShieldCheck} soft={tone.iconTile} accent={tone.panelAccent} className={section === "overview" ? "" : "hidden"}>
              <div className="space-y-3">
                {[
                  { label: "Review new listings", href: "/admin/dashboard/review", icon: ClipboardCheck },
                  { label: "Manage users & roles", href: "/admin/dashboard/users", icon: Users },
                  { label: "All equipment", href: "/admin/dashboard/equipment", icon: Package },
                  { label: "All rentals", href: "/admin/dashboard/rentals", icon: ClipboardCheck },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                    >
                      <span className={`grid size-9 place-items-center rounded-lg ${tone.iconTile}`}>
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-slate-700">{action.label}</span>
                      <ArrowUpRight size={15} className="text-slate-400" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
              <Separator className="my-5 bg-slate-200/80" />
              <div className={`rounded-xl bg-linear-to-br p-4 text-white ${tone.gradient}`}>
                <p className="text-[10px] font-bold tracking-[0.18em] text-white/70 uppercase">Platform health</p>
                <p className="mt-2 text-sm leading-relaxed">
                  {pending.length === 0
                    ? "All caught up — nothing is waiting for approval."
                    : `${pending.length} listing${pending.length === 1 ? "" : "s"} waiting for your review.`}
                </p>
              </div>
            </Panel>
          </div>

          <Panel
            id="review"
            className={section === "review" ? "" : "hidden"}
            title="Listing review queue"
            subtitle="Approve or reject newly submitted equipment"
            icon={ClipboardCheck}
            soft={tone.iconTile}
            accent={tone.panelAccent}
            action={
              <Badge variant="secondary" className={`h-auto rounded-full px-3 py-1 ${tone.softBadge}`}>
                {pending.length} pending
              </Badge>
            }
          >
            {pending.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="Queue is clear"
                description="New owner submissions will show up here for approval."
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {pending.map((item) => (
                  <article className={`${appSurfaces.softCard} p-4 transition-colors hover:border-slate-300`} key={item.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.category} · {item.location}
                        </p>
                      </div>
                      <StatusPill value={item.status} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {item.description || "No description provided."}
                    </p>
                    <Separator className="my-4 bg-slate-200/80" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.price)}
                        <span className="text-xs font-normal text-slate-400"> / day</span>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyId === item.id}
                          className={`bg-linear-to-r text-white shadow-sm hover:brightness-110 ${tone.gradient}`}
                          onClick={() =>
                            updateRequest(
                              `/admin/equipment/${item.id}/status`,
                              { status: "approved" },
                              "Listing approved and published.",
                              item.id,
                            )
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === item.id}
                          className="border-[#f0d6d3] text-[#9a3f37] hover:bg-[#fff7f6]"
                          onClick={() =>
                            updateRequest(
                              `/admin/equipment/${item.id}/status`,
                              { status: "rejected" },
                              "Listing rejected.",
                              item.id,
                            )
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            id="users"
            className={section === "users" ? "" : "hidden"}
            title="Users & roles"
            subtitle="Change roles or disable accounts when needed"
            icon={Users}
            soft={tone.iconTile}
            accent={tone.panelAccent}
            action={<Badge variant="secondary" className={`h-auto rounded-full px-3 py-1 ${tone.softBadge}`}>{users.length} accounts</Badge>}
          >
            {users.length === 0 ? (
              <EmptyState icon={Users} title="No users yet" description="Registered users will appear here." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase">
                      <th className="px-4 py-3 font-bold">Name</th>
                      <th className="px-4 py-3 font-bold">Email</th>
                      <th className="px-4 py-3 font-bold">Registration Date</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Role</th>
                      <th className="px-4 py-3 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((account) => {
                      const isSelf = account.id === user?.id;
                      return (
                        <tr key={account.id} className={`${appSurfaces.body} transition-colors hover:bg-slate-50/60`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar size="sm" className={tone.softBadge}>
                                <AvatarFallback className={`bg-transparent text-[10px] font-bold ${tone.accentText}`}>
                                  {account.name
                                    .split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part[0]?.toUpperCase())
                                    .join("") || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-900">{account.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">{account.email}</td>
                          <td className="px-4 py-3 text-xs">{account.createdAt ? new Date(account.createdAt).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3">
                            <StatusPill value={account.disabled ? "disabled" : "active"} />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Role for ${account.name}`}
                              value={account.role}
                              disabled={isSelf || account.role === "admin"}
                              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-slate-300 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                              onChange={(event) =>
                                updateRequest(
                                  `/admin/users/${account.id}/role`,
                                  { role: event.target.value },
                                  `Role updated to ${event.target.value}.`,
                                  account.id,
                                )
                              }
                            >
                              <option value="customer">Customer</option>
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              disabled={isSelf || busyId === account.id}
                              className="text-slate-500 hover:bg-[#fff7f6] hover:text-[#9a3f37]"
                              onClick={() =>
                                updateRequest(
                                  `/admin/users/${account.id}/status`,
                                  { disabled: !account.disabled },
                                  account.disabled ? "Account enabled." : "Account disabled.",
                                  account.id,
                                )
                              }
                            >
                              {account.disabled ? "Enable" : "Disable"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            id="all-equipment"
            className={section === "equipment" ? "" : "hidden"}
            title="All equipment"
            subtitle="Approve, reject, update, or delete any listing"
            icon={Package}
            soft={tone.iconTile}
            accent={tone.panelAccent}
            action={(
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`h-auto rounded-full px-3 py-1 ${tone.softBadge}`}>{allEquipment.length} items</Badge>
                <Button type="button" size="sm" onClick={() => { setEquipmentDialogError(""); setEquipmentDialog({ mode: "create" }); }} className={`rounded-xl bg-linear-to-r text-white ${tone.gradient}`}>
                  <Plus size={15} aria-hidden="true" /> Add equipment
                </Button>
              </div>
            )}
          >
            {allEquipment.length === 0 ? (
              <EmptyState icon={Package} title="No equipment yet" description="Equipment listings will appear here." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase">
                      <th className="px-4 py-3 font-bold">Name</th>
                      <th className="px-4 py-3 font-bold">Category</th>
                      <th className="px-4 py-3 font-bold">Price</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allEquipment.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.location}</p>
                        </td>
                        <td className="px-4 py-3 text-xs">{item.category}</td>
                        <td className="px-4 py-3 text-xs">{formatCurrency(item.price)} / {item.rentalType}</td>
                        <td className="px-4 py-3"><StatusPill value={item.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {item.status !== "approved" ? (
                              <Button size="xs" className={`bg-linear-to-r text-white ${tone.gradient}`} disabled={busyId === item.id} onClick={() => updateRequest(`/admin/equipment/${item.id}/status`, { status: "approved" }, "Listing approved.", item.id)}>Approve</Button>
                            ) : null}
                            {item.status !== "rejected" ? (
                              <Button size="xs" variant="outline" className="border-[#f0d6d3] text-[#9a3f37] hover:bg-[#fff7f6]" disabled={busyId === item.id} onClick={() => updateRequest(`/admin/equipment/${item.id}/status`, { status: "rejected" }, "Listing rejected.", item.id)}>Reject</Button>
                            ) : null}
                            <Button size="xs" variant="ghost" aria-label={`Edit ${item.name}`} title="Edit equipment" disabled={busyId === item.id} onClick={() => { setEquipmentDialogError(""); setEquipmentDialog({ mode: "edit", item }); }}><Pencil size={14} /></Button>
                            <Button size="xs" variant="ghost" className="text-[#9a3f37] hover:bg-[#fff7f6]" disabled={busyId === item.id} onClick={() => void deleteEquipment(item.id)}><Trash2 size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            id="all-rentals"
            className={section === "rentals" ? "" : "hidden"}
            title="All rentals"
            subtitle="Monitor all rental booking activity"
            icon={ClipboardCheck}
            soft={tone.iconTile}
            accent={tone.panelAccent}
            action={<Badge variant="secondary" className={`h-auto rounded-full px-3 py-1 ${tone.softBadge}`}>{bookings.length} bookings</Badge>}
          >
            {bookings.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No rentals yet" description="Booking records will appear here." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase">
                      <th className="px-4 py-3 font-bold">Customer</th>
                      <th className="px-4 py-3 font-bold">Owner</th>
                      <th className="px-4 py-3 font-bold">Equipment</th>
                      <th className="px-4 py-3 font-bold">Duration</th>
                      <th className="px-4 py-3 font-bold">Amount</th>
                      <th className="px-4 py-3 font-bold">Payment</th>
                      <th className="px-4 py-3 font-bold">Booking</th>
                      <th className="px-4 py-3 font-bold">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-xs">{booking.customer?.name || booking.customer?.email || "Customer"}</td>
                        <td className="px-4 py-3 text-xs">{booking.owner?.name || booking.owner?.email || "Owner"}</td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-900">{booking.equipment?.name || "Equipment"}</td>
                        <td className="px-4 py-3 text-xs">{booking.rentalStartDate} to {booking.rentalEndDate}</td>
                        <td className="px-4 py-3 text-xs">{formatCurrency(booking.totalAmount)}</td>
                        <td className="px-4 py-3"><StatusPill value={booking.paymentStatus} /></td>
                        <td className="px-4 py-3"><StatusPill value={booking.bookingStatus} /></td>
                        <td className="px-4 py-3">
                          {!["completed", "cancelled", "rejected"].includes(booking.bookingStatus) ? (
                            <select
                              aria-label={`Update booking status for ${booking.equipment?.name || "equipment"}`}
                              value=""
                              disabled={busyId === booking.id}
                              onChange={(event) => {
                                const bookingStatus = event.target.value;
                                if (bookingStatus) updateRequest(`/bookings/${booking.id}/status`, { bookingStatus }, `Booking ${bookingStatus}.`, booking.id);
                              }}
                              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
                            >
                              <option value="">Change status</option>
                              <option value="confirmed">Confirm</option>
                              <option value="completed">Mark complete</option>
                              <option value="cancelled">Cancel</option>
                            </select>
                          ) : <span className="text-xs text-slate-400">No actions</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

      </>
      )}
      <AdminEquipmentDialog
        open={Boolean(equipmentDialog)}
        item={equipmentDialog?.mode === "edit" ? equipmentDialog.item : undefined}
        error={equipmentDialogError}
        isSaving={isSavingEquipment}
        onOpenChange={(open) => {
          if (!open && !isSavingEquipment) {
            setEquipmentDialog(null);
            setEquipmentDialogError("");
          }
        }}
        onSubmit={saveEquipment}
      />
    </DashboardShell>
  );
}
