"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  Package,
  Plus,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, formatCurrency, type EquipmentListing } from "../lib/api";
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
type OwnerBooking = {
  id: string;
  equipmentName: string;
  bookingStatus: string;
  paymentStatus: string;
  rentalStartDate: string;
  rentalEndDate: string;
  totalAmount: number;
  customer?: { name?: string; email?: string } | null;
};
type OwnerAnalytics = {
  totalListedEquipment: number;
  completedRentals: number;
  totalEarnings: number;
  monthlyEarnings: { month: string; earnings: number }[];
};

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
function monthLabel(month: string) {
  const date = new Date(`${month}-01T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? month : monthFormatter.format(date);
}

export function OwnerDashboard() {
  const { user, token, isLoading, error, signOut, refreshSession } = useDashboardSession("owner");
  const { notify } = useToast();
  const [analytics, setAnalytics] = useState<OwnerAnalytics | null>(null);
  const [listings, setListings] = useState<ManagedEquipment[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [editValues, setEditValues] = useState<Record<string, { price: string; quantity: string }>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };

    async function loadOwnerData() {
      setDataLoading(true);
      setDataError("");
      const [analyticsResult, listingsResult, bookingsResult] = await Promise.allSettled([
        apiRequest<OwnerAnalytics>("/analytics/owner", { headers }),
        apiRequest<{ items: ManagedEquipment[] }>("/equipment/owner/mine", { headers }),
        apiRequest<{ items: OwnerBooking[] }>("/bookings/owner", { headers }),
      ]);

      if (!active) return;
      const failures: string[] = [];
      if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value);
      else failures.push("earnings analytics");
      if (listingsResult.status === "fulfilled") {
        setListings(listingsResult.value.items);
        setEditValues(
          Object.fromEntries(
            listingsResult.value.items.map((item) => [
              item.id,
              { price: String(item.price), quantity: String(item.availableQuantity) },
            ]),
          ),
        );
      } else failures.push("your listings");
      if (bookingsResult.status === "fulfilled") setBookings(bookingsResult.value.items);
      else failures.push("rental requests");

      if (failures.length > 0) {
        const firstError =
          analyticsResult.status === "rejected" && analyticsResult.reason instanceof Error
            ? analyticsResult.reason.message
            : "Check the API connection and try again.";
        setDataError(`Could not load ${failures.join(", ")}. ${firstError}`);
      }
      setDataLoading(false);
    }

    void loadOwnerData();
    return () => {
      active = false;
    };
  }, [token, refreshKey]);

  async function updateRequest(path: string, options: RequestInit, message: string, id: string) {
    if (!token || busyId) return;
    setBusyId(id);
    setDataError("");
    try {
      await apiRequest(path, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}) },
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

  async function createListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || busyId) return;
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") || "").trim(),
      description: String(data.get("description") || "").trim(),
      category: String(data.get("category") || "").trim(),
      location: String(data.get("location") || "").trim(),
      image: String(data.get("image") || "").trim(),
      price: Number(data.get("price")),
      rentalType: String(data.get("rentalType")),
      availableQuantity: Number(data.get("availableQuantity")),
      condition: String(data.get("condition") || "").trim(),
    };

    setBusyId("new-listing");
    setDataError("");
    try {
      await apiRequest("/equipment", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      notify("Listing submitted. It will appear after admin approval.");
      event.currentTarget.reset();
      setShowCreateForm(false);
      setRefreshKey((key) => key + 1);
    } catch (createError) {
      const messageText = createError instanceof Error ? createError.message : "Could not create listing";
      notify(messageText, "error");
      setDataError(messageText);
    } finally {
      setBusyId("");
    }
  }

  const paidBookings = bookings.filter((booking) => booking.paymentStatus === "paid");
  const pendingBookings = paidBookings.filter((booking) => booking.bookingStatus === "pending");

  const stats = [
    {
      label: "Listed equipment",
      value: analytics?.totalListedEquipment ?? listings.length,
      hint: "Items in your inventory",
      icon: Package,
      gradient: "linear-gradient(135deg, #f97316, #ea580c)",
      soft: "#fff7ed",
    },
    {
      label: "Completed rentals",
      value: analytics?.completedRentals ?? 0,
      hint: "Successful handovers",
      icon: BadgeCheck,
      gradient: "linear-gradient(135deg, #0ea5e9, #2563eb)",
      soft: "#eff6ff",
    },
    {
      label: "Paid earnings",
      value: formatCurrency(analytics?.totalEarnings ?? 0),
      hint: "From confirmed rentals",
      icon: Wallet,
      gradient: "linear-gradient(135deg, #10b981, #059669)",
      soft: "#ecfdf5",
    },
    {
      label: "New requests",
      value: pendingBookings.length,
      hint: "Waiting for your answer",
      icon: CalendarDays,
      gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
      soft: "#fff1f2",
    },
  ];

  return (
    <DashboardShell
      role="owner"
      user={user}
      title="Owner dashboard"
      description="Grow your rental business — manage listings, earnings, and incoming requests."
      isLoading={isLoading}
      error={error}
      signOut={signOut}
      onRetry={refreshSession}
    >
      <HeroBanner
        gradient="linear-gradient(120deg, #ea580c 0%, #f97316 50%, #db2777 100%)"
        eyebrow="OWNER STUDIO"
        title={`Good to see you, ${user?.name?.split(" ")[0] || "owner"}.`}
        description="Your gear is working for you. Keep your listings fresh and respond to requests quickly to earn more."
        action={
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            {showCreateForm ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {showCreateForm ? "Close form" : "List new equipment"}
          </button>
        }
      />

      {dataError ? <PanelError message={dataError} /> : null}

      {showCreateForm ? (
        <Panel title="Create a listing" subtitle="New listings go live after admin approval" icon={Plus} soft="#fff7ed" accent="#ea580c">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={createListing}>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Equipment name
              <input name="name" required maxLength={200} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Category
              <input name="category" required maxLength={100} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Location
              <input name="location" required maxLength={200} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Image URL
              <input name="image" type="url" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Price per period (৳)
              <input name="price" type="number" min="1" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Rental type
              <select name="rentalType" defaultValue="Daily" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Available quantity
              <input name="availableQuantity" type="number" min="0" defaultValue="1" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Condition
              <input name="condition" maxLength={200} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600 md:col-span-2">
              Description
              <textarea name="description" rows={3} maxLength={5000} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={busyId === "new-listing"} className="bg-orange-600 text-white hover:bg-orange-700">
                {busyId === "new-listing" ? "Submitting..." : "Submit for approval"}
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      {dataLoading ? (
        <PanelLoading label="Loading your owner workspace..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Panel
              id="analytics"
              title="Earnings overview"
              subtitle="Your monthly rental income"
              icon={TrendingUp}
              soft="#fff7ed"
              accent="#ea580c"
              className="xl:col-span-2"
            >
              <MiniBars
                color="#f97316"
                formatValue={(value) => formatCurrency(value)}
                items={(analytics?.monthlyEarnings ?? []).map(({ month, earnings }) => ({
                  label: monthLabel(month),
                  value: earnings,
                }))}
              />
            </Panel>
            <Panel title="Business tips" subtitle="Small moves, bigger returns" icon={CircleDollarSign} soft="#ecfdf5" accent="#059669">
              <ul className="space-y-3 text-sm text-slate-600">
                {[
                  "Approved listings appear in marketplace search instantly.",
                  "Responding to requests the same day improves booking rates.",
                  "Keep prices competitive in your category to stay booked.",
                ].map((tip) => (
                  <li className="flex gap-2.5" key={tip}>
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {tip}
                  </li>
                ))}
              </ul>
              <Link
                href="/equipment"
                className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                See how others list gear <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </Panel>
          </div>

          <Panel
            id="inventory"
            title="My listings"
            subtitle="Edit prices, quantities, and remove outdated equipment"
            icon={Package}
            soft="#fff7ed"
            accent="#ea580c"
          >
            {listings.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No listings yet"
                description="Add your first piece of equipment to start earning from it."
                action={
                  <Button type="button" onClick={() => setShowCreateForm(true)} className="bg-orange-600 text-white hover:bg-orange-700">
                    <Plus size={15} aria-hidden="true" /> List equipment
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {listings.map((item) => {
                  const values = editValues[item.id] || {
                    price: String(item.price),
                    quantity: String(item.availableQuantity),
                  };
                  return (
                    <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                          <StatusPill value={item.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.category} · {item.location}
                        </p>
                      </div>
                      <form
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void updateRequest(
                            `/equipment/${item.id}`,
                            {
                              method: "PATCH",
                              body: JSON.stringify({
                                price: Number(values.price),
                                availableQuantity: Number(values.quantity),
                              }),
                            },
                            "Listing updated.",
                            item.id,
                          );
                        }}
                      >
                        <label className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                          Price
                          <input
                            type="number"
                            min="1"
                            required
                            value={values.price}
                            onChange={(event) =>
                              setEditValues((current) => ({
                                ...current,
                                [item.id]: { ...values, price: event.target.value },
                              }))
                            }
                            className="mt-1 w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800"
                          />
                        </label>
                        <label className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                          Qty
                          <input
                            type="number"
                            min="0"
                            required
                            value={values.quantity}
                            onChange={(event) =>
                              setEditValues((current) => ({
                                ...current,
                                [item.id]: { ...values, quantity: event.target.value },
                              }))
                            }
                            className="mt-1 w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800"
                          />
                        </label>
                        <Button type="submit" size="sm" disabled={busyId === item.id} className="bg-slate-900 text-white hover:bg-slate-800">
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busyId === item.id}
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            if (!window.confirm(`Delete "${item.name}"?`)) return;
                            void updateRequest(
                              `/equipment/${item.id}`,
                              { method: "DELETE" },
                              "Listing deleted.",
                              item.id,
                            );
                          }}
                        >
                          Delete
                        </Button>
                      </form>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel
            id="bookings"
            title="Rental requests"
            subtitle="Paid bookings for your equipment"
            icon={CalendarDays}
            soft="#eff6ff"
            accent="#2563eb"
          >
            {paidBookings.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No paid bookings yet"
                description="Once a renter completes checkout for your gear, the request will appear here."
              />
            ) : (
              <div className="space-y-3">
                {paidBookings.map((booking) => (
                  <article key={booking.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{booking.equipmentName}</h3>
                          <StatusPill value={booking.bookingStatus} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.rentalStartDate} → {booking.rentalEndDate} ·{" "}
                          {booking.customer?.name || booking.customer?.email || "Customer"}
                        </p>
                      </div>
                      <strong className="text-sm text-slate-900">{formatCurrency(booking.totalAmount)}</strong>
                    </div>
                    {booking.bookingStatus === "pending" ? (
                      <div className="mt-4 flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyId === booking.id}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() =>
                            updateRequest(
                              `/bookings/${booking.id}/status`,
                              { method: "PATCH", body: JSON.stringify({ bookingStatus: "confirmed" }) },
                              "Booking confirmed.",
                              booking.id,
                            )
                          }
                        >
                          Confirm
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === booking.id}
                          className="border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={() =>
                            updateRequest(
                              `/bookings/${booking.id}/status`,
                              { method: "PATCH", body: JSON.stringify({ bookingStatus: "rejected" }) },
                              "Booking rejected.",
                              booking.id,
                            )
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </DashboardShell>
  );
}
