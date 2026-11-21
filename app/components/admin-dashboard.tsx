"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ClipboardCheck,
  Clock3,
  Package,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
type ManagedUser = AuthUser & { disabled?: boolean };
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

const adminGradients = {
  violet: "linear-gradient(135deg, #6366f1, #a855f7)",
  blue: "linear-gradient(135deg, #0ea5e9, #2563eb)",
  amber: "linear-gradient(135deg, #f59e0b, #f97316)",
  emerald: "linear-gradient(135deg, #10b981, #059669)",
  rose: "linear-gradient(135deg, #f43f5e, #e11d48)",
  slate: "linear-gradient(135deg, #64748b, #334155)",
};

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
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };

    async function loadAdminData() {
      setDataLoading(true);
      setDataError("");
      const [analyticsResult, equipmentResult, usersResult] = await Promise.allSettled([
        apiRequest<AdminAnalytics>("/analytics/admin", { headers }),
        apiRequest<{ items: ManagedEquipment[] }>("/admin/equipment?status=pending&limit=50", { headers }),
        apiRequest<{ items: ManagedUser[] }>("/admin/users?limit=50", { headers }),
      ]);

      if (!active) return;
      const failures: string[] = [];
      if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value);
      else failures.push("marketplace analytics");
      if (equipmentResult.status === "fulfilled") setPending(equipmentResult.value.items);
      else failures.push("review queue");
      if (usersResult.status === "fulfilled") setUsers(usersResult.value.items);
      else failures.push("user directory");

      if (failures.length > 0) {
        setDataError(
          `Could not load ${failures.join(", ")}. ${failures[0] === "marketplace analytics" && analyticsResult.status === "rejected" && analyticsResult.reason instanceof Error ? analyticsResult.reason.message : "Check the API connection and try again."}`,
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

  const stats = [
    {
      label: "Registered users",
      value: new Intl.NumberFormat("en-BD").format(analytics?.totalUsers ?? 0),
      hint: "Accounts on Fieldkit",
      icon: Users,
      gradient: adminGradients.violet,
      soft: "#f5f3ff",
    },
    {
      label: "Equipment listings",
      value: new Intl.NumberFormat("en-BD").format(analytics?.totalEquipment ?? 0),
      hint: "Across all categories",
      icon: Package,
      gradient: adminGradients.blue,
      soft: "#eff6ff",
    },
    {
      label: "Total bookings",
      value: new Intl.NumberFormat("en-BD").format(analytics?.totalBookings ?? 0),
      hint: `${analytics?.completedRentals ?? 0} completed rentals`,
      icon: ClipboardCheck,
      gradient: adminGradients.amber,
      soft: "#fffbeb",
    },
    {
      label: "Awaiting review",
      value: new Intl.NumberFormat("en-BD").format(analytics?.pendingApprovals ?? pending.length),
      hint: "Listings need a decision",
      icon: Clock3,
      gradient: adminGradients.rose,
      soft: "#fff1f2",
    },
    {
      label: "Paid revenue",
      value: formatCurrency(analytics?.totalRevenue ?? 0),
      hint: "Confirmed payments",
      icon: Wallet,
      gradient: adminGradients.emerald,
      soft: "#ecfdf5",
    },
    {
      label: "Your access",
      value: "Admin",
      hint: user?.email || "Full marketplace control",
      icon: ShieldCheck,
      gradient: adminGradients.slate,
      soft: "#f1f5f9",
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
        gradient="linear-gradient(120deg, #4338ca 0%, #7c3aed 50%, #c026d3 100%)"
        eyebrow="ADMIN CONTROL CENTER"
        title={`Welcome back, ${user?.name?.split(" ")[0] || "admin"}.`}
        description="Here's what's happening across Fieldkit today. Keep the queue clear and make sure great gear gets seen."
        action={
          <Link
            href="#review"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-lg transition-transform hover:-translate-y-0.5"
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
              soft="#f5f3ff"
              accent="#7c3aed"
              className="xl:col-span-2"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs font-semibold text-slate-500">Monthly bookings</p>
                  <MiniBars
                    color="#7c3aed"
                    items={(analytics?.monthlyBookings ?? []).map(({ month, bookings }) => ({
                      label: monthLabel(month),
                      value: bookings,
                    }))}
                  />
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold text-slate-500">Monthly revenue</p>
                  <MiniBars
                    color="#10b981"
                    formatValue={(value) => formatCurrency(value)}
                    items={(analytics?.monthlyRevenue ?? []).map(({ month, revenue }) => ({
                      label: monthLabel(month),
                      value: revenue,
                    }))}
                  />
                </div>
              </div>
            </Panel>

            <Panel title="Quick actions" subtitle="Jump into your most used tools" icon={ShieldCheck} soft="#eef2ff" accent="#4f46e5">
              <div className="space-y-3">
                {[
                  { label: "Review new listings", href: "#review", icon: ClipboardCheck, color: "#7c3aed" },
                  { label: "Manage users & roles", href: "#users", icon: Users, color: "#0ea5e9" },
                  { label: "Browse marketplace", href: "/equipment", icon: Package, color: "#10b981" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:border-slate-200 hover:bg-white"
                    >
                      <span
                        className="grid size-9 place-items-center rounded-lg text-white"
                        style={{ background: action.color }}
                      >
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-slate-700">{action.label}</span>
                      <ArrowUpRight size={15} className="text-slate-400" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
              <div
                className="mt-5 rounded-xl p-4 text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #d946ef)" }}
              >
                <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">Platform health</p>
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
            soft="#fff1f2"
            accent="#e11d48"
            action={
              <BadgeLike count={pending.length} />
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
                  <article className="rounded-xl border border-slate-200 p-4" key={item.id}>
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
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-800">
                        {formatCurrency(item.price)}
                        <span className="text-xs font-normal text-slate-400"> / day</span>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyId === item.id}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
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
            soft="#eff6ff"
            accent="#2563eb"
            action={<BadgeLike count={users.length} label="accounts" />}
          >
            {users.length === 0 ? (
              <EmptyState icon={Users} title="No users yet" description="Registered users will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] tracking-wider text-slate-400 uppercase">
                      <th className="pb-3 font-semibold">Name</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((account) => {
                      const isSelf = account.id === user?.id;
                      return (
                        <tr key={account.id} className="text-slate-600">
                          <td className="py-3 font-medium text-slate-800">{account.name}</td>
                          <td className="py-3 text-xs">{account.email}</td>
                          <td className="py-3">
                            <StatusPill value={account.disabled ? "disabled" : "active"} />
                          </td>
                          <td className="py-3">
                            <select
                              aria-label={`Role for ${account.name}`}
                              value={account.role}
                              disabled={isSelf || account.role === "admin"}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
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
                              {account.role === "admin" ? <option value="admin">Admin</option> : null}
                            </select>
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              disabled={isSelf || busyId === account.id}
                              className="text-slate-500 hover:text-rose-600"
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
        </>
      )}
    </DashboardShell>
  );
}

function BadgeLike({ count, label = "pending" }: { count: number; label?: string }) {
  return (
    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
      {count} {label}
    </span>
  );
}
