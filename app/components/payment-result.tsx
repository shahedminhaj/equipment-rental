"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleCheck, TriangleAlert, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "../data/app-theme";
import { SiteFooter, SiteHeader } from "./site-shell";
import { apiRequest, formatCurrency } from "../lib/api";

type Booking = {
  id: string;
  equipmentName: string;
  rentalStartDate: string;
  rentalEndDate: string;
  totalAmount: number;
  currency: string;
  paymentStatus: "pending" | "paid" | "failed";
  bookingStatus: string;
};

function ResultLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader authPage />
      <main
        className={cn(
          appSurfaces.page,
          "relative isolate flex min-h-screen items-center justify-center overflow-x-clip px-5 py-12 sm:px-6",
        )}
      >
        <div aria-hidden="true" className={appSurfaces.pageGlow} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -bottom-40 size-[26rem] rounded-full bg-fuchsia-200/50 blur-[120px]"
        />
        <div className="relative w-full">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

function ResultCard({
  icon,
  title,
  children,
  ctaLabel,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  ctaLabel: string;
}) {
  return (
    <Card
      className={cn(
        appSurfaces.card,
        "relative mx-auto w-full max-w-xl gap-0 overflow-hidden text-center",
      )}
    >
      <div aria-hidden="true" className={cn("h-1 w-full bg-linear-to-r", publicTone.gradient)} />
      <CardContent className="px-6 pt-9 pb-10 sm:px-10">
        <span
          className={cn(
            "mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-linear-to-br text-white shadow-lg shadow-violet-500/20",
            publicTone.gradient,
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "mx-auto mb-4 h-auto rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase ring-1",
            publicTone.softBadge,
          )}
        >
          STRIPE CHECKOUT
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        <div className="mt-4">{children}</div>
        <Separator className="my-8" />
        <Link
          className={buttonVariants({
            className: cn(
              "h-10 rounded-full px-6 text-white shadow-lg shadow-fuchsia-500/20",
              "bg-linear-to-r hover:from-violet-500 hover:via-fuchsia-500 hover:to-rose-400",
              publicTone.gradient,
            ),
          })}
          href="/equipment"
        >
          {ctaLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

function ResultError({ message }: { message: string }) {
  return (
    <Alert
      variant="destructive"
      className="mx-auto max-w-md rounded-2xl border-rose-100 bg-rose-50/70 px-4 py-3 text-left text-rose-900"
    >
      <TriangleAlert className="size-4" aria-hidden="true" />
      <AlertDescription className="text-sm leading-relaxed text-rose-900">
        {message}
      </AlertDescription>
    </Alert>
  );
}

export function PaymentCancelledFromQuery() {
  const searchParams = useSearchParams();
  return <PaymentCancelled bookingId={searchParams.get("booking_id") || ""} />;
}

export function PaymentSuccess({ sessionId }: { sessionId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadBooking() {
      if (!sessionId) {
        setError("Missing Stripe Checkout session id.");
        setIsLoading(false);
        return;
      }
      const token = window.localStorage.getItem("fieldkit_token");
      if (!token) {
        setNotice("Payment submitted. Sign in to view your booking status.");
        setIsLoading(false);
        return;
      }

      try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const result = await apiRequest<{ booking: Booking }>(
            `/bookings/checkout/${encodeURIComponent(sessionId)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (cancelled) return;
          setBooking(result.booking);
          if (result.booking.paymentStatus !== "pending") break;
          if (attempt < 4) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load booking status");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadBooking();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <ResultLayout>
      <ResultCard
        icon={<CircleCheck className="size-7" aria-hidden="true" />}
        title={
          booking?.paymentStatus === "paid"
            ? "Payment confirmed"
            : notice
              ? "Checkout complete"
              : "Payment received"
        }
        ctaLabel="Browse equipment"
      >
        {isLoading ? (
          <div className="mx-auto max-w-sm space-y-3">
            <Skeleton className="mx-auto h-3 w-4/5 rounded-full" />
            <Skeleton className="mx-auto h-3 w-2/3 rounded-full" />
            <p className={cn(appSurfaces.body, "pt-1")} role="status">
              Checking your payment and booking status...
            </p>
          </div>
        ) : error ? (
          <ResultError message={error} />
        ) : notice ? (
          <p className={cn(appSurfaces.body, "mx-auto max-w-md")}>{notice}</p>
        ) : booking?.paymentStatus === "paid" ? (
          <>
            <p className={cn(appSurfaces.body, "mx-auto max-w-md")}>
              Your payment is confirmed. The equipment owner can now review your booking.
            </p>
            <dl className={cn(appSurfaces.softCard, "mt-6 overflow-hidden text-left")}>
              {[
                { label: "Equipment", value: booking.equipmentName },
                {
                  label: "Rental dates",
                  value: `${booking.rentalStartDate} to ${booking.rentalEndDate}`,
                },
                { label: "Amount paid", value: formatCurrency(booking.totalAmount) },
                { label: "Booking status", value: booking.bookingStatus },
              ].map((row, index) => (
                <div key={row.label}>
                  {index > 0 ? <Separator /> : null}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <dt className="text-slate-500">{row.label}</dt>
                    <dd className="m-0 text-right font-semibold text-slate-900">{row.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </>
        ) : booking?.paymentStatus === "failed" ? (
          <ResultError message="Stripe did not confirm this payment. No active booking remains." />
        ) : (
          <p className={cn(appSurfaces.body, "mx-auto max-w-md")}>
            Stripe returned successfully; payment confirmation is still processing. Check your
            bookings shortly.
          </p>
        )}
      </ResultCard>
    </ResultLayout>
  );
}

export function PaymentSuccessFromQuery() {
  const searchParams = useSearchParams();
  return <PaymentSuccess sessionId={searchParams.get("session_id") || ""} />;
}

export function PaymentCancelled({ bookingId }: { bookingId: string }) {
  const [message, setMessage] = useState("Releasing your temporary reservation...");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function cancelBooking() {
      if (!bookingId) {
        setError("Missing booking id; the temporary reservation could not be released.");
        return;
      }

      const token = window.localStorage.getItem("fieldkit_token");
      if (!token) {
        setMessage("Checkout cancelled. Sign in if you need to review this reservation.");
        return;
      }

      try {
        await apiRequest<{ booking: Booking }>(
          `/bookings/${encodeURIComponent(bookingId)}/cancel-checkout`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!cancelled) setMessage("Checkout was cancelled and the temporary reservation was released.");
      } catch (cancelError) {
        if (!cancelled) {
          setError(cancelError instanceof Error ? cancelError.message : "Could not cancel this checkout");
        }
      }
    }

    void cancelBooking();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <ResultLayout>
      <ResultCard
        icon={<X className="size-7" aria-hidden="true" />}
        title="Checkout cancelled"
        ctaLabel="Return to equipment"
      >
        <p className={cn(appSurfaces.body, "mx-auto mb-4 max-w-md")}>
          Stripe Checkout opens from the booking form on the equipment details page. Use
          &ldquo;Book and pay securely&rdquo; there to try again.
        </p>
        {error ? (
          <ResultError message={error} />
        ) : (
          <p className={cn(appSurfaces.body, "mx-auto max-w-md")} role="status">
            {message}
          </p>
        )}
      </ResultCard>
    </ResultLayout>
  );
}
