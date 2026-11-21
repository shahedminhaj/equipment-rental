"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, CalendarDays, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { publicTone } from "../data/app-theme";
import { apiRequest, formatCurrency, rentalPeriod, type EquipmentListing } from "../lib/api";
import { GoogleSignInButton } from "./google-sign-in";
import { clearAuth, getStoredRole, saveAuth, type AuthUser } from "../lib/auth";
import { useToast } from "./toast-provider";

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type BookingQuote = {
  units: number;
  totalAmount: number;
  currency: string;
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

function formatPaymentAmount(amount: number, currency: string) {
  if (currency.toLowerCase() === "bdt") {
    return `৳ ${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(amount)}`;
  }
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return formatCurrency(amount);
  }
}

function FieldError({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs leading-relaxed text-rose-600" role="alert">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

const fieldClass =
  "h-10 rounded-xl border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-100";

export function EquipmentBooking({
  item,
  placement = "inline",
}: {
  item: EquipmentListing;
  placement?: "inline" | "mobile-bar";
}) {
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
  const [signedInRole, setSignedInRole] = useState<AuthUser["role"] | null>(null);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useToast();
  const quantityValue = Number(quantity);

  const units = useMemo(
    () => rentalUnits(startDate, endDate, item.rentalType),
    [endDate, item.rentalType, startDate],
  );
  const total = units * quantityValue * item.price;
  const displayedTotal = quote?.totalAmount ?? total;
  const displayedCurrency = quote?.currency || "bdt";
  const dateRangeInvalid = Boolean(startDate && endDate && !units);
  const quantityInvalid =
    !Number.isInteger(quantityValue) ||
    quantityValue < 1 ||
    quantityValue > item.availableQuantity;
  const wrongRole =
    Boolean(token) && signedInRole !== null && signedInRole !== "customer";
  const canBook =
    item.availableQuantity > 0 &&
    Boolean(startDate && endDate && units) &&
    !quantityInvalid &&
    !wrongRole &&
    Boolean(quote) &&
    !quoteLoading &&
    phone.trim().length >= 7 &&
    address.trim().length >= 5;

  useEffect(() => {
    if (!isOpen || !units || quantityInvalid) {
      setQuote(null);
      setQuoteLoading(false);
      setQuoteError("");
      return;
    }

    let active = true;
    setQuote(null);
    setQuoteLoading(true);
    setQuoteError("");
    const timeout = window.setTimeout(() => {
      apiRequest<BookingQuote>("/bookings/quote", {
        method: "POST",
        body: JSON.stringify({
          equipmentId: item.id,
          rentalStartDate: startDate,
          rentalEndDate: endDate,
          quantity: quantityValue,
        }),
      })
        .then((result) => {
          if (active) setQuote(result);
        })
        .catch((quoteFailure) => {
          if (active) {
            setQuoteError(
              quoteFailure instanceof Error ? quoteFailure.message : "Could not calculate the rental total.",
            );
          }
        })
        .finally(() => {
          if (active) setQuoteLoading(false);
        });
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [endDate, isOpen, item.id, quantityInvalid, quantityValue, startDate, units]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
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
    setSignedInRole(getStoredRole());
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
    setSignedInRole(null);
    setError("");
    notify("You have been signed out.", "info");
  }

  async function startCheckout(accessToken: string) {
    const result = await apiRequest<{ checkoutUrl?: string }>("/bookings", {
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
    if (!result.checkoutUrl) {
      throw new Error("The server did not return a Stripe Checkout link. Please try again.");
    }
    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(result.checkoutUrl);
    } catch {
      throw new Error("The server returned an invalid Stripe Checkout URL");
    }
    if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
      throw new Error("The server returned an invalid Stripe Checkout URL");
    }
    window.location.assign(checkoutUrl.toString());
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!canBook) {
      const reason = quoteError || (
        wrongRole
          ? "Please sign in with a customer account to book equipment."
          : dateRangeInvalid
            ? "Choose an end date on or after the start date."
            : quoteLoading
              ? "Checking the rental total. Try again in a moment."
              : !quote
                ? "We could not confirm the rental total. Check the connection and try again."
                : "Complete the rental details before continuing."
      );
      setError(reason);
      return;
    }

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
        if (authResponse.user.role !== "customer") {
          throw new Error("Bookings need a customer account. Please switch to a customer account first.");
        }
        accessToken = authResponse.token;
        saveAuth(accessToken, authResponse.user);
        setToken(accessToken);
        setSignedInEmail(authResponse.user.email);
        setSignedInRole(authResponse.user.role);
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
      setSignedInRole(authResponse.user.role);
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

  const triggerButton = (
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
      {item.availableQuantity > 0 && <ArrowRight className="size-4" aria-hidden="true" />}
    </Button>
  );

  return (
    <>
      {placement === "mobile-bar" ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.5)] backdrop-blur lg:hidden">
          {triggerButton}
          <p className="mt-1.5 text-center text-[10px] text-slate-500">Secure checkout with Stripe</p>
        </div>
      ) : (
        <div className="hidden lg:block">
          {triggerButton}
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
            Sign in or create an account to reserve this equipment and continue to Stripe Checkout.
          </p>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain p-4 sm:p-6">
          <button
            className="fixed inset-0 z-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
            type="button"
            aria-label="Close booking form"
            disabled={isSubmitting}
            onClick={closeModal}
          />
          <div className="relative z-10 mx-auto w-full max-w-lg">
          <div
            className="relative w-full bg-white shadow-2xl shadow-slate-950/30 sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
          >
            <div aria-hidden="true" className={cn("h-1 w-full shrink-0 bg-linear-to-r", publicTone.gradient)} />

            <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-2xl bg-linear-to-br text-white shadow-md",
                    publicTone.gradient,
                  )}
                  aria-hidden="true"
                >
                  <CalendarDays className="size-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-violet-700 uppercase">
                    Book this equipment
                  </p>
                  <h2 id="booking-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Plan your rental
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
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

            <form className="space-y-0" onSubmit={handleCheckout}>
              <div className="space-y-4 px-5 pb-5 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
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

                <div className="space-y-1.5">
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
                  {quantityInvalid && (
                    <FieldError>Enter a whole number from 1 to {item.availableQuantity}.</FieldError>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
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
                      placeholder="Where do you need it?"
                      required
                      value={address}
                      onChange={(event) => updateField(() => setAddress(event.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="booking-notes" className="text-xs font-semibold text-slate-700">
                    Additional notes <span className="font-normal text-slate-400">(optional)</span>
                  </Label>
                  <textarea
                    id="booking-notes"
                    rows={2}
                    maxLength={500}
                    placeholder="Anything the owner should know?"
                    value={notes}
                    onChange={(event) => updateField(() => setNotes(event.target.value))}
                    className={cn(fieldClass, "h-auto min-h-16 resize-y py-2 focus-visible:outline-none")}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  {token ? (
                    wrongRole ? (
                      <div className="space-y-3">
                        <p className="text-xs leading-relaxed text-rose-700">
                          You are signed in with a {signedInRole} account. Bookings require a customer account.
                        </p>
                        <p className="text-xs text-slate-500">Use a customer account to continue.</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                          <ShieldCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                          Signed in as <strong className="font-semibold text-slate-900">{signedInEmail || "your account"}</strong>
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm font-semibold text-slate-900">
                          {authMode === "login" ? "Sign in to continue" : "Create a customer account"}
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
                        <div className="space-y-1.5">
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
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
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
                        <div className="space-y-1.5">
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
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
                {error && (
                  <Alert
                    variant="destructive"
                    className="mb-3 rounded-xl border-rose-100 bg-rose-50/70 px-3 py-2 text-rose-900"
                  >
                    <TriangleAlert className="size-4" aria-hidden="true" />
                    <AlertDescription className="text-xs leading-relaxed text-rose-900">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-700">Rental total</span>
                    <small className="block text-[11px] text-slate-500">
                      {units
                        ? `${units} ${item.rentalType.toLowerCase()} ${units === 1 ? "period" : "periods"} × ${quantityValue || 0}`
                        : `Rate: ${formatCurrency(item.price)} per ${rentalPeriod(item.rentalType)}`}
                    </small>
                  </div>
                  <strong className="shrink-0 text-xl font-bold tracking-tight text-slate-900">
                    {formatPaymentAmount(displayedTotal, displayedCurrency)}
                  </strong>
                </div>
                {quoteError ? <p className="mb-2 text-xs text-rose-600" role="alert">{quoteError}</p> : null}
                <div className="grid grid-cols-2 gap-2">
                  {token ? (
                    <Button
                      className="h-10 w-full rounded-full px-3 text-xs font-semibold text-slate-600"
                      variant="ghost"
                      type="button"
                      disabled={isSubmitting}
                      onClick={signOut}
                    >
                      Sign out
                    </Button>
                  ) : <span className="self-center text-[10px] text-slate-400">Secure Stripe Checkout</span>}
                  <Button
                    className="h-10 w-full rounded-full px-3 text-xs font-semibold text-slate-600"
                    variant="outline"
                    type="button"
                    disabled={isSubmitting}
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={cn(
                      "col-span-2 h-11 w-full rounded-full px-5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20",
                      "bg-linear-to-r transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:via-fuchsia-500 hover:to-rose-400",
                      publicTone.gradient,
                    )}
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Opening secure checkout..." : "Continue to secure checkout"}
                    {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
                  </Button>
                </div>
                <p className="mt-2 text-center text-[10px] text-slate-400">Card details are entered securely on Stripe.</p>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
