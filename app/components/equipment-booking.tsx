"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUpRight, CalendarDays, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "../data/app-theme";
import { apiRequest, formatCurrency, rentalPeriod, type EquipmentListing } from "../lib/api";
import { GoogleSignInButton } from "./google-sign-in";
import { clearAuth, saveAuth, type AuthUser } from "../lib/auth";
import { useToast } from "./toast-provider";

type AuthResponse = {
  token: string;
  user: AuthUser;
};

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rentalUnits(start: string, end: string, rentalType: string) {
  if (!start || !end) return 0;

  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return 0;
  }

  const days = Math.max(1, Math.ceil((endTime - startTime) / 86_400_000));
  if (rentalType === "Weekly") return Math.ceil(days / 7);
  if (rentalType === "Monthly") return Math.ceil(days / 30);
  return days;
}

function FieldError({ children }: { children: ReactNode }) {
  return (
    <Alert
      variant="destructive"
      className="rounded-xl border-rose-100 bg-rose-50/70 px-3 py-2 text-rose-900"
    >
      <TriangleAlert className="size-4" aria-hidden="true" />
      <AlertDescription className="text-xs leading-relaxed text-rose-900">
        {children}
      </AlertDescription>
    </Alert>
  );
}

const fieldClass =
  "h-10 rounded-xl border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-100";

const bookingSteps = ["01 · Rental", "02 · Details", "03 · Payment"];

export function EquipmentBooking({ item }: { item: EquipmentListing }) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [today, setToday] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useToast();
  const quantityValue = Number(quantity);

  const units = useMemo(
    () => rentalUnits(startDate, endDate, item.rentalType),
    [endDate, item.rentalType, startDate],
  );
  const total = units * quantityValue * item.price;
  const dateRangeInvalid = Boolean(startDate && endDate && !units);
  const quantityInvalid =
    !Number.isInteger(quantityValue) ||
    quantityValue < 1 ||
    quantityValue > item.availableQuantity;
  const canBook =
    item.availableQuantity > 0 &&
    Boolean(startDate && endDate && units) &&
    !quantityInvalid &&
    phone.trim().length >= 7 &&
    address.trim().length >= 5;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting]);

  function closeModal() {
    if (isSubmitting) return;
    setIsOpen(false);
    setError("");
  }

  function openModal() {
    setToday(localDateValue(new Date()));
    setError("");
    setToken(window.localStorage.getItem("fieldkit_token") || "");
    setSignedInEmail(window.localStorage.getItem("fieldkit_user_email") || "");
    setIsOpen(true);
  }

  function updateField(update: () => void) {
    update();
    setError("");
  }

  function signOut() {
    clearAuth();
    setToken("");
    setSignedInEmail("");
    notify("You have been signed out.", "info");
  }

  async function startCheckout(accessToken: string) {
    const result = await apiRequest<{ checkoutUrl: string }>("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        equipmentId: item.id,
        rentalStartDate: startDate,
        rentalEndDate: endDate,
        quantity: quantityValue,
        contactNumber: phone.trim(),
        deliveryAddress: address.trim(),
        notes: notes.trim(),
      }),
    });
    const checkoutUrl = new URL(result.checkoutUrl);
    if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
      throw new Error("The server returned an invalid Stripe Checkout URL");
    }
    window.location.assign(checkoutUrl.toString());
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canBook || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      let accessToken = token;
      if (!accessToken) {
        const authResponse = await apiRequest<AuthResponse>(
          authMode === "register" ? "/auth/register" : "/auth/login",
          {
            method: "POST",
            body: JSON.stringify(
              authMode === "register"
                ? { name: name.trim(), email: email.trim(), password }
                : { email: email.trim(), password },
            ),
          },
        );
        accessToken = authResponse.token;
        saveAuth(accessToken, authResponse.user);
        setToken(accessToken);
        setSignedInEmail(authResponse.user.email);
        notify(
          authMode === "register"
            ? "Account created. Redirecting to Stripe..."
            : "Signed in. Redirecting to Stripe...",
        );
      }
      await startCheckout(accessToken);
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout. Please try again.";
      notify(message, "error");
      setError(message);
      setIsSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    setIsSubmitting(true);
    setError("");
    try {
      const authResponse = await apiRequest<AuthResponse>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });
      saveAuth(authResponse.token, authResponse.user);
      setToken(authResponse.token);
      setSignedInEmail(authResponse.user.email);
      notify("Google account connected. Redirecting to Stripe...");
      await startCheckout(authResponse.token);
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Google sign-in or checkout failed";
      notify(message, "error");
      setError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        className={cn(
          "h-11 w-full justify-between rounded-full px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20",
          "bg-linear-to-r transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:via-fuchsia-500 hover:to-rose-400",
          publicTone.gradient,
        )}
        type="button"
        disabled={!item.availableQuantity}
        onClick={openModal}
      >
        {item.availableQuantity ? "Book and pay securely" : "Currently unavailable"}
        {item.availableQuantity > 0 && <ArrowUpRight className="size-4" aria-hidden="true" />}
      </Button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
        Sign in or create an account to reserve this equipment and continue to
        Stripe Checkout.
      </p>

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
            type="button"
            aria-label="Close booking form"
            disabled={isSubmitting}
            onClick={closeModal}
          />
          <Card
            className={cn(
              appSurfaces.card,
              "relative z-10 max-h-[90vh] w-full max-w-lg gap-0 overflow-y-auto py-0 shadow-2xl shadow-slate-950/25",
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
          >
            <div aria-hidden="true" className={cn("h-1 w-full bg-linear-to-r", publicTone.gradient)} />

            <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br text-white shadow-md",
                    publicTone.gradient,
                  )}
                  aria-hidden="true"
                >
                  <CalendarDays className="size-5" />
                </span>
                <div>
                  <p className={cn("text-[10px] font-bold tracking-[0.16em] uppercase", publicTone.accentText)}>
                    SECURE RENTAL CHECKOUT
                  </p>
                  <h2 id="booking-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    Plan your rental.
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {item.name} · {formatCurrency(item.price)} / {rentalPeriod(item.rentalType)}
                  </p>
                </div>
              </div>
              <button
                className="grid size-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                type="button"
                aria-label="Close booking form"
                disabled={isSubmitting}
                onClick={closeModal}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="px-6 pt-6 sm:px-8" aria-label="Booking steps">
              <div className="flex flex-wrap gap-2">
                {bookingSteps.map((step, index) => (
                  <Badge
                    key={step}
                    variant={index === 0 ? "default" : "outline"}
                    className={cn(
                      "h-auto rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.08em]",
                      index === 0
                        ? cn("border-transparent text-white shadow-sm", "bg-linear-to-r", publicTone.gradient)
                        : "border-slate-200 bg-white text-slate-500",
                    )}
                  >
                    {step}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator className="mt-5" />

            <form className="flex flex-col gap-5 px-6 py-6 sm:px-8" onSubmit={handleCheckout}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="booking-start" className="text-xs font-semibold text-slate-700">
                    Rental start date
                  </Label>
                  <Input
                    id="booking-start"
                    className={fieldClass}
                    type="date"
                    min={today}
                    required
                    value={startDate}
                    onChange={(event) => updateField(() => setStartDate(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-end" className="text-xs font-semibold text-slate-700">
                    Rental end date
                  </Label>
                  <Input
                    id="booking-end"
                    className={fieldClass}
                    type="date"
                    min={startDate || today}
                    required
                    value={endDate}
                    onChange={(event) => updateField(() => setEndDate(event.target.value))}
                  />
                </div>
              </div>
              {dateRangeInvalid && (
                <FieldError>End date must be the same as or later than the start date.</FieldError>
              )}

              <div className="space-y-2">
                <Label htmlFor="booking-quantity" className="text-xs font-semibold text-slate-700">
                  Required quantity
                </Label>
                <Input
                  id="booking-quantity"
                  className={fieldClass}
                  type="number"
                  min="1"
                  max={item.availableQuantity}
                  step="1"
                  required
                  value={quantity}
                  onChange={(event) => updateField(() => setQuantity(event.target.value))}
                />
              </div>
              {quantityInvalid && (
                <FieldError>Enter a whole number from 1 to {item.availableQuantity}.</FieldError>
              )}

              <div className="space-y-2">
                <Label htmlFor="booking-phone" className="text-xs font-semibold text-slate-700">
                  Contact number
                </Label>
                <Input
                  id="booking-phone"
                  className={fieldClass}
                  type="tel"
                  autoComplete="tel"
                  minLength={7}
                  maxLength={30}
                  placeholder="Your phone number"
                  required
                  value={phone}
                  onChange={(event) => updateField(() => setPhone(event.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-address" className="text-xs font-semibold text-slate-700">
                  Delivery or pickup address
                </Label>
                <Input
                  id="booking-address"
                  className={fieldClass}
                  type="text"
                  autoComplete="street-address"
                  minLength={5}
                  maxLength={300}
                  placeholder="Where do you need the equipment?"
                  required
                  value={address}
                  onChange={(event) => updateField(() => setAddress(event.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-notes" className="text-xs font-semibold text-slate-700">
                  Additional notes <span className="text-[11px] font-normal text-slate-400">Optional</span>
                </Label>
                <textarea
                  id="booking-notes"
                  rows={3}
                  maxLength={500}
                  placeholder="Anything the owner should know?"
                  value={notes}
                  onChange={(event) => updateField(() => setNotes(event.target.value))}
                  className={cn(
                    fieldClass,
                    "h-auto min-h-20 resize-y py-2 focus-visible:outline-none",
                  )}
                />
              </div>

              <Card
                className={cn(
                  appSurfaces.softCard,
                  "relative gap-0 border-violet-100 bg-violet-50/60 py-3",
                )}
              >
                <div aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-0.5 bg-linear-to-r", publicTone.gradient)} />
                <CardContent className="px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-700">
                        Estimated total
                      </span>
                      <small className="mt-1 block text-[11px] leading-relaxed text-slate-500">
                        {units
                          ? `${units} ${item.rentalType.toLowerCase()} ${units === 1 ? "period" : "periods"} × ${quantityValue || 0}`
                          : `Rate: ${formatCurrency(item.price)} per ${rentalPeriod(item.rentalType)}`}
                      </small>
                    </div>
                    <strong className="shrink-0 text-xl font-bold tracking-tight text-slate-900">
                      {formatCurrency(total)}
                    </strong>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(appSurfaces.softCard, "gap-0 border-slate-200/80 bg-slate-50/70 py-0")}>
                <CardContent className="space-y-4 p-4">
                  {token ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                        <ShieldCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        Signed in as <strong className="font-semibold text-slate-900">{signedInEmail || "your account"}</strong>
                      </span>
                      <Button
                        className="h-7 rounded-full px-3 text-xs font-semibold text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={signOut}
                      >
                        Sign out
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <strong className="text-sm font-semibold text-slate-900">
                          {authMode === "login" ? "Sign in to book" : "Create a renter account"}
                        </strong>
                        <Button
                          className="h-auto p-0 text-xs font-semibold text-violet-700 hover:text-fuchsia-700"
                          variant="link"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setAuthMode(authMode === "login" ? "register" : "login");
                            setError("");
                          }}
                        >
                          {authMode === "login" ? "Create account" : "I already have an account"}
                        </Button>
                      </div>
                      {authMode === "register" && (
                        <div className="space-y-2">
                          <Label htmlFor="booking-name" className="text-xs font-semibold text-slate-700">
                            Name
                          </Label>
                          <Input
                            id="booking-name"
                            className={fieldClass}
                            type="text"
                            autoComplete="name"
                            minLength={2}
                            maxLength={100}
                            required
                            value={name}
                            onChange={(event) => updateField(() => setName(event.target.value))}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="booking-email" className="text-xs font-semibold text-slate-700">
                          Email
                        </Label>
                        <Input
                          id="booking-email"
                          className={fieldClass}
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(event) => updateField(() => setEmail(event.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="booking-password" className="text-xs font-semibold text-slate-700">
                          Password
                        </Label>
                        <Input
                          id="booking-password"
                          className={fieldClass}
                          type="password"
                          autoComplete={authMode === "login" ? "current-password" : "new-password"}
                          minLength={6}
                          required
                          value={password}
                          onChange={(event) => updateField(() => setPassword(event.target.value))}
                        />
                      </div>
                      <div className="flex justify-center pt-1">
                        <GoogleSignInButton
                          onCredential={handleGoogleCredential}
                          onError={(message) => {
                            notify(message, "error");
                            setError(message);
                          }}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {error && <FieldError>{error}</FieldError>}

              <div className="flex items-center justify-end gap-3 pt-1">
                <Button
                  className="h-10 rounded-full border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  variant="outline"
                  type="button"
                  disabled={isSubmitting}
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  className={cn(
                    "h-10 rounded-full px-5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20",
                    "bg-linear-to-r transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:via-fuchsia-500 hover:to-rose-400",
                    publicTone.gradient,
                  )}
                  type="submit"
                  disabled={!canBook || isSubmitting}
                >
                  {isSubmitting ? "Preparing checkout..." : "Continue to Stripe"}
                  {!isSubmitting && <ArrowUpRight className="size-4" aria-hidden="true" />}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
