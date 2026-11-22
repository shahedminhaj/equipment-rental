"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, CircleAlert, CircleCheck, Clock3, PackageSearch, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appSurfaces, roleTones } from "../data/app-theme";
import { apiRequest, formatCurrency } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { EmptyState, Panel, StatCard, StatusPill, TakaSign } from "./dashboard-ui";
import { useDashboardSession } from "./use-dashboard-session";
import { useToast } from "./toast-provider";

type Rental = {
  id: string;
  equipmentName: string;
  rentalStartDate: string;
  rentalEndDate: string;
  createdAt?: string;
  quantity: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  equipment?: { id: string } | null;
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function CustomerRentals() {
  const { user, token, isLoading, error, signOut, refreshSession } = useDashboardSession("customer");
  const { notify } = useToast();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoadingRentals, setIsLoadingRentals] = useState(true);
  const [rentalsError, setRentalsError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [rentalToRemove, setRentalToRemove] = useState<Rental | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const tone = roleTones.customer;

  const loadRentals = useCallback(async () => {
    if (!token) return;
    setIsLoadingRentals(true);
    setRentalsError("");
    try {
      const { items } = await apiRequest<{ items: Rental[] }>("/bookings/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRentals(items);
    } catch (loadError) {
      setRentalsError(loadError instanceof Error ? loadError.message : "Could not load your rentals.");
    } finally {
      setIsLoadingRentals(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRentals();
  }, [loadRentals, reloadKey]);

  useEffect(() => {
    if (!rentalToRemove || busyId) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setRentalToRemove(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [rentalToRemove, busyId]);

  const visibleRentals = useMemo(
    () => rentals.filter((rental) => rental.bookingStatus.toLowerCase() !== "cancelled"),
    [rentals],
  );
  const countedRentals = visibleRentals.filter((rental) => rental.bookingStatus.toLowerCase() !== "rejected");
  const pendingRentals = visibleRentals.filter((rental) => rental.bookingStatus.toLowerCase() === "pending");
  const paidTotal = countedRentals
    .filter((rental) => rental.paymentStatus.toLowerCase() === "paid")
    .reduce((sum, rental) => sum + rental.totalAmount, 0);

  async function cancelRental() {
    const rental = rentalToRemove;
    if (!token || !rental || busyId) return;
    setBusyId(rental.id);
    try {
      const response = await apiRequest<{ booking: Rental }>(`/bookings/${rental.id}/cancel-checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.booking.bookingStatus.toLowerCase() !== "cancelled") {
        throw new Error("The server could not cancel this booking. Restart the rental API and try again.");
      }
      setRentals((current) => current.filter((item) => item.id !== rental.id));
      setRentalToRemove(null);
      notify(rental.paymentStatus.toLowerCase() === "paid"
        ? "Booking cancelled. Your refund is being processed."
        : "Pending booking removed.");
    } catch (cancelError) {
      notify(cancelError instanceof Error ? cancelError.message : "Could not remove this booking.", "error");
    } finally {
      setBusyId("");
    }
  }

  const stats = [
    { label: "Bookings", value: countedRentals.length, hint: "Cancelled requests excluded", icon: CalendarDays, gradient: "linear-gradient(135deg, #315c3c, #6f9b5c)", soft: "#edf5e8" },
    { label: "Awaiting confirmation", value: pendingRentals.length, hint: "You can cancel pending requests", icon: Clock3, gradient: "linear-gradient(135deg, #b16a2f, #e2a64d)", soft: "#fff5e8" },
    { label: "Paid total", value: formatCurrency(paidTotal), hint: "Refunded bookings excluded", icon: TakaSign, gradient: "linear-gradient(135deg, #256a7a, #58a6a2)", soft: "#eaf6f5" },
  ];

  return (
    <DashboardShell
      role="customer"
      user={user}
      title="My rentals"
      description="Review booking status, manage pending requests, and keep track of your rental history."
      isLoading={isLoading || isLoadingRentals}
      error={error || rentalsError}
      signOut={signOut}
      onRetry={() => { refreshSession(); setReloadKey((key) => key + 1); }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <Panel
        id="rentals"
        title="Booking history"
        subtitle="Pending requests can be cancelled here. Paid cancellations are refunded."
        icon={CalendarDays}
        soft={tone.iconTile}
        accent={tone.panelAccent}
        action={<Badge variant="secondary" className={cn("h-auto rounded-full px-3 py-1", tone.softBadge)}>{visibleRentals.length} records</Badge>}
      >
        {visibleRentals.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No active rental records"
            description="Your booking history will appear here after you book equipment."
            action={
              <Link href="/equipment" className="dashboard-empty-cta inline-flex h-9 items-center gap-2 rounded-xl bg-[#315c3c] px-3 text-sm font-semibold shadow-sm transition-colors hover:bg-[#27492f]">
                Browse equipment <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {visibleRentals.map((rental) => {
              const isPending = rental.bookingStatus.toLowerCase() === "pending";
              return (
                <article key={rental.id} className={cn(appSurfaces.softCard, "rounded-2xl p-4 transition-shadow hover:shadow-md")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[#17241b]">{rental.equipmentName}</h3>
                      <p className="mt-1 text-xs text-[#5c675c]">
                        {formatDate(rental.rentalStartDate)} to {formatDate(rental.rentalEndDate)} · {rental.quantity} {rental.quantity === 1 ? "item" : "items"}
                      </p>
                      <p className="mt-1 text-xs text-[#7b867b]">Booked {rental.createdAt ? new Date(rental.createdAt).toLocaleDateString() : "—"}</p>
                    </div>
                    <strong className="text-sm font-bold text-[#17241b]">{formatCurrency(rental.totalAmount)}</strong>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#dce6d7] pt-3">
                    <StatusPill value={rental.paymentStatus} />
                    <StatusPill value={rental.bookingStatus} />
                    {rental.equipment?.id ? (
                      <Link href={`/equipment/${rental.equipment.id}`} className={cn("ml-auto inline-flex items-center gap-1 text-xs", appSurfaces.link)}>
                        View equipment <ArrowUpRight size={13} aria-hidden="true" />
                      </Link>
                    ) : null}
                    {isPending ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === rental.id}
                        onClick={() => setRentalToRemove(rental)}
                        className="border-[#f1c5bc] bg-[#fff5f2] text-[#a04437] hover:bg-[#ffeae5] hover:text-[#8f352d]"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        {busyId === rental.id ? "Removing..." : "Remove booking"}
                      </Button>
                    ) : rental.bookingStatus.toLowerCase() === "completed" ? (
                      <Badge variant="secondary" className="gap-1 rounded-full bg-emerald-100 text-emerald-800"><CircleCheck size={12} aria-hidden="true" /> Completed</Badge>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      {rentalToRemove ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close booking removal dialog"
            className="absolute inset-0 bg-[#102017]/55 backdrop-blur-sm"
            onClick={() => setRentalToRemove(null)}
          />
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-rental-title"
            aria-describedby="remove-rental-description"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#e0e6da] bg-white shadow-2xl shadow-[#102017]/25"
          >
            <div className="h-1.5 bg-linear-to-r from-[#c65c4d] via-[#df8c54] to-[#f1c779]" />
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff0eb] text-[#a04437] ring-1 ring-[#f1c5bc]">
                  <CircleAlert size={22} aria-hidden="true" />
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close dialog"
                  onClick={() => setRentalToRemove(null)}
                  className="rounded-full text-[#6d786d] hover:bg-[#f1f4ee] hover:text-[#17241b]"
                >
                  <X size={17} aria-hidden="true" />
                </Button>
              </div>
              <h2 id="remove-rental-title" className="mt-4 text-xl font-bold tracking-tight text-[#17241b]">
                Remove this booking?
              </h2>
              <p id="remove-rental-description" className="mt-2 text-sm leading-relaxed text-[#5c675c]">
                {rentalToRemove.paymentStatus.toLowerCase() === "paid"
                  ? "This pending request will be cancelled and the paid amount will be refunded to your original payment method."
                  : "This pending request will be cancelled and its checkout session will be closed."}
              </p>
              <div className="mt-5 rounded-2xl border border-[#e0e9dc] bg-[#f5f8ef] p-4">
                <p className="font-semibold text-[#203525]">{rentalToRemove.equipmentName}</p>
                <p className="mt-1 text-xs text-[#657365]">
                  {formatDate(rentalToRemove.rentalStartDate)} to {formatDate(rentalToRemove.rentalEndDate)}
                </p>
                <p className="mt-2 text-sm font-bold text-[#315c3c]">{formatCurrency(rentalToRemove.totalAmount)}</p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busyId === rentalToRemove.id}
                  onClick={() => setRentalToRemove(null)}
                  className="rounded-xl border-[#dce6d7] bg-white text-[#465448] hover:bg-[#f5f8ef]"
                >
                  Keep booking
                </Button>
                <Button
                  type="button"
                  disabled={busyId === rentalToRemove.id}
                  onClick={() => void cancelRental()}
                  className="rounded-xl bg-[#a04437] text-white hover:bg-[#87392f]"
                >
                  <Trash2 size={15} aria-hidden="true" />
                  {busyId === rentalToRemove.id ? "Removing..." : "Remove booking"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}
