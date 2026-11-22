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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { appSurfaces, roleTones } from "../data/app-theme";
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
  quantity?: number;
  totalAmount: number;
  customer?: { name?: string; email?: string } | null;
};
type OwnerAnalytics = {
  totalListedEquipment: number;
  completedRentals: number;
  totalEarnings: number;
  monthlyEarnings: { month: string; earnings: number }[];
};

const tone = roleTones.owner;
const statGradient = "linear-gradient(135deg, #4b6337, #6f8f4c, #9aa95e)";
const statSoft = "#f1f4e3";
const statPalettes = [
  { gradient: "linear-gradient(135deg, #4b6337, #8ca65a)", soft: "#f1f4e3" },
  { gradient: "linear-gradient(135deg, #256a7a, #58a6a2)", soft: "#eaf6f5" },
  { gradient: "linear-gradient(135deg, #a66035, #de9a5d)", soft: "#fff3e8" },
  { gradient: "linear-gradient(135deg, #70479b, #a66dc3)", soft: "#f4eef9" },
];
const heroGlow = "linear-gradient(135deg, #1b3224, #3b532f, #61733f)";

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
function monthLabel(month: string) {
  const date = new Date(`${month}-01T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? month : monthFormatter.format(date);
}

export function OwnerDashboard({ section = "overview" }: { section?: "overview" | "earnings" | "listings" | "bookings" }) {
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
  const [listingImage, setListingImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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

  async function handleListingImageUpload(file: File | null) {
    if (!file) return;
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      notify("Image upload is not configured. Please provide a direct image URL.", "error");
      return;
    }
    setIsUploadingImage(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { display_url?: string; url?: string };
        error?: { message?: string };
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || "Could not upload image");
      }
      const url = payload.data?.display_url || payload.data?.url || "";
      if (!url) throw new Error("Image upload did not return a URL");
      setListingImage(url);
      notify("Equipment image uploaded successfully.");
    } catch (uploadError) {
      notify(uploadError instanceof Error ? uploadError.message : "Could not upload image", "error");
    } finally {
      setIsUploadingImage(false);
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
      brand: String(data.get("brand") || "").trim(),
      model: String(data.get("model") || "").trim(),
      rentalTerms: String(data.get("rentalTerms") || "").split("\n").map((term) => term.trim()).filter(Boolean),
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
      setListingImage("");
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

  const statStyle = { gradient: statGradient, soft: statSoft };
  const stats = [
    {
      label: "Listed equipment",
      value: analytics?.totalListedEquipment ?? listings.length,
      hint: "Items in your inventory",
      icon: Package,
      ...statStyle,
    },
    {
      label: "Completed rentals",
      value: analytics?.completedRentals ?? 0,
      hint: "Successful handovers",
      icon: BadgeCheck,
      ...statStyle,
    },
    {
      label: "Paid earnings",
      value: formatCurrency(analytics?.totalEarnings ?? 0),
      hint: "From confirmed rentals",
      icon: Wallet,
      ...statStyle,
    },
    {
      label: "New requests",
      value: pendingBookings.length,
      hint: "Waiting for your answer",
      icon: CalendarDays,
      ...statStyle,
    },
  ];

  return (
    <DashboardShell
      role="owner"
      user={user}
      title={section === "overview" ? "Owner overview" : section === "earnings" ? "Earnings" : section === "listings" ? "My listings" : "Bookings"}
      description={section === "overview" ? "A quick look at your rental business. Choose a workspace section to manage details." : section === "earnings" ? "Track completed rentals and monthly earnings." : section === "listings" ? "Create and update equipment listings for your rental business." : "Review paid booking requests and rental status."}
      isLoading={isLoading}
      error={error}
      signOut={signOut}
      onRetry={refreshSession}
    >
      <HeroBanner
        gradient={heroGlow}
        eyebrow={section === "overview" ? "OWNER STUDIO" : "OWNER WORKSPACE"}
        title={section === "overview" ? `Good to see you, ${user?.name?.split(" ")[0] || "owner"}.` : section === "earnings" ? "Your rental earnings" : section === "listings" ? "Manage your equipment" : "Incoming bookings"}
        description={section === "overview" ? "Your workspace is organized by task. Pick a section from the sidebar to get started." : section === "earnings" ? "See how your rental business is performing over time." : section === "listings" ? "Create listings, update prices and quantities, and remove outdated gear." : "Respond to paid rental requests and keep bookings up to date."}
        action={section === "listings" ? (
          <Button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className={`dashboard-hero-cta h-9 rounded-xl bg-white px-4 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-white ${tone.accentText}`}
          >
            {showCreateForm ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {showCreateForm ? "Close form" : "List new equipment"}
          </Button>
        ) : null}
      />

      {dataError ? <PanelError message={dataError} /> : null}

      {section === "listings" && showCreateForm ? (
        <Panel title="Create a listing" subtitle="New listings go live after admin approval" icon={Plus} soft={tone.iconTile} accent={tone.panelAccent}>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={createListing}>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Equipment name
              <Input className="h-9" name="name" required maxLength={200} placeholder="e.g. Cordless drill kit" />
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Category
              <select name="category" required defaultValue="" className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200">
                <option value="" disabled>Select a category</option>
                <option>Construction Equipment</option>
                <option>Photography Equipment</option>
                <option>Vehicles &amp; Transportation</option>
                <option>Agriculture Equipment</option>
                <option>Electronics</option>
                <option>Event Equipment</option>
              </select>
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Location
              <Input className="h-9" name="location" required maxLength={200} placeholder="e.g. Dhaka" />
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Equipment Image (URL or imgbb upload)
              <Input
                className="h-9"
                name="image"
                type="url"
                required
                placeholder="https://..."
                value={listingImage}
                onChange={(event) => setListingImage(event.target.value)}
              />
              <Input
                className="h-auto py-1.5 text-xs"
                type="file"
                accept="image/*"
                onChange={(event) => void handleListingImageUpload(event.target.files?.[0] || null)}
              />
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Price per period (৳)
              <Input className="h-9" name="price" type="number" min="1" required />
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Rental type
              <select
                name="rentalType"
                defaultValue="Daily"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              >
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Available quantity
              <Input className="h-9" name="availableQuantity" type="number" min="1" defaultValue="1" required />
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Condition
              <Input className="h-9" name="condition" maxLength={200} placeholder="e.g. Excellent" required />
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Brand
              <Input className="h-9" name="brand" required maxLength={100} placeholder="e.g. Kubota" />
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600">
              Model
              <Input className="h-9" name="model" required maxLength={100} placeholder="e.g. U17-3" />
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600 md:col-span-2">
              Description
              <textarea
                name="description"
                rows={3}
                maxLength={5000}
                required
                className="w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </Label>
            <Label className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-600 md:col-span-2">
              Rental terms and conditions (one per line)
              <textarea
                name="rentalTerms"
                rows={3}
                maxLength={2000}
                required
                placeholder="Return the equipment in good condition.&#10;Bring a valid photo ID at pickup."
                className="w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </Label>
            <div className="md:col-span-2">
              <Separator className="mb-4 bg-slate-200/80" />
              <Button
                type="submit"
                disabled={busyId === "new-listing" || isUploadingImage}
                className={`bg-linear-to-r text-white shadow-sm hover:brightness-110 ${tone.gradient}`}
              >
                {isUploadingImage ? "Uploading image..." : busyId === "new-listing" ? "Submitting..." : "Submit for approval"}
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      {dataLoading ? (
        <PanelLoading label="Loading your owner workspace..." />
      ) : (
        <>
          <div className={section === "overview" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" : "hidden"}>
            {stats.map((stat, index) => (
              <StatCard key={stat.label} {...stat} {...statPalettes[index % statPalettes.length]} />
            ))}
          </div>

          <div className={section === "overview" || section === "earnings" ? "grid gap-5 xl:grid-cols-3" : "hidden"}>
            <Panel
              id="analytics"
              title="Earnings overview"
              subtitle="Your monthly rental income"
              icon={TrendingUp}
              soft={tone.iconTile}
              accent={tone.panelAccent}
              className={section === "earnings" ? "xl:col-span-3" : "hidden"}
            >
              <MiniBars
                color={tone.bar}
                formatValue={(value) => formatCurrency(value)}
                items={(analytics?.monthlyEarnings ?? []).map(({ month, earnings }) => ({
                  label: monthLabel(month),
                  value: earnings,
                }))}
              />
            </Panel>
            <Panel title="Business tips" subtitle="Small moves, bigger returns" icon={CircleDollarSign} soft={tone.iconTile} accent={tone.panelAccent} className={section === "overview" ? "" : "hidden"}>
              <ul className="space-y-3 text-sm leading-relaxed text-slate-600">
                {[
                  "Approved listings appear in marketplace search instantly.",
                  "Responding to requests the same day improves booking rates.",
                  "Keep prices competitive in your category to stay booked.",
                ].map((tip) => (
                  <li className="flex gap-2.5" key={tip}>
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full bg-linear-to-r ${tone.gradient}`} />
                    {tip}
                  </li>
                ))}
              </ul>
              <Link
                href="/equipment"
                className={`mt-5 inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:brightness-90 ${tone.accentText}`}
              >
                See how others list gear <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </Panel>
          </div>

          <Panel
            id="inventory"
            className={section === "listings" ? "" : "hidden"}
            title="My listings"
            subtitle="Edit prices, quantities, and remove outdated equipment"
            icon={Package}
            soft={tone.iconTile}
            accent={tone.panelAccent}
          >
            {listings.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No listings yet"
                description="Add your first piece of equipment to start earning from it."
                action={
                  <Button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className={`bg-linear-to-r text-white shadow-sm hover:brightness-110 ${tone.gradient}`}
                  >
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
                    <article key={item.id} className={`flex flex-col gap-4 p-4 transition-colors hover:border-slate-300 md:flex-row md:items-center md:justify-between ${appSurfaces.softCard}`}>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                          <StatusPill value={item.status} />
                        </div>
                        {item.status === "approved" ? (
                          <Link href={`/equipment/${item.id}`} className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${tone.accentText}`}>
                            View details <ArrowUpRight size={13} aria-hidden="true" />
                          </Link>
                        ) : null}
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
                        <Label className="flex flex-col items-start gap-1 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                          Price
                          <Input
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
                            className="h-8 w-24 text-sm"
                          />
                        </Label>
                        <Label className="flex flex-col items-start gap-1 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                          Qty
                          <Input
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
                            className="h-8 w-16 text-sm"
                          />
                        </Label>
                        <Button type="submit" size="sm" disabled={busyId === item.id} className="bg-slate-900 text-white hover:bg-slate-800">
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busyId === item.id}
                          className="text-[#9a3f37] hover:bg-[#fff7f6]"
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
            className={section === "bookings" ? "" : "hidden"}
            title="Rental requests"
            subtitle="Paid bookings for your equipment"
            icon={CalendarDays}
            soft={tone.iconTile}
            accent={tone.panelAccent}
            action={
              <Badge variant="secondary" className={`h-auto rounded-full px-3 py-1 ${tone.softBadge}`}>
                {pendingBookings.length} new
              </Badge>
            }
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
                  <article key={booking.id} className={`p-4 transition-colors hover:border-slate-300 ${appSurfaces.softCard}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{booking.equipmentName}</h3>
                          <StatusPill value={booking.bookingStatus} />
                          <StatusPill value={booking.paymentStatus} />
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <Avatar size="sm" className={tone.softBadge}>
                            <AvatarFallback className={`bg-transparent text-[9px] font-bold ${tone.accentText}`}>
                              {(booking.customer?.name || booking.customer?.email || "Customer")
                                .split(/[\s@.]+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase())
                                .join("") || "C"}
                            </AvatarFallback>
                          </Avatar>
                          {booking.rentalStartDate} to {booking.rentalEndDate} · {booking.customer?.name || booking.customer?.email || "Customer"}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Quantity: {booking.quantity ?? 1}</p>
                      </div>
                      <strong className="text-sm text-slate-900">{formatCurrency(booking.totalAmount)}</strong>
                    </div>
                    {booking.bookingStatus === "pending" ? (
                      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyId === booking.id}
                          className={`bg-linear-to-r text-white shadow-sm hover:brightness-110 ${tone.gradient}`}
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
                          className="border-[#f0d6d3] text-[#9a3f37] hover:bg-[#fff7f6]"
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
