"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
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
      <SiteHeader />
      <main className="payment-result-page">{children}</main>
      <SiteFooter />
    </>
  );
}

export function PaymentCancelledFromQuery() {
  const searchParams = useSearchParams();
  return <PaymentCancelled bookingId={searchParams.get("booking_id") || ""} />;
}

export function PaymentSuccess({ sessionId }: { sessionId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
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
        setError("Sign in again to view your booking status.");
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
      <section className="payment-result-card">
        <p className="eyebrow">STRIPE CHECKOUT</p>
        <h1>{booking?.paymentStatus === "paid" ? "Payment confirmed" : "Payment received"}</h1>
        {isLoading ? (
          <p role="status">Checking your payment and booking status...</p>
        ) : error ? (
          <p className="payment-result-error" role="alert">{error}</p>
        ) : booking?.paymentStatus === "paid" ? (
          <>
            <p>Your payment is confirmed. The equipment owner can now review your booking.</p>
            <dl>
              <div><dt>Equipment</dt><dd>{booking.equipmentName}</dd></div>
              <div><dt>Rental dates</dt><dd>{booking.rentalStartDate} to {booking.rentalEndDate}</dd></div>
              <div><dt>Amount paid</dt><dd>{formatCurrency(booking.totalAmount)}</dd></div>
              <div><dt>Booking status</dt><dd>{booking.bookingStatus}</dd></div>
            </dl>
          </>
        ) : booking?.paymentStatus === "failed" ? (
          <p className="payment-result-error" role="alert">
            Stripe did not confirm this payment. No active booking remains.
          </p>
        ) : (
          <p>Stripe returned successfully; payment confirmation is still processing. Check your bookings shortly.</p>
        )}
        <Link className="button button-dark" href="/equipment">Browse equipment</Link>
      </section>
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
        setMessage("Sign in again to release the temporary reservation.");
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
      <section className="payment-result-card">
        <p className="eyebrow">STRIPE CHECKOUT</p>
        <h1>Checkout cancelled</h1>
        {error ? (
          <p className="payment-result-error" role="alert">{error}</p>
        ) : (
          <p role="status">{message}</p>
        )}
        <Link className="button button-dark" href="/equipment">Return to equipment</Link>
      </section>
    </ResultLayout>
  );
}
