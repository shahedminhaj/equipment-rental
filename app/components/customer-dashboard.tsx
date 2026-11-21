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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { appSurfaces, roleTones } from "../data/app-theme";
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
  createdAt?: string;
  quantity: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  equipment?: { id: string; image?: string; location?: string } | null;
};
type Favorite = { favoriteId: string; equipment: EquipmentListing | null };
type Payment = { id: string; bookingId: string; status: string };

const tone = roleTones.customer;
// The shared UI kit reads tone from context; these two props still render inline CSS.
const statGradient = "linear-gradient(135deg, #10b981, #14b8a6, #0ea5e9)";
const statSoft = "#d1fae5";
const heroGlow = "linear-gradient(135deg, #0d9488, #059669, #65a30d)";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

const categories = [
  { name: "Construction", icon: Wrench, tile: "bg-orange-50 text-orange-600", bar: "from-orange-400 to-amber-500" },
  { name: "Photography", icon: Camera, tile: "bg-violet-50 text-violet-600", bar: "from-violet-400 to-fuchsia-500" },
  { name: "Vehicles", icon: Truck, tile: "bg-sky-50 text-sky-600", bar: "from-sky-400 to-blue-500" },
  { name: "Agriculture", icon: Tractor, tile: "bg-emerald-50 text-emerald-600", bar: "from-emerald-400 to-teal-500" },
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

  const statStyle = { gradient: statGradient, soft: statSoft };
  const stats = [
    {
      label: "Total bookings",
      value: bookings.length,
      hint: "Everything you've reserved",
      icon: CalendarDays,
      ...statStyle,
    },
    {
      label: "Active rentals",
      value: activeBookings.length,
      hint: "Pending or confirmed",
      icon: PackageSearch,
      ...statStyle,
    },
    {
      label: "Saved favorites",
      value: favorites.length,
      hint: "Gear you're watching",
      icon: Heart,
      ...statStyle,
    },
    {
      label: "Total spent",
      value: formatCurrency(paidBookingTotal),
      hint: `${payments.filter((payment) => payment.status === "paid").length} confirmed payments`,
      icon: CircleDollarSign,
      ...statStyle,
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
        gradient={heroGlow}
        eyebrow="YOUR RENTAL HUB"
        title={`Hey ${firstName}, ready for your next project?`}
        description="Find the right gear, follow your rentals, and pick up right where you left off."
        action={
          <Link
            href="/equipment"
            className={`inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5 ${tone.accentText}`}
          >
            Find equipment <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        }
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
              soft={tone.iconTile}
              accent={tone.panelAccent}
              className="xl:col-span-2"
              action={
                <Link href="/account/rentals" className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:brightness-90 ${tone.accentText}`}>
                  View all <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              }
            >
              {bookings.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No rentals yet"
                  description="Browse available equipment and book something for your next project."
                  action={
                    <Link
                      href="/equipment"
                      className={buttonVariants({
                        className: `h-9 rounded-xl text-white shadow-sm hover:brightness-110 ${tone.gradient}`,
                      })}
                    >
                      Browse equipment <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <article key={booking.id} className={`p-4 transition-colors hover:border-slate-300 ${appSurfaces.softCard}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{booking.equipmentName}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(booking.rentalStartDate)} to {formatDate(booking.rentalEndDate)} · {booking.quantity} {booking.quantity === 1 ? "item" : "items"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">Booked: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "—"}</p>
                        </div>
                        <strong className="text-sm text-slate-900">{formatCurrency(booking.totalAmount)}</strong>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusPill value={booking.paymentStatus} />
                        <StatusPill value={booking.bookingStatus} />
                        {booking.equipment?.id ? (
                          <Link
                            href={`/equipment/${booking.equipment.id}`}
                            className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:brightness-90 ${tone.accentText}`}
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

            <Panel title="Quick actions" subtitle="Get things done faster" icon={Sparkles} soft={tone.iconTile} accent={tone.panelAccent}>
              <div className="space-y-3">
                {[
                  { label: "Browse all equipment", href: "/equipment", icon: PackageSearch },
                  { label: "Manage account details", href: "/account/profile", icon: Wrench },
                  { label: "View payment receipts", href: "/account/rentals", icon: CircleDollarSign },
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
            </Panel>
          </div>

          <Panel
            id="favorites"
            title="Favorite equipment"
            subtitle="Gear you saved for later"
            icon={Heart}
            soft={tone.iconTile}
            accent={tone.panelAccent}
            action={
              <Link href="/account/favorites" className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:brightness-90 ${tone.accentText}`}>
                Manage <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            }
          >
            {favorites.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Nothing saved yet"
                description="Tap the heart on any listing to keep it here for later."
                action={
                  <Link
                    href="/equipment"
                    className={buttonVariants({
                      className: `h-9 rounded-xl text-white shadow-sm hover:brightness-110 ${tone.gradient}`,
                    })}
                  >
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
                    <article key={favorite.favoriteId} className={`group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${appSurfaces.card}`}>
                      <div className="relative h-32 overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold text-slate-900">{item.name}</h3>
                          <Badge variant="secondary" className={`h-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] ${tone.softBadge}`}>
                            Saved
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{item.category} · {item.location}</p>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <strong className={`text-sm ${tone.accentText}`}>{formatCurrency(item.price)}</strong>
                          <div className="flex items-center gap-2">
                            <Link href={`/equipment/${item.id}`} className={`text-xs font-semibold transition-colors hover:brightness-90 ${tone.accentText}`}>
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

          <Panel title="Explore by category" subtitle="Find gear for whatever you're making" icon={PackageSearch} soft={tone.iconTile} accent={tone.panelAccent}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.name}
                    href={`/equipment?category=${encodeURIComponent(category.name)}`}
                    className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <span className={`block h-0.5 w-10 rounded-full bg-linear-to-r ${category.bar}`} />
                    <span className={`mt-3 grid size-10 place-items-center rounded-xl ${category.tile}`}>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">{category.name}</p>
                    <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium transition-colors ${tone.accentText}`}>
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
