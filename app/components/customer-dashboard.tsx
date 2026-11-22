"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  Heart,
  PackageSearch,
  Sparkles,
  Tractor,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  TakaSign,
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

const tone = roleTones.customer;
const statGradient = "linear-gradient(135deg, #315c3c, #4f7b4e, #6d9189)";
const statSoft = "#e9f2ea";
const statPalettes = [
  { gradient: "linear-gradient(135deg, #315c3c, #6f9b5c)", soft: "#edf5e8" },
  { gradient: "linear-gradient(135deg, #256a7a, #58a6a2)", soft: "#eaf6f5" },
  { gradient: "linear-gradient(135deg, #70479b, #a66dc3)", soft: "#f4eef9" },
  { gradient: "linear-gradient(135deg, #b16a2f, #e2a64d)", soft: "#fff5e8" },
];
const heroGlow = "linear-gradient(135deg, #1b3224, #315c3c, #396b5c)";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

const categoryLooks = [
  { icon: Wrench, tile: "bg-orange-100 text-orange-700", bar: "from-orange-400 to-amber-500", surface: "border-orange-200/80 from-white to-orange-50/80" },
  { icon: Camera, tile: "bg-lime-100 text-[#4c6d45]", bar: "from-[#5d8350] to-[#8fb361]", surface: "border-lime-200/80 from-white to-lime-50/80" },
  { icon: Truck, tile: "bg-sky-100 text-sky-700", bar: "from-sky-400 to-blue-500", surface: "border-sky-200/80 from-white to-sky-50/80" },
  { icon: Tractor, tile: "bg-emerald-100 text-emerald-700", bar: "from-emerald-400 to-teal-500", surface: "border-emerald-200/80 from-white to-emerald-50/80" },
  { icon: PackageSearch, tile: "bg-violet-100 text-violet-700", bar: "from-violet-400 to-fuchsia-500", surface: "border-violet-200/80 from-white to-violet-50/80" },
];

type DashboardCategory = { name: string; count: number };

function categoryIcon(name: string): LucideIcon {
  const value = name.toLowerCase();
  if (value.includes("photo") || value.includes("camera")) return Camera;
  if (value.includes("vehicle") || value.includes("transport")) return Truck;
  if (value.includes("agri") || value.includes("farm")) return Tractor;
  if (value.includes("construction")) return Wrench;
  return PackageSearch;
}

export function CustomerDashboard() {
  const { user, token, isLoading, error, signOut, refreshSession } = useDashboardSession("customer");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [categories, setCategories] = useState<DashboardCategory[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest<{ items: DashboardCategory[] }>("/equipment/categories")
      .then(({ items }) => {
        if (active) setCategories(items);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };

    async function loadCustomerData() {
      setDataLoading(true);
      setDataError("");
      const [bookingsResult, favoritesResult] = await Promise.allSettled([
        apiRequest<{ items: Booking[] }>("/bookings/mine", { headers }),
        apiRequest<{ items: Favorite[] }>("/favorites", { headers }),
      ]);

      if (!active) return;
      const failures: string[] = [];
      if (bookingsResult.status === "fulfilled") setBookings(bookingsResult.value.items);
      else failures.push("your rentals");
      if (favoritesResult.status === "fulfilled") setFavorites(favoritesResult.value.items);
      else failures.push("favorites");

      if (failures.length > 0) {
        let reason: unknown = null;
        if (bookingsResult.status === "rejected") reason = bookingsResult.reason;
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

  const dashboardBookings = bookings.filter(
    (booking) => !["cancelled", "rejected"].includes(booking.bookingStatus.toLowerCase()),
  );
  const paidBookingTotal = dashboardBookings
    .filter((booking) => booking.paymentStatus === "paid")
    .reduce((total, booking) => total + booking.totalAmount, 0);
  const activeBookings = dashboardBookings.filter((booking) =>
    ["pending", "confirmed"].includes(booking.bookingStatus.toLowerCase()),
  );
  const firstName = user?.name?.split(" ")[0] || "renter";

  const statStyle = { gradient: statGradient, soft: statSoft };
  const stats = [
    {
      label: "Total bookings",
      value: dashboardBookings.length,
      hint: "Cancelled requests excluded",
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
      hint: `${dashboardBookings.filter((booking) => booking.paymentStatus === "paid").length} confirmed payments`,
      icon: TakaSign,
      ...statStyle,
    },
  ];

  return (
    <DashboardShell
      role="customer"
      user={user}
      title="My rental overview"
      description="See your rental activity at a glance. Use the sidebar to open each workspace section."
      isLoading={isLoading}
      error={error}
      signOut={signOut}
      onRetry={refreshSession}
    >
      <HeroBanner
        gradient={heroGlow}
        eyebrow="YOUR RENTAL HUB"
        title={`Hey ${firstName}, ready for your next project?`}
        description="Your workspace is organized by task. Choose rentals, favorites, equipment, or profile from the sidebar."
        action={
          <Link
            href="/equipment"
            className={`dashboard-hero-cta inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5 ${tone.accentText}`}
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
            {stats.map((stat, index) => (
              <StatCard key={stat.label} {...stat} {...statPalettes[index % statPalettes.length]} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-1">
            <Panel
              id="rentals"
              title="Recent rentals"
              subtitle="Your latest booking activity"
              icon={CalendarDays}
              soft={tone.iconTile}
              accent={tone.panelAccent}
              className="hidden"
              action={
                <Link href="/account/rentals" className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:brightness-90 ${tone.accentText}`}>
                  View all <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              }
            >
              {dashboardBookings.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No rentals yet"
                  description="Browse available equipment and book something for your next project."
                  action={
                    <Link
                      href="/equipment"
                      className="dashboard-empty-cta inline-flex h-9 items-center gap-2 rounded-xl bg-[#315c3c] px-3 text-sm font-semibold shadow-sm transition-colors hover:bg-[#27492f]"
                    >
                      Browse equipment <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {dashboardBookings.slice(0, 5).map((booking) => (
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
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 rounded-xl border border-[#dce6d7] bg-[#f8faf5] p-3 transition-all hover:-translate-y-0.5 hover:border-[#b7cba9] hover:bg-white hover:shadow-sm"
                    >
                      <span className={`grid size-9 place-items-center rounded-lg ${tone.iconTile}`}>
                        <Icon size={16} aria-hidden={true} />
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
            className="hidden"
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
                    className="dashboard-empty-cta inline-flex h-9 items-center gap-2 rounded-xl bg-[#315c3c] px-3 text-sm font-semibold shadow-sm transition-colors hover:bg-[#27492f]"
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
                              className="text-[#b45247] hover:bg-[#fff7f6]"
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

          <Panel className="hidden" title="Explore by category" subtitle="Find gear for whatever you're making" icon={PackageSearch} soft={tone.iconTile} accent={tone.panelAccent}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, index) => {
                const look = categoryLooks[index % categoryLooks.length];
                const Icon = categoryIcon(category.name);
                return (
                  <Link
                    key={category.name}
                    href={`/equipment?category=${encodeURIComponent(category.name)}`}
                    className={`group overflow-hidden rounded-xl border bg-linear-to-br p-4 transition-all hover:-translate-y-1 hover:shadow-md ${look.surface}`}
                  >
                    <span className={`block h-0.5 w-10 rounded-full bg-linear-to-r ${look.bar}`} />
                    <span className={`mt-3 grid size-10 place-items-center rounded-xl ${look.tile}`}>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">{category.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{category.count} {category.count === 1 ? "listing" : "listings"}</p>
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
