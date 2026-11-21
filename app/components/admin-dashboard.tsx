"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ClipboardCheck,
  Clock3,
  Package,
  Pencil,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { appSurfaces, roleTones } from "../data/app-theme";
import { apiRequest, formatCurrency, type EquipmentListing } from "../lib/api";
import type { AuthUser } from "../lib/auth";
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
// The shared UI kit reads tone from context; these two props still render inline CSS.
const statGradient = "linear-gradient(135deg, #7c3aed, #d946ef, #f43f5e)";
const statSoft = "#ede9fe";
const heroGlow = "linear-gradient(135deg, #4338ca, #7c3aed, #c026d3)";

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
function monthLabel(month: string) {
  const date = new Date(`${month}-01T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? month : monthFormatter.format(date);
}

export function AdminDashboard() {
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
  const [profileName, setProfileName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePhoto(user.photo || "");
      setProfilePhone((user as AuthUser & { phone?: string }).phone || "");
      setProfileAddress((user as AuthUser & { address?: string }).address || "");
    }
  }, [user]);

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
      if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value);
      else failures.push("marketplace analytics");
      if (pendingResult.status === "fulfilled") setPending(pendingResult.value.items);
      else failures.push("review queue");
      if (allEquipmentResult.status === "fulfilled") setAllEquipment(allEquipmentResult.value.items);
      else failures.push("equipment list");
      if (usersResult.status === "fulfilled") setUsers(usersResult.value.items);
      else failures.push("user directory");
      if (bookingsResult.status === "fulfilled") setBookings(bookingsResult.value.items);
      else failures.push("rentals");

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

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setIsSavingProfile(true);
    try {
      await apiRequest("/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profileName.trim(),
          photo: profilePhoto.trim(),
          phone: profilePhone.trim(),
          address: profileAddress.trim(),
        }),
      });
      notify("Profile updated.");
      refreshSession();
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : "Could not update profile", "error");
    } finally {
      setIsSavingProfile(false);
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
      title="Admin dashboard"
      description="Review listings, manage access, and keep the marketplace running smoothly."
      isLoading={isLoading}
      error={error}
      signOut={signOut}
      onRetry={refreshSession}
    >
      <HeroBanner
        gradient={heroGlow}
        eyebrow="ADMIN CONTROL CENTER"
        title={`Welcome back, ${user?.name?.split(" ")[0] || "admin"}.`}
        description="Here's what's happening across Fieldkit today. Keep the queue clear and make sure great gear gets seen."
        action={
          <Link
            href="#review"
            className={`inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5 ${tone.accentText}`}
          >
            Review pending listings <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        }
      />

      {dataError ? <PanelError message={dataError} /> : null}

      {dataLoading ? (
        <PanelLoading label="Loading marketplace analytics..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Panel
              id="analytics"
              title="Marketplace analytics"
              subtitle="Bookings and paid revenue over the last 12 months"
              icon={TrendingUp}
              soft={tone.iconTile}
              accent={tone.panelAccent}
              className="xl:col-span-2"
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

            <Panel title="Quick actions" subtitle="Jump into your most used tools" icon={ShieldCheck} soft={tone.iconTile} accent={tone.panelAccent}>
              <div className="space-y-3">
                {[
                  { label: "Review new listings", href: "#review", icon: ClipboardCheck },
                  { label: "Manage users & roles", href: "#users", icon: Users },
                  { label: "All equipment", href: "#all-equipment", icon: Package },
                  { label: "All rentals", href: "#all-rentals", icon: ClipboardCheck },
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
                          className="border-rose-200 text-rose-600 hover:bg-rose-50"
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
                              className="text-slate-500 hover:bg-rose-50 hover:text-rose-600"
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
            title="All equipment"
            subtitle="Approve, reject, update, or delete any listing"
            icon={Package}
            soft={tone.iconTile}
            accent={tone.panelAccent}
            action={<Badge variant="secondary" className={`h-auto rounded-full px-3 py-1 ${tone.softBadge}`}>{allEquipment.length} items</Badge>}
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
                              <Button size="xs" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" disabled={busyId === item.id} onClick={() => updateRequest(`/admin/equipment/${item.id}/status`, { status: "rejected" }, "Listing rejected.", item.id)}>Reject</Button>
                            ) : null}
                            <Button size="xs" variant="ghost" disabled={busyId === item.id} onClick={() => {
                              const name = window.prompt("Equipment name", item.name);
                              if (name === null) return;
                              const price = window.prompt("Rental price", String(item.price));
                              if (price === null) return;
                              updateRequest(`/equipment/${item.id}`, { name: name.trim(), price: Number(price) }, "Equipment updated.", item.id);
                            }}><Pencil size={14} /></Button>
                            <Button size="xs" variant="ghost" className="text-rose-600 hover:bg-rose-50" disabled={busyId === item.id} onClick={() => void deleteEquipment(item.id)}><Trash2 size={14} /></Button>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            id="profile"
            title="My profile"
            subtitle="Update your admin profile information"
            icon={ShieldCheck}
            soft={tone.iconTile}
            accent={tone.panelAccent}
          >
            <form className="grid max-w-2xl gap-4 md:grid-cols-2" onSubmit={saveProfile}>
              <div className="grid gap-2">
                <Label htmlFor="admin-name" className="text-xs font-semibold text-slate-700">Name</Label>
                <Input id="admin-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-email" className="text-xs font-semibold text-slate-700">Email</Label>
                <Input id="admin-email" value={user?.email || ""} readOnly />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="admin-photo" className="text-xs font-semibold text-slate-700">Profile image URL</Label>
                <Input id="admin-photo" value={profilePhoto} onChange={(e) => setProfilePhoto(e.target.value)} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-phone" className="text-xs font-semibold text-slate-700">Phone number</Label>
                <Input id="admin-phone" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-address" className="text-xs font-semibold text-slate-700">Address</Label>
                <Input id="admin-address" value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={isSavingProfile} className={`bg-linear-to-r text-white ${tone.gradient}`}>
                  {isSavingProfile ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </form>
          </Panel>
        </>
      )}
    </DashboardShell>
  );
}
