"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MessageSquareText, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { appSurfaces, roleTones } from "../data/app-theme";
import { apiRequest } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { EmptyState, Panel } from "./dashboard-ui";
import { useToast } from "./toast-provider";
import { useDashboardSession } from "./use-dashboard-session";

type Booking = {
  id: string;
  equipmentName: string;
  bookingStatus: string;
  paymentStatus: string;
};
type Review = { id: string; bookingId: string; rating: number; quote: string; createdAt: string };

export function CustomerReviews() {
  const { user, token, isLoading, error, signOut, refreshSession } = useDashboardSession("customer");
  const { notify } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");
  const [rating, setRating] = useState("5");
  const [quote, setQuote] = useState("");
  const [selectedBooking, setSelectedBooking] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const tone = roleTones.customer;

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoadingData(true);
    setDataError("");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiRequest<{ items: Booking[] }>("/bookings/mine", { headers }),
      apiRequest<{ items: Review[] }>("/reviews/mine", { headers }),
    ])
      .then(([bookingResponse, reviewResponse]) => {
        if (!active) return;
        setBookings(bookingResponse.items);
        setReviews(reviewResponse.items);
      })
      .catch((loadError) => {
        if (active) setDataError(loadError instanceof Error ? loadError.message : "Could not load your reviews.");
      })
      .finally(() => { if (active) setLoadingData(false); });
    return () => { active = false; };
  }, [token, reloadKey]);

  const eligibleBookings = bookings.filter(
    (booking) => booking.bookingStatus.toLowerCase() === "completed"
      && booking.paymentStatus.toLowerCase() === "paid"
      && !reviews.some((review) => review.bookingId === booking.id),
  );

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedBooking || submitting) return;
    setSubmitting(true);
    try {
      await apiRequest("/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: selectedBooking, rating: Number(rating), quote: quote.trim() }),
      });
      notify("Thanks for sharing your rental experience.");
      setQuote("");
      setRating("5");
      setSelectedBooking("");
      setReloadKey((key) => key + 1);
    } catch (submitError) {
      notify(submitError instanceof Error ? submitError.message : "Could not submit your review.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell
      role="customer"
      user={user}
      title="Your reviews"
      description="Rate completed rentals and share your experience with the Fieldkit community."
      isLoading={isLoading || loadingData}
      error={error || dataError}
      signOut={signOut}
      onRetry={() => { refreshSession(); setReloadKey((key) => key + 1); }}
    >
      <Panel title="Write a review" subtitle="Reviews are available for completed, paid rentals." icon={Star} soft={tone.iconTile} accent={tone.panelAccent}>
        {eligibleBookings.length ? (
          <form onSubmit={(event) => void submitReview(event)} className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
              Completed rental
              <select required value={selectedBooking} onChange={(event) => setSelectedBooking(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800">
                <option value="">Choose equipment</option>
                {eligibleBookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.equipmentName}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
              Your rating
              <select value={rating} onChange={(event) => setRating(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800">
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} out of 5 stars</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-slate-600 sm:col-span-2">
              Your experience
              <textarea required minLength={10} maxLength={1000} rows={4} value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="How was the equipment and rental experience?" className="resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-[#cfe0bf]" />
            </label>
            <Button type="submit" disabled={submitting || !selectedBooking || quote.trim().length < 10} className={cn("w-fit rounded-full text-white", tone.gradient)}>
              <MessageSquareText size={15} /> {submitting ? "Submitting..." : "Submit review"}
            </Button>
          </form>
        ) : (
          <EmptyState icon={Star} title="No rentals to review yet" description="Once a paid rental is marked completed, you can leave its rating and review here." />
        )}
      </Panel>

      <Panel title="Your submitted reviews" subtitle="Your feedback helps other renters choose with confidence." icon={MessageSquareText} soft={tone.iconTile} accent={tone.panelAccent} action={<Badge variant="secondary" className={cn("h-auto rounded-full px-3 py-1", tone.softBadge)}>{reviews.length} reviews</Badge>}>
        {reviews.length ? (
          <div className="grid gap-3">
            {reviews.map((review) => (
              <Card key={review.id} className={cn(appSurfaces.softCard, "rounded-2xl")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} className={index < review.rating ? "fill-current" : "text-slate-300"} />)}
                    <span className="ml-1 text-xs font-bold">{review.rating}/5</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">“{review.quote}”</p>
                  <p className="mt-2 text-[11px] text-slate-500">{new Date(review.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={MessageSquareText} title="No reviews submitted" description="Your reviews will be listed here after you share feedback on a completed rental." />
        )}
      </Panel>
    </DashboardShell>
  );
}
