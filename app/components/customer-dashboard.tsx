"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  CircleDollarSign,
  Heart,
  PackageSearch,
  Sparkles,
  Tractor,
  Truck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, formatCurrency, type EquipmentListing } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import {
  EmptyState,
  HeroBanner,
  Panel,
  PanelError,
  PanelLoading,
  StatCard,
  StatusPill,
} from "./dashboard-ui";
import { useDashboardSession } from "./use-dashboard-session";

type Booking = {
  id: string;
  equipmentName: string;
  rentalStartDate: string;
  rentalEndDate: string;
  quantity: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  equipment?: { id: string; image?: string; location?: string } | null;
};
type Favorite = { favoriteId: string; equipment: EquipmentListing | null };
type Payment = { id: string; bookingId: string; status: string };

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

const categories = [
  { name: "Construction", icon: Wrench, color: "#f97316", soft: "#fff7ed" },
  { name: "Photography", icon: Camera, color: "#8b5cf6", soft: "#f5f3ff" },
  { name: "Vehicles", icon: Truck, color: "#0ea5e9", soft: "#f0f9ff" },
  { name: "Agriculture", icon: Tractor, color: "#059669", soft: "#ecfdf5" },
];

export function CustomerDashboard() {
  const { user, token, isLoading, error, signOut, refreshSession } = useDashboardSession("customer");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };

    async function loadCustomerData() {
      setDataLoading(true);
      setDataError("");
      const [bookingsResult, paymentsResult, favoritesResult] = await Promise.allSettled([
        apiRequest<{ items: Booking[] }>("/bookings/mine", { headers }),
        apiRequest<{ items: Payment[] }>("/payments/mine", { headers }),
        apiRequest<{ items: Favorite[] }>("/favorites", { headers }),
      ]);

      if (!active) return;
      const failures: string[] = [];
      if (bookingsResult.status === "fulfilled") setBookings(bookingsResult.value.items);
      else failures.push("your rentals");
      if (paymentsResult.status === "fulfilled") setPayments(paymentsResult.value.items);
      else failures.push("payments");
      if (favoritesResult.status === "fulfilled") setFavorites(favoritesResult.value.items);
      else failures.push("favorites");

      if (failures.length > 0) {
        let reason: unknown = null;
        if (bookingsResult.status === "rejected") reason = bookingsResult.reason;
        else if (paymentsResult.status === "rejected") reason = paymentsResult.reason;
        else if (favoritesResult.status === "rejected") reason = favoritesResult.reason;
        setDataError(
          `Could not load ${failures.join(", ")}. ${
            reason instanceof Error ? reason.message : "Check the API connection and try again."
          }`,
        );
      }
      setDataLoading(false);
    }

    void loadCustomerData();
    return () => {
      active = false;
    };
  }, [token]);

  async function removeFavorite(equipmentId: string) {
    if (!token) return;
    try {
      await apiRequest(`/favorites/${equipmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((current) => current.filter((favorite) => favorite.equipment?.id !== equipmentId));
    } catch (removeError) {
      setDataError(
        removeError instanceof Error ? removeError.message : "Could not remove this favorite.",
      );
    }
  }

  const paidBookingTotal = bookings
    .filter((booking) => booking.paymentStatus === "paid")
    .reduce((total, booking) => total + booking.totalAmount, 0);
  const activeBookings = bookings.filter((booking) =>
    ["pending", "confirmed"].includes(booking.bookingStatus.toLowerCase()),
  );
  const firstName = user?.name?.split(" ")[0] || "renter";

  const stats = [
    {
      label: "Total bookings",
      value: bookings.length,
      hint: "Everything you've reserved",
      icon: CalendarDays,
      gradient: "linear-gradient(135deg, #0d9488, #059669)",
      soft: "#ecfdf5",
    },
    {
      label: "Active rentals",
      value: activeBookings.length,
      hint: "Pending or confirmed",
      icon: PackageSearch,
      gradient: "linear-gradient(135deg, #0ea5e9, #2563eb)",
      soft: "#eff6ff",
    },
    {
      label: "Saved favorites",
      value: favorites.length,
      hint: "Gear you're watching",
      icon: Heart,
      gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
      soft: "#fff1f2",
    },
    {
      label: "Total spent",
      value: formatCurrency(paidBookingTotal),
      hint: `${payments.filter((payment) => payment.status === "paid").length} confirmed payments`,
      icon: CircleDollarSign,
      gradient: "linear-gradient(135deg, #f59e0b, #ea580c)",
      soft: "#fffbeb",
    },
  ];

  return (
    <DashboardShell
      role="customer"
      user={user}
      title="My rental dashboard"
      description="Keep track of your bookings, saved gear, and everything you need for your next project."
      isLoading={isLoading}
      error={error}
      signOut={signOut}
      onRetry={refreshSession}
    >
      <HeroBanner
        gradient="linear-gradient(120deg, #0f766e 0%, #059669 52%, #65a30d 100%)"
        eyebrow="YOUR RENTAL HUB"
        title={`Hey ${firstName}, ready for your next project?`}
        description="Find the right gear, follow your rentals, and pick up right where you left off."
      />

      {dataError ? <PanelError message={dataError} /> : null}

      {dataLoading ? (
        <PanelLoading label="Loading your rentals..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Panel
              id="rentals"
              title="Recent rentals"
              subtitle="Your latest booking activity"
              icon={CalendarDays}
              soft="#ecfdf5"
              accent="#059669"
              className="xl:col-span-2"
              action={
                <Link href="/account/rentals" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  View all <ArrowUpRight size={13} className="inline" aria-hidden="true" />
                </Link>
              }
            >
              {bookings.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No rentals yet"
                  description="Browse available equipment and book something for your next project."
                  action={
                    <Link href="/equipment" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                      Browse equipment <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <article key={booking.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{booking.equipmentName}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(booking.rentalStartDate)} → {formatDate(booking.rentalEndDate)} ·{" "}
                            {booking.quantity} {booking.quantity === 1 ? "item" : "items"}
                          </p>
                        </div>
                        <strong className="text-sm text-slate-900">{formatCurrency(booking.totalAmount)}</strong>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusPill value={booking.paymentStatus} />
                        <StatusPill value={booking.bookingStatus} />
                        {booking.equipment?.id ? (
                          <Link
                            href={`/equipment/${booking.equipment.id}`}
                            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            View gear <ArrowUpRight size={13} aria-hidden="true" />
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Quick actions" subtitle="Get things done faster" icon={Sparkles} soft="#ecfdf5" accent="#059669">
              <div className="space-y-3">
                {[
                  { label: "Browse all equipment", href: "/equipment", color: "#059669", icon: PackageSearch },
                  { label: "Manage account details", href: "/account/profile", color: "#0ea5e9", icon: Wrench },
                  { label: "View payment receipts", href: "/account/rentals", color: "#f59e0b", icon: CircleDollarSign },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:border-slate-200 hover:bg-white"
                    >
                      <span className="grid size-9 place-items-center rounded-lg text-white" style={{ background: action.color }}>
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-slate-700">{action.label}</span>
                      <ArrowUpRight size={15} className="text-slate-400" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </Panel>
          </div>

          <Panel
            id="favorites"
            title="Favorite equipment"
            subtitle="Gear you saved for later"
            icon={Heart}
            soft="#fff1f2"
            accent="#e11d48"
            action={
              <Link href="/account/favorites" className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Manage <ArrowUpRight size={13} className="inline" aria-hidden="true" />
              </Link>
            }
          >
            {favorites.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Nothing saved yet"
                description="Tap the heart on any listing to keep it here for later."
                action={
                  <Link href="/equipment" className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600">
                    Explore equipment <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.slice(0, 6).map((favorite) => {
                  const item = favorite.equipment;
                  if (!item) return null;
                  return (
                    <article key={favorite.favoriteId} className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="relative h-32 overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="p-4">
                        <h3 className="truncate text-sm font-semibold text-slate-900">{item.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">{item.category} · {item.location}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <strong className="text-sm text-emerald-700">{formatCurrency(item.price)}</strong>
                          <div className="flex items-center gap-2">
                            <Link href={`/equipment/${item.id}`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                              View
                            </Link>
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              className="text-rose-500 hover:bg-rose-50"
                              onClick={() => removeFavorite(item.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Explore by category" subtitle="Find gear for whatever you're making" icon={PackageSearch} soft="#eff6ff" accent="#2563eb">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.name}
                    href="/equipment"
                    className="rounded-xl border border-slate-200 p-4 transition-transform hover:-translate-y-1 hover:shadow-md"
                  >
                    <span className="grid size-10 place-items-center rounded-xl" style={{ background: category.soft, color: category.color }}>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-800">{category.name}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                      Explore <ArrowUpRight size={12} aria-hidden="true" />
                    </p>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </>
      )}
    </DashboardShell>
  );
}
